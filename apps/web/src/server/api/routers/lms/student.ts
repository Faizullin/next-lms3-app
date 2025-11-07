import {
  createDomainRequiredMiddleware,
  protectedProcedure,
} from "@/server/api/core/procedures";
import { router } from "@/server/api/core/trpc";
import { documentIdValidator } from "@/server/api/core/validators";
import { jsonify } from "@workspace/common-logic/lib/response";
import {
  AssignmentModel,
  AssignmentSubmissionModel,
  IAssignmentHydratedDocument,
} from "@workspace/common-logic/models/lms/assignment.model";
import { AssignmentSubmissionStatusEnum } from "@workspace/common-logic/models/lms/assignment.types";
import { ICohortHydratedDocument } from "@workspace/common-logic/models/lms/cohort.model";
import { ICourseHydratedDocument } from "@workspace/common-logic/models/lms/course.model";
import { EnrollmentModel } from "@workspace/common-logic/models/lms/enrollment.model";
import {
  CourseEnrollmentMemberTypeEnum,
  EnrollmentStatusEnum,
} from "@workspace/common-logic/models/lms/enrollment.types";
import { QuizAttemptModel } from "@workspace/common-logic/models/lms/quiz-attempt.model";
import { QuizAttemptStatusEnum } from "@workspace/common-logic/models/lms/quiz-attempt.types";
import { IQuizHydratedDocument } from "@workspace/common-logic/models/lms/quiz.model";
import { ScheduleEventModel } from "@workspace/common-logic/models/lms/schedule.model";
import {
  IScheduleEvent,
  RecurrenceTypeEnum,
  ScheduleStatusEnum,
} from "@workspace/common-logic/models/lms/schedule.types";
import { UserProgressModel } from "@workspace/common-logic/models/lms/user-progress.model";
import { IUserHydratedDocument } from "@workspace/common-logic/models/user.model";
import mongoose from "mongoose";
import { z } from "zod";

type IScheduleEventWithId = IScheduleEvent & {
  _id: mongoose.Types.ObjectId;
};

type ExpandedScheduleEvent = {
  event: IScheduleEventWithId;
  startDate: Date;
  endDate: Date;
  isRecurringInstance: boolean;
};

function expandRecurringEvents(
  events: IScheduleEventWithId[],
  startRange: Date,
  endRange: Date
) {
  const expanded: ExpandedScheduleEvent[] = [];

  for (const event of events) {
    if (
      event.recurrence?.type === RecurrenceTypeEnum.NONE ||
      !event.recurrence?.type
    ) {
      const eventStart = new Date(event.startDate);
      if (eventStart >= startRange && eventStart <= endRange) {
        expanded.push({
          event,
          startDate: eventStart,
          endDate: new Date(event.endDate),
          isRecurringInstance: false,
        });
      }
      continue;
    }

    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const duration = eventEnd.getTime() - eventStart.getTime();
    const recurrenceEnd = event.recurrence.endDate
      ? new Date(event.recurrence.endDate)
      : endRange;

    let current = new Date(eventStart);

    while (current <= endRange && current <= recurrenceEnd) {
      if (current >= startRange) {
        const occurrenceStart = new Date(current);
        const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

        let include = false;

        if (event.recurrence.type === RecurrenceTypeEnum.DAILY) {
          include = true;
        } else if (event.recurrence.type === RecurrenceTypeEnum.WEEKLY) {
          const day = occurrenceStart.getDay();
          include = event.recurrence.daysOfWeek?.length
            ? event.recurrence.daysOfWeek.includes(day)
            : day === eventStart.getDay();
        } else if (event.recurrence.type === RecurrenceTypeEnum.MONTHLY) {
          include = occurrenceStart.getDate() === eventStart.getDate();
        }

        if (include) {
          expanded.push({
            event,
            startDate: occurrenceStart,
            endDate: occurrenceEnd,
            isRecurringInstance: true,
          });
        }
      }

      if (event.recurrence.type === RecurrenceTypeEnum.DAILY) {
        current.setDate(current.getDate() + event.recurrence.interval);
      } else if (event.recurrence.type === RecurrenceTypeEnum.WEEKLY) {
        current.setDate(current.getDate() + 7 * event.recurrence.interval);
      } else if (event.recurrence.type === RecurrenceTypeEnum.MONTHLY) {
        current.setMonth(current.getMonth() + event.recurrence.interval);
      }
    }
  }

  return expanded.sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
}

