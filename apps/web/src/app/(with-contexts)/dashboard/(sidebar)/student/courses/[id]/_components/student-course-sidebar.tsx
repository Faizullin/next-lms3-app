"use client";

import { useSiteInfo } from "@/components/contexts/site-info-context";
import { useCoursePublicDetail } from "@/components/course/detail/course-public-detail-context";
import { trpc } from "@/utils/trpc";
import { EnrollmentStatusEnum } from "@workspace/common-logic/models/lms/enrollment.types";
import { UserLessonProgressStatusEnum } from "@workspace/common-logic/models/lms/user-progress.types";
import { Button } from "@workspace/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { Progress } from "@workspace/ui/components/progress";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { BookOpen, Calendar, CheckCircle, CircleDashed, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LessonsLayoutView } from "./lessons-layout-view";

export function StudentCourseSidebar() {
  const trpcUtils = trpc.useUtils();
  const pathname = usePathname();
  const params = useParams<{ id: string; lessonId?: string }>();
  const { t } = useTranslation(["common", "dashboard"]);
  const { initialCourse, loadCoursePublicDetailedQuery, loadLessonPublicQuery } = useCoursePublicDetail();
  const [activeTab, setActiveTab] = useState("lessons");
  const [aiTutorKey, setAiTutorKey] = useState(0);

  const { siteInfo } = useSiteInfo();

  const handleTabChange = (value: string) => {
    if (value === "ai-tutor" && activeTab !== "ai-tutor") {
      setAiTutorKey((prev) => prev + 1);
    }
    setActiveTab(value);
  };

  const loadMembershipQuery = trpc.lmsModule.enrollment.getMembership.useQuery({
    courseId: initialCourse._id,
  }, { enabled: !!initialCourse._id });

  const updateProgressMutation = trpc.lmsModule.enrollment.updateProgress.useMutation({
    onSuccess: () => {
      trpcUtils.lmsModule.enrollment.getMembership.invalidate({
        courseId: initialCourse._id,
      });
    },
  });

  const enrollment = loadMembershipQuery.data?.enrollment;  
  const progress = loadMembershipQuery.data?.progress;
  const cohort = enrollment?.cohort;
  const progressPercentage = progress?.progressPercentage || 0;

  const isOnCoursePage = pathname === `/dashboard/student/courses/${initialCourse._id}`;
  const currentLesson = loadLessonPublicQuery.data;

  const selfCompleteDisabled = useMemo(() => {
    if(!enrollment || enrollment.status !== EnrollmentStatusEnum.ACTIVE) return true;

    // TODO: Uncomment this when we have a way to complete quizzes
    // if(currentLesson?.type === LessonTypeEnum.QUIZ) return true;
    return false;
  }, [enrollment, progress, currentLesson?._id]);

  const alreadyCompleted = useMemo(() => {
    if(!enrollment || enrollment.status !== EnrollmentStatusEnum.ACTIVE) return false;
    return progress?.lessons?.find((lesson) => lesson.lessonId === currentLesson?._id)?.status === UserLessonProgressStatusEnum.COMPLETED;
  }, [enrollment, progress, currentLesson?._id]);
  
  const handleCompleteLesson = useCallback(() => {
    if(alreadyCompleted) return;
    if(!enrollment?._id || !currentLesson?._id) return;
    if(selfCompleteDisabled) {
      throw new Error("You cannot manually complete this lesson. It will be marked automatically upon completion.");
    }
    updateProgressMutation.mutate({
      data: {
        enrollmentId: enrollment._id,
        lessonId: currentLesson._id,
        status: UserLessonProgressStatusEnum.COMPLETED,
      },
    });
  }, [enrollment?._id, currentLesson?._id, updateProgressMutation, selfCompleteDisabled, alreadyCompleted]);

  if (loadCoursePublicDetailedQuery.isLoading || loadMembershipQuery.isLoading) {
    return (
      <aside className="w-full h-full space-y-3 p-4 lg:border lg:bg-card">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </aside>
    );
  }

  const completeButtonRender = (
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs bg-transparent"
        onClick={handleCompleteLesson}
        disabled={updateProgressMutation.isPending || selfCompleteDisabled}
      >
        {updateProgressMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : alreadyCompleted ? (
          <CheckCircle className="h-3 w-3" />
        ) : (
          <CircleDashed className="h-3 w-3" />
        )}
        Complete Lesson
      </Button>
  );
  

  return (
    <aside className="w-full h-full lg:border lg:bg-card lg:shadow-sm">
      <div className="flex flex-col">
        <div className="p-4">
            <Link
              href={`/dashboard/student/courses/${initialCourse._id}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-4",
                isOnCoursePage ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <BookOpen className="h-5 w-5 shrink-0" />
              <span className="flex-1 truncate">{initialCourse.title}</span>
            </Link>

            {enrollment && (
              <div className="mb-4 p-3 bg-accent/50 rounded-md border">
                  {cohort && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {t("dashboard:cohort")}
                          </span>
                          <span className="text-xs font-semibold">{cohort.title}</span>
                        </div>
                        {cohort.beginDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {t("dashboard:student.started")}
                            </span>
                            <span className="text-xs">
                              {new Date(cohort.beginDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                  
                        <Separator className="mb-4" />
                      </div>
                  )}

                  <div className="mb-4">
                    {selfCompleteDisabled ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          {completeButtonRender}
                        </PopoverTrigger>
                        <PopoverContent className="w-56 text-xs">
                          <p className="text-muted-foreground">
                            You cannot manually complete this lesson. It will be marked automatically upon completion.
                          </p>
                        </PopoverContent>
                      </Popover>
                    ) : completeButtonRender}
                  </div>

                  <Separator className="mb-4" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("dashboard:progress")}</span>
                      <span className="font-semibold">{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1.5" />
                    {/* {enrollment.completedLessons !== undefined && enrollment.totalLessons !== undefined && (
                      <div className="text-xs text-muted-foreground text-center">
                        {enrollment.completedLessons}/{enrollment.totalLessons} {t("common:lessons")}
                      </div>
                    )} */}
                  </div>
              </div>
            )}
        </div>

        <LessonsLayoutView 
          courseId={initialCourse._id}
          chapters={loadCoursePublicDetailedQuery.data?.chapters || []}
          progress={loadMembershipQuery.data?.progress}
          currentLessonId={params.lessonId}
        />
      </div>
    </aside>
  );
}
