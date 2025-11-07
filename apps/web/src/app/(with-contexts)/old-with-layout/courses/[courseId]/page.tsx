"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { BookOpen, Clock, Users, Star } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useCourseData } from "./_components/course-provider";
import { CourseDetailSkeleton } from "./_components/course-skeletons";
import { CourseErrorBoundary, CourseErrorFallback } from "./_components/course-error-boundary";

const DescriptionEditor = dynamic(
  () =>
    import(
      "@/components/editors/tiptap/templates/description/description-editor"
    ).then((mod) => ({ default: mod.DescriptionEditor })),
  {
    ssr: false,
  },
);

function CourseMainContent({ course }: { course: any }) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{course.duration || "~"} weeks</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{Math.floor(Math.random() * 5000) + 1000} students</span>
          </div>
          <Badge variant="secondary">
            {course.level || "Beginner"}
          </Badge>
        </div>
      </div>

      {/* Course Overview */}
      <Card>
        {/* Featured Image */}
        {course.featuredImage && (
          <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-t-lg">
            <Image
              src={
                course.featuredImage.url ||
                course.featuredImage.thumbnail ||
                "/placeholder-course.jpg"
              }
              alt={course.featuredImage.caption || course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl">{course.title}</CardTitle>
          
          {/* Course Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {course.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t("course_overview")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("course_overview_description")}
                </p>
              </div>
            </div>
            
            {course.description && (
              <div className="prose prose-sm max-w-none">
                <DescriptionEditor
                  editable={false}
                  toolbar={false}
                  onEditor={(editor, meta) => {
                    if (meta.reason === "create") {
                      editor!.commands.setMyContent(course.description!);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CourseDetailsContent() {
  const { t } = useTranslation("common");
  const course = useCourseData();

  if (!course) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {t("course_not_found")}
        </h1>
        <p className="text-muted-foreground mb-4">{t("course_not_exist")}</p>
        <Link href="/courses">
          <Button>
            {t("back_to_courses")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <CourseErrorBoundary fallback={<CourseErrorFallback error={new Error("Failed to load course content")} reset={() => window.location.reload()} />}>
      <Suspense fallback={<CourseDetailSkeleton />}>
        <CourseMainContent course={course} />
      </Suspense>
    </CourseErrorBoundary>
  );
}

export default function CourseDetailsPage() {
  return <CourseDetailsContent />;
}
