"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { CourseCardContent, CourseSkeletonCard } from "@/components/course/course-card";
import { DataTablePagination, useDataTable } from "@workspace/components-library";
import type { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { CourseLevelEnum } from "@workspace/common-logic/models/lms/course.types";
import { EnrollmentStatusEnum } from "@workspace/common-logic/models/lms/enrollment.types";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { BookOpen, Calendar, Grid3x3, List, PlayCircle, User2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

type MyCoursesOutput = GeneralRouterOutputs["lmsModule"]["courseModule"]["course"]["getMyEnrolledCourses"];
type EnrolledCourse = MyCoursesOutput["items"][number];

type QueryParams = Parameters<typeof trpc.lmsModule.courseModule.course.getMyEnrolledCourses.useQuery>[0];

export default function Page() {
    const { t } = useTranslation(["dashboard", "common", "course"]);
    const breadcrumbs = [{ label: t("common:courses"), href: "#" }];

    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState<CourseLevelEnum | "all">("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [parsedData, setParsedData] = useState<EnrolledCourse[]>([]);
    const [parsedPagination, setParsedPagination] = useState({ pageCount: 1 });

    const columns = useMemo(() => [
        { accessorKey: "_id", header: "ID" },
    ], []);

    const { table } = useDataTable({
        columns,
        data: parsedData,
        pageCount: parsedPagination.pageCount,
        initialState: {
            pagination: { pageIndex: 0, pageSize: 9 },
        },
    });

    const tableState = table.getState();
    const queryParams = useMemo<QueryParams>(() => ({
        pagination: {
            skip: tableState.pagination.pageIndex * tableState.pagination.pageSize,
            take: tableState.pagination.pageSize,
        },
        search: search ? { q: search } : undefined,
        filter: {
            status: EnrollmentStatusEnum.ACTIVE,
            level: levelFilter === "all" ? undefined : levelFilter,
        },
    }), [tableState.pagination, search, levelFilter]);

    const loadMyCoursesQuery = trpc.lmsModule.courseModule.course.getMyEnrolledCourses.useQuery(queryParams);

    useEffect(() => {
        if (!loadMyCoursesQuery.data) return;
        setParsedData(loadMyCoursesQuery.data.items || []);
        setParsedPagination({
            pageCount: Math.ceil((loadMyCoursesQuery.data.total || 0) / loadMyCoursesQuery.data.meta.take),
        });
    }, [loadMyCoursesQuery.data]);

    const courses = parsedData;

    return (
        <DashboardContent breadcrumbs={breadcrumbs}>
            <HeaderTopbar
                header={{
                    title: t("dashboard:my_courses"),
                    subtitle: t("dashboard:student.dashboard_subtitle"),
                }}
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder={t("common:search_placeholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as CourseLevelEnum | "all")}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("course:list.all_levels")}</SelectItem>
                                <SelectItem value={CourseLevelEnum.BEGINNER}>{t("course:level.beginner")}</SelectItem>
                                <SelectItem value={CourseLevelEnum.INTERMEDIATE}>{t("course:level.intermediate")}</SelectItem>
                                <SelectItem value={CourseLevelEnum.ADVANCED}>{t("course:level.advanced")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2 border rounded-lg p-1">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-8 w-8 p-0"
                    >
                        <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="h-8 w-8 p-0"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>



            <div className={viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }>
                {loadMyCoursesQuery.isLoading ? (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <CourseSkeletonCard key={i} />
                        ))}
                    </>
                ) : courses.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState search={search} />
                    </div>
                ) : (
                    <>
                        {courses.map((course) => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                viewMode={viewMode}
                            />
                        ))}
                    </>
                )}
            </div>

            {!loadMyCoursesQuery.isLoading && courses.length > 0 && (
                <DataTablePagination table={table} pageSizeOptions={[9, 18, 27, 36]} />
            )}
        </DashboardContent>
    );
} 

interface CourseCardProps {
    course: EnrolledCourse;
    viewMode?: "grid" | "list";
}

function CourseCard({ course, viewMode = "grid" }: CourseCardProps) {
    const { t } = useTranslation(["dashboard", "common", "course"]);
    const router = useRouter();
    const { progress, instructors, owner, cohort } = course;
    const { percentComplete = 0, completedLessons = 0, totalLessons = 0 } = progress || {};
    const instructor = instructors?.[0] || owner;

    const levelLabelsDict = {
        [CourseLevelEnum.BEGINNER]: t("course:level.beginner"),
        [CourseLevelEnum.INTERMEDIATE]: t("course:level.intermediate"),
        [CourseLevelEnum.ADVANCED]: t("course:level.advanced"),
    };

    const handleNavigate = () => {
        router.push(`/dashboard/student/courses/${course._id}`);
    };

    if (viewMode === "list") {
        return (
            <CourseCardContent.Card className="hover:border-primary/20 cursor-pointer">
                <div className="flex flex-row">
                    <div className="w-48 flex-shrink-0 relative">
                        <CourseCardContent.CardImage 
                            src={course.featuredImage?.file || "/courselit_backdrop_square.webp"} 
                            alt={course.title}
                            className="bg-gradient-to-br from-primary/10 to-primary/5"
                        />
                        <Badge className="absolute top-3 left-3 bg-primary text-white z-10 text-xs">
                            {levelLabelsDict[course.level as CourseLevelEnum]}
                        </Badge>
                    </div>
                    <CourseCardContent.CardContent className="p-4 flex-1">
                        <CourseCardContent.CardHeader>
                            {course.title}
                        </CourseCardContent.CardHeader>
                        <div className="space-y-2">
                            {instructor && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User2 className="h-3 w-3" />
                                    <span className="truncate">{instructor.fullName}</span>
                                </div>
                            )}
                            {cohort && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{cohort.title}</span>
                                </div>
                            )}
                            {cohort?.beginDate && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span className="truncate">
                                        {new Date(cohort.beginDate).toLocaleDateString()}
                                        {cohort.endDate && ` - ${new Date(cohort.endDate).toLocaleDateString()}`}
                                    </span>
                                </div>
                            )}
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">{t("dashboard:progress")}</span>
                                    <span className="font-medium">{completedLessons}/{totalLessons} {t("common:lessons")}</span>
                                </div>
                                <ProgressBar value={percentComplete} />
                            </div>
                        </div>
                    </CourseCardContent.CardContent>
                </div>
            </CourseCardContent.Card>
        );
    }

    return (
        <CourseCardContent.Card className="h-full border-2 hover:border-primary/20">
            <div className="relative">
                <CourseCardContent.CardImage 
                    src={course.featuredImage?.file || "/courselit_backdrop_square.webp"} 
                    alt={course.title}
                    className="bg-gradient-to-br from-primary/10 to-primary/5"
                />
                <Badge className="absolute top-3 left-3 bg-primary text-white z-10">
                    {levelLabelsDict[course.level as CourseLevelEnum]}
                </Badge>
            </div>

            <CourseCardContent.CardContent className="space-y-3">
                <CourseCardContent.CardHeader>
                    {course.title}
                </CourseCardContent.CardHeader>

                {instructor && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User2 className="h-4 w-4" />
                        <span className="truncate">{instructor.fullName}</span>
                    </div>
                )}

                {cohort && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="truncate">{cohort.title}</span>
                    </div>
                )}

                {cohort?.beginDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="truncate">
                            {new Date(cohort.beginDate).toLocaleDateString()}
                            {cohort.endDate && ` - ${new Date(cohort.endDate).toLocaleDateString()}`}
                        </span>
                    </div>
                )}

                <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("dashboard:progress")}</span>
                        <span className="font-medium">{completedLessons}/{totalLessons} {t("common:lessons")}</span>
                    </div>
                    <ProgressBar value={percentComplete} />
                </div>

                <Button 
                    className="w-full" 
                    variant={percentComplete === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={handleNavigate}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {percentComplete === 0 ? t("course:public.start_learning") : t("common:continue")}
                </Button>
            </CourseCardContent.CardContent>
        </CourseCardContent.Card>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
                className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    value === 100 ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}


interface EmptyStateProps {
    search: string;
}

function EmptyState({ search }: EmptyStateProps) {
    const { t } = useTranslation(["dashboard", "common"]);
    
    return (
        <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
                {search ? t("dashboard:student.no_courses_found") : t("dashboard:student.no_courses_enrolled")}
            </h3>
            <p className="text-muted-foreground mb-6">
                {search 
                    ? t("dashboard:student.adjust_search")
                    : t("dashboard:student.start_journey")
                }
            </p>
            {!search && (
                <Link href="/courses">
                    <Button>
                        <BookOpen className="h-4 w-4 mr-2" />
                        {t("dashboard:student.browse_courses")}
                    </Button>
                </Link>
            )}
        </div>
    );
}