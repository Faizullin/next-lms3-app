"use client";

import { CourseInstructorsStack } from "@/components/course/course-instructors-stack";
import { useCoursePublicDetail } from "@/components/course/detail/course-public-detail-context";
import { ScrollAnimation } from "@/components/public/scroll-animation";
import { ITextEditorContent } from "@workspace/common-logic/lib/text-editor-content";
import { Badge } from "@workspace/ui/components/badge";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { CourseDetailSkeleton } from "./_components/course-skeletons";

const DescriptionEditor = dynamic(
  () =>
    import(
      "@/components/editors/tiptap/templates/description/description-editor"
    ).then((mod) => ({ default: mod.DescriptionEditor })),
  {
    ssr: false,
  },
);

function CourseMainContent() {
  const { loadCoursePublicDetailedQuery } = useCoursePublicDetail();
  const { t } = useTranslation(["frontend", "course"]);
  const courseDetailedData = loadCoursePublicDetailedQuery.data;
  const instructors = courseDetailedData?.instructors ?? [];
  const studentsLabel = t("course:public.students_number", {
    count: courseDetailedData?.statsEnrollmentCount || 0,
  });
  if (!courseDetailedData) {
    return null;
  }
  return (
    <div className="w-full space-y-6">
      {/* Course Overview */}
      <ScrollAnimation variant="fadeUp">
        <div className="rounded-2xl border border-border/60 bg-card/95 dark:bg-slate-950/75 shadow-md overflow-hidden m--course-overview">
          {courseDetailedData.featuredImage && (
            <div className="relative w-full h-56 md:h-72 lg:h-80">
              <Image
                src={
                  courseDetailedData.featuredImage?.url ||
                  courseDetailedData.featuredImage?.thumbnail ||
                  "/placeholder-course.jpg"
                }
                alt={courseDetailedData.featuredImage?.caption || courseDetailedData.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          <div className="p-6 space-y-6 m--course-header">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-gray-100">
                {courseDetailedData.title}
              </h1>

              {courseDetailedData.shortDescription && (
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {courseDetailedData.shortDescription}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{studentsLabel}</span>
                </div>
                <span className="hidden sm:inline text-border">•</span>
                {/* <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                  <span>{t("course:public.lessons_number", { count: courseDetailedData.statsLessonCount || 0 })}</span>
                  {courseDetailedData.totalDuration && (
                    <span className="text-border">/</span>
                  )}
                  {courseDetailedData.totalDuration && (
                    <span>{courseDetailedData.totalDuration}</span>
                  )}
                </div> */}
              </div>

              <CourseInstructorsStack
                instructors={instructors}
                nameClassName="text-sm text-gray-700 dark:text-gray-300"
              />

              {courseDetailedData.tags && courseDetailedData.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {courseDetailedData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-secondary/60 text-foreground border-border/50"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {courseDetailedData.description && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3 m--overview-content">
                <DescriptionEditor
                  editable={false}
                  toolbar={false}
                  onEditor={(editor, meta) => {
                    if (meta.reason === "create") {
                      editor!.commands.setMyContent(
                        courseDetailedData.description! as unknown as ITextEditorContent,
                      );
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
}

export default function Page() {
  const { loadCoursePublicDetailedQuery } = useCoursePublicDetail();

  if (loadCoursePublicDetailedQuery.isLoading) {
    return <CourseDetailSkeleton />;
  }
  return (
    <CourseMainContent />
  );
}
