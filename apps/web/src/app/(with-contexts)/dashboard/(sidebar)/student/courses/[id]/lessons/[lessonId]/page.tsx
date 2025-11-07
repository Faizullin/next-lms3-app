"use client";

import { useProfile } from "@/components/contexts/profile-context";
import { useCoursePublicDetail } from "@/components/course/detail/course-public-detail-context";
import { ITextEditorContent } from "@workspace/common-logic/lib/text-editor-content";
import { UIConstants } from "@workspace/common-logic/lib/ui/constants";
import { checkPermission } from "@workspace/utils";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ArrowLeft, ArrowRight, Edit } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const LessonContentEditor = dynamic(
    () => import("@/components/editors/tiptap/templates/lesson-content/lesson-content-editor").then((mod) => ({ default: mod.LessonContentEditor })),
    { ssr: false },
);

export default function LessonPage() {
    const { t } = useTranslation(["dashboard", "common"]);
    const { profile } = useProfile();
    const { initialCourse, loadLessonPublicQuery, loadCoursePublicDetailedQuery } = useCoursePublicDetail();
    const router = useRouter();
    
    const isLessonLoading = loadLessonPublicQuery.isLoading;
    const lesson = loadLessonPublicQuery.data;

    const nav = useMemo(() => ({
        prev: loadLessonPublicQuery.data?.meta.prevLesson?._id,
        next: loadLessonPublicQuery.data?.meta.nextLesson?._id,
    }), [loadLessonPublicQuery.data]);

    const chapterId = useMemo(() => {
        if (!lesson || !loadCoursePublicDetailedQuery.data?.chapters) return null;
        const chapter = loadCoursePublicDetailedQuery.data.chapters.find(ch => 
            ch.lessons?.some(l => l && l._id === lesson._id)
        );
        return chapter?._id;
    }, [lesson, loadCoursePublicDetailedQuery.data?.chapters]);

    const canEdit = useMemo(() => {
        if (!profile?.permissions) return false;
        if(profile.roles.includes(UIConstants.roles.admin)) return true;
        return checkPermission(profile.permissions, [
            UIConstants.permissions.manageCourse,
            UIConstants.permissions.manageAnyCourse,
        ]);
    }, [profile?.permissions]);



    if (isLessonLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!initialCourse || !lesson) {
        return (
            <div className="text-center py-12 px-4">
                <h3 className="text-lg font-semibold mb-2">{t("dashboard:lesson.not_found")}</h3>
                <p className="text-muted-foreground mb-6">
                    {t("dashboard:lesson.not_found_desc")}
                </p>
                <Link href={`/dashboard/student/courses/${initialCourse._id}`}>
                    <Button>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t("dashboard:lesson.back_to_course")}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-2 lg:p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold truncate flex-1">{lesson.title}</h2>
                <div className="flex items-center gap-2 ml-4">
                    <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => router.push(`/dashboard/student/courses/${initialCourse._id}/lessons/${nav.prev}`)}
                        disabled={!nav.prev}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    
                    {canEdit && chapterId && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            asChild
                        >
                            <Link href={`/dashboard/lms/courses/${initialCourse._id}/content/section/${chapterId}/lessons/${lesson._id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("common:edit")}
                            </Link>
                        </Button>
                    )}
                    
                    <Button 
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => router.push(`/dashboard/student/courses/${initialCourse._id}/lessons/${nav.next}`)}
                        disabled={!nav.next}
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="flex-1 py-0">
                <CardContent className="p-2 lg:p-4">
                    <LessonContentEditor
                        lesson={lesson}
                        editable={false}
                        toolbar={false}
                        onEditor={(editor, meta) => {
                            if (meta.reason === "create") {
                                editor!.commands.setMyContent(lesson.content as unknown as ITextEditorContent);
                            }
                        }} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}