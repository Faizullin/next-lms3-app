"use client";

import {
  CohortViewDialog,
  type CohortDialogData,
} from "@/components/cohort/cohort-view-dialog";
import {
  LiveSessionViewDialog,
  type LiveSessionDialogData,
} from "@/components/live-session/live-session-view-dialog";
import DashboardContent from "@/components/dashboard/dashboard-content";
import { CreateButton } from "@/components/dashboard/layout/create-button";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { LiveClassTypeEnum } from "@workspace/common-logic/models/lms/live-class.types";
import { ScheduleTypeEnum } from "@workspace/common-logic/models/lms/schedule.types";
import { useDialogControl, useToast } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  BookOpen,
  Calendar as CalendarIcon,
  ClipboardList,
  Clock,
  Eye,
  Star,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

type DashboardStartsType =
  GeneralRouterOutputs["lmsModule"]["instructor"]["getDashboardStats"];
type UpcomingEventType = DashboardStartsType["upcomingEvents"][number];

export default function Page() {
  const { t } = useTranslation(["dashboard", "common", "course"]);
  const breadcrumbs = [
    { label: t("common:dashboard"), href: "/dashboard/instructor" },
  ];

  const dashboardQuery = trpc.lmsModule.instructor.getDashboardStats.useQuery();

  const stats = dashboardQuery.data?.stats;
  const recentCourses = dashboardQuery.data?.recentCourses || [];
  const upcomingEvents = dashboardQuery.data?.upcomingEvents || [];
  const isLoading = dashboardQuery.isLoading;

  return (
    <DashboardContent breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6">
        <HeaderTopbar
          header={{
            title: t("common:instructor"),
            subtitle: t("dashboard:instructor.subtitle"),
          }}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-9 w-16 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Link href="/dashboard/lms/courses?filters[published]=true">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("dashboard:instructor.stats.total_courses")}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {stats?.totalCourses || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats?.publishedCourses || 0} {t("common:published")}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/lms/courses?filters[published]=false">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("dashboard:instructor.stats.total_students")}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {stats?.totalStudents || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("dashboard:instructor.stats.across_all_courses")}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <Users className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/lms/courses">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("dashboard:instructor.stats.drafts")}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {stats?.draftCourses || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("dashboard:instructor.stats.need_publishing")}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/lms/assignments">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("dashboard:instructor.stats.pending_grading")}
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {stats?.pendingSubmissions || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("dashboard:instructor.stats.pending_submissions")}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-red-100 text-red-600">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - My Courses */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("dashboard:my_courses")}</CardTitle>
                <CreateButton
                  href="/dashboard/lms/courses/new"
                  disabled={isLoading}
                />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                          <Skeleton className="h-6 w-20 ml-4" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("dashboard:instructor.my_courses.no_courses_title")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("dashboard:instructor.my_courses.no_courses_desc")}
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/lms/courses/new">
                        {t("dashboard:instructor.my_courses.create_course")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCourses.map((course) => (
                      <Link
                        key={course._id.toString()}
                        href={`/dashboard/lms/courses/${course._id}`}
                        className="block"
                      >
                        <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">
                                {course.title}
                              </h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {course.shortDescription ||
                                  t(
                                    "dashboard:instructor.my_courses.no_description"
                                  )}
                              </p>
                            </div>
                            <Badge
                              variant={
                                course.published ? "default" : "secondary"
                              }
                              className="ml-4"
                            >
                              {course.published
                                ? t("common:published")
                                : t("common:draft")}
                            </Badge>
                          </div>

                          {/* Course Stats */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {course.chapters?.length || 0}{" "}
                              {t("dashboard:instructor.my_courses.chapters")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {t("course:public.students_number", {
                                count: course.statsEnrollmentCount || 0,
                              })}
                            </span>
                            {course.statsAverageRating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {course.statsAverageRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}

                    {(stats?.totalCourses || 0) > 5 && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard/lms/courses">
                          <Eye className="h-4 w-4 mr-2" />
                          {t("common:view_all")}
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("dashboard:instructor.quick_actions.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/dashboard/lms/courses">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {t("dashboard:instructor.quick_actions.manage_courses")}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/dashboard/lms/assignments">
                        <Eye className="h-4 w-4 mr-2" />
                        {t(
                          "dashboard:instructor.quick_actions.view_assignments"
                        )}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-start">
                      <Link href="/dashboard/lms/live-classes">
                        <Video className="h-4 w-4 mr-2" />
                        {t("dashboard:instructor.quick_actions.live_classes")}
                      </Link>
                    </Button>
                    {/* TODO: fix */}
                    {/* <Button asChild variant="outline" className="justify-start">
                      <Link href="/dashboard/lms/schedule">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {t(
                          "dashboard:instructor.quick_actions.master_schedule"
                        )}
                      </Link>
                    </Button> */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Calendar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {t("dashboard:instructor.upcoming_events.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard:instructor.upcoming_events.no_events")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event, index) => {
                      return <UpcomingEventsCard key={index} item={event} />;
                    })}

                    {/* TODO: REMOVE THIS */}
                    {/* {upcomingEvents.length >= 10 && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard/lms/schedule">
                          {t(
                            "dashboard:instructor.upcoming_events.view_full_calendar"
                          )}
                        </Link>
                      </Button>
                    )} */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardContent>
  );
}

const UpcomingEventsCard = ({ item }: { item: UpcomingEventType }) => {
  const { t } = useTranslation(["dashboard", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const cohortDialog = useDialogControl<CohortDialogData>();
  const liveSessionDialog = useDialogControl<LiveSessionDialogData>();
  const meetingUrl = item.event.location?.meetingUrl;

  const createLiveClassMutation = trpc.lmsModule.liveClass.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: t("common:success"),
        description: t("dashboard:instructor.live_session_created"),
      });
      router.push(`/dashboard/lms/live-classes/${data._id}`);
    },
    onError: (err: any) => {
      toast({
        title: t("common:error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateLiveSession = useCallback(async () => {
    if (!item.event.cohortId) return;

    await createLiveClassMutation.mutateAsync({
      data: {
        title: item.event.title,
        description: item.event.description,
        type: LiveClassTypeEnum.LECTURE,
        entityType: "cohort",
        entityId: item.event.cohortId,
        instructorId: item.event.instructorId || "",
        cohortId: item.event.cohortId,
        scheduledStartTime: new Date(item.event.startDate).toISOString(),
        scheduledEndTime: new Date(item.event.endDate).toISOString(),
        locationOnline: true,
        allowRecording: true,
        allowChat: true,
        allowScreenShare: true,
        allowParticipantVideo: true,
      },
    });
  }, [item, createLiveClassMutation]);

  const eventTypeIcons: Record<string, any> = {
    live_session: Video,
    assignment: BookOpen,
    quiz: TrendingUp,
    deadline: Clock,
  };
  const EventIcon = eventTypeIcons[item.event.type] || CalendarIcon;

  const renderPopoverContent = () => {
    if (item.event.type === ScheduleTypeEnum.LIVE_SESSION) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium mb-3">
            {t("dashboard:instructor.quick_links")}
          </p>
          {meetingUrl && (
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              asChild
            >
              <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4 mr-2" />
                {t("dashboard:lms.live_classes.actions.join_meeting")}
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            onClick={() => {
              cohortDialog.show({ cohortId: item.event.cohortId! });
              setIsOpen(false);
            }}
            disabled={!item.event.cohortId}
          >
            <Users className="h-4 w-4 mr-2" />
            {t("dashboard:instructor.view_cohort")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            onClick={() => {
              liveSessionDialog.show({ eventId: item.event._id });
              setIsOpen(false);
            }}
          >
            <Video className="h-4 w-4 mr-2" />
            {t("dashboard:instructor.view_live_session")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            asChild
          >
            <Link
              href={`/dashboard/lms/schedule?cohortId=${item.event.cohortId}`}
              onClick={() => setIsOpen(false)}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t("common:schedule")}
            </Link>
          </Button>
        </div>
      );
    }

    if (item.event.cohortId) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium mb-3">
            {t("dashboard:instructor.quick_links")}
          </p>
          {meetingUrl && (
            <Button
              variant="outline"
              className="w-full justify-start"
              size="sm"
              asChild
            >
              <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4 mr-2" />
                {t("dashboard:lms.live_classes.actions.join_meeting")}
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            onClick={() => {
              cohortDialog.show({ cohortId: item.event.cohortId! });
              setIsOpen(false);
            }}
            disabled={!item.event.cohortId}
          >
            <Users className="h-4 w-4 mr-2" />
            {t("dashboard:instructor.view_cohort")}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            asChild
          >
            <Link
              href={`/dashboard/lms/schedule?cohortId=${item.event.cohortId}`}
              onClick={() => setIsOpen(false)}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {t("common:schedule")}
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {item.event.description ||
            t("dashboard:instructor.my_courses.no_description")}
        </p>
        {meetingUrl && (
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            asChild
          >
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              {t("dashboard:lms.live_classes.actions.join_meeting")}
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start"
          size="sm"
          asChild
        >
          <Link href="/dashboard/lms/schedule" onClick={() => setIsOpen(false)}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            {t("dashboard:instructor.quick_actions.master_schedule")}
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            type="button"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <EventIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1 truncate">
                  {item.event.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(item.event.startDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
                <Badge variant="outline" className="mt-2 text-xs">
                  {item.event.type.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          {renderPopoverContent()}
        </PopoverContent>
      </Popover>

      <CohortViewDialog control={cohortDialog} />
      <LiveSessionViewDialog control={liveSessionDialog} />
    </>
  );
};