async function getStudentUpcomingEvents({
  orgId,
  cohortIds,
  limit = 10,
}: {
  orgId: mongoose.Types.ObjectId | string;
  cohortIds: mongoose.Types.ObjectId[];
  limit?: number;
}) {
  if (!cohortIds.length) return [];

  const now = new Date();
  const rangeEnd = new Date(now);
  rangeEnd.setDate(now.getDate() + 7);

  const events = await ScheduleEventModel.find({
    orgId,
    cohortId: { $in: cohortIds },
    status: ScheduleStatusEnum.ACTIVE,
    $or: [
      { startDate: { $gte: now, $lte: rangeEnd } },
      {
        "recurrence.type": { $ne: RecurrenceTypeEnum.NONE },
        startDate: { $lte: rangeEnd },
        $or: [
          { "recurrence.endDate": { $exists: false } },
          { "recurrence.endDate": { $gte: now } },
        ],
      },
    ],
  })
    .populate<{
      instructor: Pick<IUserHydratedDocument, "_id" | "fullName">;
    }>("instructor", "_id fullName")
    .populate<{
      cohort: Pick<ICohortHydratedDocument, "title">;
    }>("cohort", "title")
    .select(
      "_id title type startDate endDate location status cohortId instructorId recurrence allDay entity"
    )
    .sort({ startDate: 1 })
    .lean<IScheduleEventWithId[]>();

  return expandRecurringEvents(events, now, rangeEnd)
    .slice(0, limit)
    .map(({ event, startDate, endDate }) => ({
      ...event,
      startDate,
      endDate,
    }));
}

