"use client";

import { CourseInstructorsStack } from "@/components/course/course-instructors-stack";
import { useCoursePublicDetail } from "@/components/course/detail/course-public-detail-context";
import { ScrollAnimation } from "@/components/public/scroll-animation";
import { trpc } from "@/utils/trpc";
import { ITextEditorContent } from "@workspace/common-logic/lib/text-editor-content";
import { CourseLevelEnum } from "@workspace/common-logic/models/lms/course.types";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslation } from "react-i18next";

const DescriptionEditor = dynamic(
    () =>
      import(
        "@/components/editors/tiptap/templates/description/description-editor"
      ).then((mod) => ({ default: mod.DescriptionEditor })),
    {
      ssr: false,
    },
  );

export default function Page() {
    const { t } = useTranslation(["dashboard", "common", "course"]);
    const { initialCourse, loadCoursePublicDetailedQuery } = useCoursePublicDetail();
    
    const loadMembershipQuery = trpc.lmsModule.enrollment.getMembership.useQuery({ 
        courseId: initialCourse._id,
     }, {
        enabled: !!initialCourse._id,
     });

    if (loadCoursePublicDetailedQuery.isLoading || loadMembershipQuery.isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    const levelLabelsDict = {
        [CourseLevelEnum.BEGINNER]: t("course:level.beginner"),
        [CourseLevelEnum.INTERMEDIATE]: t("course:level.intermediate"),
        [CourseLevelEnum.ADVANCED]: t("course:level.advanced"),
    };

    const courseDetail = loadCoursePublicDetailedQuery.data;
    const instructors = courseDetail?.instructors ?? [];
    const enrollmentCount = initialCourse.statsEnrollmentCount || 0;
    const studentsLabel = t("course:public.students_number", { count: enrollmentCount });

    return (
        <div className="w-full h-full p-2 lg:p-4 space-y-4">
            <ScrollAnimation variant="fadeUp">
                <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                    {initialCourse.featuredImage && (
                        <div className="relative w-full h-48 sm:h-56 lg:h-64">
                            <Image
                                src={initialCourse.featuredImage?.url || "/placeholder-course.jpg"}
                                alt={initialCourse.featuredImage?.caption || initialCourse.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 33vw"
                            />
                        </div>
                    )}
                    <div className="p-4 lg:p-6 space-y-4">
                        <div className="space-y-3">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                                {initialCourse.title}
                            </h1>

                            {initialCourse.shortDescription && (
                                <p className="text-base lg:text-lg leading-relaxed text-muted-foreground">
                                    {initialCourse.shortDescription}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{studentsLabel}</span>
                            </div>
                            <span className="text-muted-foreground/60">•</span>
                            <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">
                                {levelLabelsDict[initialCourse.level as CourseLevelEnum] || initialCourse.level}
                            </Badge>
                        </div>

                        <CourseInstructorsStack instructors={instructors} nameClassName="text-sm text-muted-foreground" />

                        {initialCourse.tags && initialCourse.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {initialCourse.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline">
                                        {tag.name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {courseDetail?.description && (
                            <div className="border-t pt-4">
                                <DescriptionEditor
                                    editable={false}
                                    toolbar={false}
                                    onEditor={(editor, meta) => {
                                        if (meta.reason === "create") {
                                            editor!.commands.setMyContent(courseDetail.description! as unknown as ITextEditorContent);
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
