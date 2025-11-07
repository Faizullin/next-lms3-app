"use client";

import { useProfile } from "@/components/contexts/profile-context";
import { useCoursePublicDetail } from "@/components/course/detail/course-public-detail-context";
import { trpc } from "@/utils/trpc";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
  Lock,
  Play,
  Video
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";


interface CourseLessonsSidebarProps {
  isEnrolled?: boolean;
}

export default function CourseLessonsSidebar({
  isEnrolled = false,
}: CourseLessonsSidebarProps) {
  const { t } = useTranslation(["frontend"]);
  const { profile } = useProfile();
  const { initialCourse, loadCoursePublicDetailedQuery } = useCoursePublicDetail();

  const loadCourseEnrollmentMemebershipQuery = trpc.lmsModule.enrollment.getMembership.useQuery(
    {
      courseId: initialCourse._id,
    },
    {
      enabled: !!profile?.id && !!initialCourse._id,
    },
  );

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Smart group expansion logic
  useEffect(() => {
    if (!loadCoursePublicDetailedQuery.data?.chapters?.length) return;
    const firstGroup = loadCoursePublicDetailedQuery.data.chapters[0];
    if (firstGroup && !expandedGroups.includes(firstGroup._id)) {
      setExpandedGroups(prev => Array.from(new Set([...prev, firstGroup._id])));
    }
  }, [loadCoursePublicDetailedQuery.data?.chapters]);

  const toggleGroup = (chapterId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId],
    );
  };

  // Determine if user has access to the course
  const isAuthenticated = !!profile?.id;
  const hasAccess = isAuthenticated && (loadCourseEnrollmentMemebershipQuery.data?.hasMembership || isEnrolled);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      case "quiz":
        return <HelpCircle className="h-4 w-4" />;
      case "audio":
        return <Play className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "file":
        return <Download className="h-4 w-4" />;
      case "embed":
        return <Play className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  if (loadCoursePublicDetailedQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loadCoursePublicDetailedQuery.data) return null;

  return (
    <>
      {/* Course Content */}
      <Card className="rounded-2xl border border-border/60 bg-card/95 dark:bg-slate-950/75 shadow-md">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-xl font-semibold text-foreground">
            {t("frontend:course_detail.course_content")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {loadCoursePublicDetailedQuery.data?.chapters?.length || 0} {t("frontend:course_detail.chapters")} •{" "}
            {t("course:public.lessons_number", { count: loadCoursePublicDetailedQuery.data?.statsLessonCount || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadCourseEnrollmentMemebershipQuery.isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {loadCoursePublicDetailedQuery.data?.chapters?.map((chapter) => (
                <div key={chapter._id}>
                  <button
                    onClick={() => toggleGroup(chapter._id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 rounded-xl border border-transparent bg-transparent transition-all duration-200 hover:bg-primary/5 hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      {expandedGroups.includes(chapter._id) ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                        {chapter.title}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-secondary/60 text-foreground">
                      {t("course:public.lessons_number", { count: chapter.lessons?.length || 0 })}
                    </Badge>
                  </button>

                  {expandedGroups.includes(chapter._id) && (
                    <div className="mt-2 space-y-1 rounded-xl border border-border/40 bg-muted/40 p-2">
                      {chapter.lessons?.map((lesson) => {
                        if (!lesson) return null;
                        const isCurrentLesson = false;
                        const hasLessonAccess = hasAccess || !lesson.requiresEnrollment;
                        return (
                          <div
                            key={lesson._id}
                            className="w-full overflow-hidden"
                          >
                            <Link
                              href={`/dashboard/student/courses/${initialCourse._id}/lessons/${lesson._id}`}
                              scroll={false}
                              className={`block rounded-lg px-4 py-3 transition-all duration-200 border ${isCurrentLesson
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-transparent hover:border-primary/30 hover:bg-primary/5"
                                } ${!hasLessonAccess ? "opacity-60 pointer-events-none" : ""}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg border border-primary/30 bg-background flex items-center justify-center text-primary">
                                  {hasLessonAccess ? (
                                    getTypeIcon(lesson.type || "text")
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span
                                    className={`text-sm font-medium truncate ${isCurrentLesson ? "text-primary" : "text-foreground"}`}
                                  >
                                    {lesson.title}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )) || (
                  <div className="p-6 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t("frontend:course_detail.content_coming_soon")}</p>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