export const studentRouter = router({
  // Get student dashboard stats with single optimized query
  getDashboardStats: protectedProcedure
    .use(createDomainRequiredMiddleware())
    .query(async ({ ctx }) => {
      const userId = ctx.user._id;
      const orgId = ctx.domainData.domainObj.orgId;

      // Get student's enrolled course IDs
      const activeEnrollments = await EnrollmentModel.find({
        userId,
        orgId,
        status: EnrollmentStatusEnum.ACTIVE,
        memberType: CourseEnrollmentMemberTypeEnum.STUDENT,
      })
        .select("courseId cohortId")
        .lean();

      const enrolledCourseIds = activeEnrollments.map((e) => e.courseId);
      const cohortIds = activeEnrollments
        .map((e) => e.cohortId)
        .filter((id): id is mongoose.Types.ObjectId => !!id);

      const upcomingEventsPromise = getStudentUpcomingEvents({
        orgId,
        cohortIds,
      });

      const [enrollments, progressData, upcomingAssignments, upcomingEvents] =
        await Promise.all([
          // Get recent enrollments with course details
          EnrollmentModel.find({
            userId,
            orgId,
            status: EnrollmentStatusEnum.ACTIVE,
            memberType: CourseEnrollmentMemberTypeEnum.STUDENT,
          })
            .populate<{
              course: Pick<
                ICourseHydratedDocument,
                "_id" | "title" | "featuredImage"
              >;
            }>("course", "_id title featuredImage")
            .select("_id courseId createdAt")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),

          // Get overall progress stats
          UserProgressModel.aggregate([
            {
              $match: {
                userId,
                orgId,
              },
            },
            {
              $group: {
                _id: null,
                totalLessons: { $sum: { $size: "$lessons" } },
                completedLessons: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$lessons",
                        as: "lesson",
                        cond: { $eq: ["$$lesson.status", "completed"] },
                      },
                    },
                  },
                },
              },
            },
          ]),

          // Get upcoming assignments (not yet submitted or in draft)
          AssignmentModel.find({
            orgId,
            courseId: { $in: enrolledCourseIds },
            dueDate: { $gte: new Date() },
            publicationStatus: "published",
          })
            .populate<{
              course: Pick<ICourseHydratedDocument, "_id" | "title">;
            }>("course", "_id title")
            .select("_id title courseId dueDate totalPoints type")
            .sort({ dueDate: 1 })
            .limit(10)
            .lean()
            .then(async (assignments) => {
              // Check submission status for each assignment
              const assignmentIds = assignments.map((a) => a._id);
              const submissions = await AssignmentSubmissionModel.find({
                userId,
                orgId,
                assignmentId: { $in: assignmentIds },
                status: {
                  $in: [
                    AssignmentSubmissionStatusEnum.SUBMITTED,
                    AssignmentSubmissionStatusEnum.GRADED,
                  ],
                },
              })
                .select("assignmentId")
                .lean();

              const submittedAssignmentIds = new Set(
                submissions.map((s) => s.assignmentId.toString())
              );

              // Filter out already submitted assignments
              return assignments.filter(
                (a) => !submittedAssignmentIds.has(a._id.toString())
              );
            }),

          // Get upcoming events from schedule
          upcomingEventsPromise,
        ]);

      // Process progress data
      const progress = progressData[0] || {
        totalLessons: 0,
        completedLessons: 0,
      };

      const completionRate =
        progress.totalLessons > 0
          ? Math.round(
              (progress.completedLessons / progress.totalLessons) * 100
            )
          : 0;

      return jsonify({
        stats: {
          enrolledCourses: activeEnrollments.length,
          completionRate,
          totalLessons: progress.totalLessons,
          completedLessons: progress.completedLessons,
          pendingAssignments: upcomingAssignments.length,
        },
        recentCourses: enrollments,
        upcomingAssignments,
        upcomingEvents,
      });
    }),

  // Get student course progress
  getCourseProgress: protectedProcedure
    .use(createDomainRequiredMiddleware())
    .input(
      z.object({
        courseId: documentIdValidator().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user._id;
      const orgId = ctx.domainData.domainObj.orgId;

      const query: any = {
        userId,
        orgId,
      };

      if (input.courseId) {
        query.courseId = input.courseId;
      }

      const progressDocs = await UserProgressModel.find(query).lean();

      const progressWithStats = progressDocs.map((progress) => {
        const totalLessons = progress.lessons.length;
        const completedLessons = progress.lessons.filter(
          (l) => l.status === "completed"
        ).length;
        const percentComplete =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          courseId: progress.courseId,
          percentComplete,
          totalLessons,
          completedLessons,
        };
      });

      return jsonify(progressWithStats);
    }),

  // Get student grades summary (all grades)
  getGradesSummary: protectedProcedure
    .use(createDomainRequiredMiddleware())
    .query(async ({ ctx }) => {
      const userId = ctx.user._id;
      const orgId = ctx.domainData.domainObj.orgId;

      const [submissions, quizAttempts] = await Promise.all([
        AssignmentSubmissionModel.find({
          userId,
          orgId,
          status: AssignmentSubmissionStatusEnum.GRADED,
        })
          .populate<{
            assignment: Pick<
              IAssignmentHydratedDocument,
              "_id" | "title" | "totalPoints" | "courseId"
            >;
          }>("assignment", "title totalPoints courseId")
          .populate({
            path: "assignment",
            populate: {
              path: "courseId",
              select: "title",
            },
          })
          .sort({ gradedAt: -1 })
          .lean(),

        QuizAttemptModel.find({
          userId,
          orgId,
          status: QuizAttemptStatusEnum.COMPLETED,
        })
          .populate<{
            quiz: Pick<
              IQuizHydratedDocument,
              "_id" | "title" | "totalPoints" | "courseId"
            >;
          }>("quiz", "title totalPoints courseId")
          .populate({
            path: "quiz",
            populate: {
              path: "courseId",
              select: "title",
            },
          })
          .sort({ completedAt: -1 })
          .lean(),
      ]);

      const assignmentGrades = submissions.map((sub) => ({
        _id: sub._id.toString(),
        type: "assignment" as const,
        entityId: sub.assignment?._id?.toString() || "",
        title: sub.assignment?.title || "",
        course:
          (sub.assignment?.courseId as unknown as ICourseHydratedDocument)
            ?.title || "",
        courseId: (sub.assignment?.courseId as any)?._id?.toString() || "",
        score: sub.score || 0,
        totalPoints: sub.assignment?.totalPoints || 100,
        percentageScore: sub.percentageScore || 0,
        gradedAt: sub.gradedAt || new Date(),
        feedback: sub.feedback,
      }));

      const quizGrades = quizAttempts.map((attempt) => ({
        _id: attempt._id.toString(),
        type: "quiz" as const,
        entityId: attempt.quiz?._id?.toString() || "",
        attemptId: attempt._id.toString(),
        title: attempt.quiz?.title || "",
        course:
          (attempt.quiz?.courseId as unknown as ICourseHydratedDocument)
            ?.title || "",
        courseId: (attempt.quiz?.courseId as any)?._id?.toString() || "",
        score: attempt.score || 0,
        totalPoints: attempt.quiz?.totalPoints || 100,
        percentageScore: attempt.percentageScore || 0,
        gradedAt: attempt.completedAt || new Date(),
      }));

      const allGrades = [...assignmentGrades, ...quizGrades].sort(
        (a, b) =>
          new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
      );

      const averageGrade =
        allGrades.length > 0
          ? Math.round(
              allGrades.reduce((sum, g) => sum + g.percentageScore, 0) /
                allGrades.length
            )
          : 0;

      return jsonify({
        averageGrade,
        totalGraded: allGrades.length,
        grades: allGrades.slice(0, 20),
      });
    }),

  // Get student grades for specific cohort (required cohortId)
  getGradesByCohort: protectedProcedure
    .use(createDomainRequiredMiddleware())
    .input(
      z.object({
        cohortId: documentIdValidator(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user._id;
      const orgId = ctx.domainData.domainObj.orgId;

      // Server-side filtering: Get courseIds for the specified cohort
      const enrollments = await EnrollmentModel.find({
        userId,
        orgId,
        cohortId: input.cohortId,
        status: EnrollmentStatusEnum.ACTIVE,
      })
        .select("courseId")
        .lean();

      const courseIds = enrollments.map((e) => e.courseId);

      if (courseIds.length === 0) {
        return jsonify({
          averageGrade: 0,
          totalGraded: 0,
          grades: [],
        });
      }

      const [submissions, quizAttempts] = await Promise.all([
        AssignmentSubmissionModel.find({
          userId,
          orgId,
          status: AssignmentSubmissionStatusEnum.GRADED,
        })
          .populate<{
            assignment: Pick<
              IAssignmentHydratedDocument,
              "_id" | "title" | "totalPoints" | "courseId"
            >;
          }>("assignment", "title totalPoints courseId")
          .populate({
            path: "assignment",
            populate: {
              path: "courseId",
              select: "title",
            },
          })
          .sort({ gradedAt: -1 })
          .lean(),

        QuizAttemptModel.find({
          userId,
          orgId,
          status: QuizAttemptStatusEnum.COMPLETED,
        })
          .populate<{
            quiz: Pick<
              IQuizHydratedDocument,
              "_id" | "title" | "totalPoints" | "courseId"
            >;
          }>("quiz", "title totalPoints courseId")
          .populate({
            path: "quiz",
            populate: {
              path: "courseId",
              select: "title",
            },
          })
          .sort({ completedAt: -1 })
          .lean(),
      ]);

      const assignmentGrades = submissions.map((sub) => ({
        _id: sub._id.toString(),
        type: "assignment" as const,
        entityId: sub.assignment?._id?.toString() || "",
        title: sub.assignment?.title || "",
        course:
          (sub.assignment?.courseId as unknown as ICourseHydratedDocument)
            ?.title || "",
        courseId: (sub.assignment?.courseId as any)?._id?.toString() || "",
        score: sub.score || 0,
        totalPoints: sub.assignment?.totalPoints || 100,
        percentageScore: sub.percentageScore || 0,
        gradedAt: sub.gradedAt || new Date(),
        feedback: sub.feedback,
      }));

      const quizGrades = quizAttempts.map((attempt) => ({
        _id: attempt._id.toString(),
        type: "quiz" as const,
        entityId: attempt.quiz?._id?.toString() || "",
        attemptId: attempt._id.toString(),
        title: attempt.quiz?.title || "",
        course:
          (attempt.quiz?.courseId as unknown as ICourseHydratedDocument)
            ?.title || "",
        courseId: (attempt.quiz?.courseId as any)?._id?.toString() || "",
        score: attempt.score || 0,
        totalPoints: attempt.quiz?.totalPoints || 100,
        percentageScore: attempt.percentageScore || 0,
        gradedAt: attempt.completedAt || new Date(),
      }));

      const allGrades = [...assignmentGrades, ...quizGrades].sort(
        (a, b) =>
          new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
      );

      const averageGrade =
        allGrades.length > 0
          ? Math.round(
              allGrades.reduce((sum, g) => sum + g.percentageScore, 0) /
                allGrades.length
            )
          : 0;

      return jsonify({
        averageGrade,
        totalGraded: allGrades.length,
        grades: allGrades,
      });
    }),
});
