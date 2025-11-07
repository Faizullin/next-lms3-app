"use client";

import { CourseCardContent, CourseSkeletonCard } from "@/components/course/course-card";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import {
  ScrollAnimation,
  ScrollGroup,
} from "@/components/public/scroll-animation";
import { trpc } from "@/utils/trpc";
import { CourseLevelEnum } from "@workspace/common-logic/models/lms/course.types";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";


type LevelFilter = "all" | CourseLevelEnum;

const COURSES_PER_PAGE = 9;


function CoursesContent() {
  const { t } = useTranslation(["frontend", "common", "course"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load courses using tRPC with server-side filtering
  const loadCoursesQuery = trpc.lmsModule.courseModule.course.publicList.useQuery(
    {
      pagination: {
        take: COURSES_PER_PAGE,
        skip: (currentPage - 1) * COURSES_PER_PAGE,
        includePaginationCount: true,
      },
      filter: {
        level: levelFilter === "all" ? undefined : levelFilter,
      },
      search: debouncedSearchTerm ? { q: debouncedSearchTerm } : undefined,
    },
    {
      enabled: true,
    },
  );

  const totalCourses = loadCoursesQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCourses / COURSES_PER_PAGE));

  useEffect(() => setCurrentPage(1), [debouncedSearchTerm, levelFilter]);
  useEffect(
    () => setCurrentPage((p) => Math.min(Math.max(1, p), totalPages)),
    [totalPages],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setLevelFilter("all");
    setCurrentPage(1);
  };

  if (loadCoursesQuery.error) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                {t("common:error_loading")} {t("common:courses")}
              </h3>
              <p className="text-gray-600 mb-4">{loadCoursesQuery.error.message}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                {t("common:try_again")}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Header />

      {/* Filters */}
      <section className="py-8 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                placeholder={t("frontend:courses.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* <div className="flex gap-4 items-center">
              <Select
                value={levelFilter}
                onValueChange={(v) => setLevelFilter(v as LevelFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("common:not_selected")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common:not_selected")}</SelectItem>
                  <SelectItem value="beginner">
                    {t("course:level.beginner")}
                  </SelectItem>
                  <SelectItem value="intermediate">
                    {t("course:level.intermediate")}
                  </SelectItem>
                  <SelectItem value="advanced">
                    {t("course:level.advanced")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || levelFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="whitespace-nowrap bg-transparent"
                >
                  {t("common:clear")}
                </Button>
              )}
            </div> */}
          </div>
        </div>
      </section>

      {/* Courses grid */}
      <section className="py-12 md:py-20 flex-1">
        <div className="container mx-auto px-4">
          {loadCoursesQuery.isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, index) => (
                <CourseSkeletonCard key={index} />
              ))}
            </div>
          ) : loadCoursesQuery.data?.items.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                {t("frontend:courses.no_courses")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t("frontend:courses.no_courses_desc")}</p>
              <Button onClick={clearFilters} variant="outline">
                {t("common:clear")}
              </Button>
            </div>
          ) : (
            <>
              <ScrollGroup
                variant="fadeUp"
                staggerDelay={0.1}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              >
                {loadCoursesQuery.data?.items.map((course) => {
                  const tags = course.tags || [];
                  const extraCount = Math.max(0, tags.length - 3);
                  return (
                    <Link
                      key={course._id}
                      href={`/courses/${course._id}`}
                      className="group block h-full"
                    >
                      <CourseCardContent.Card className="h-full border border-border/60 bg-card/95 dark:bg-slate-950/75 transition-all duration-300 shadow-md group-hover:border-primary/40 group-hover:shadow-xl">
                        <div className="relative overflow-hidden">
                          <CourseCardContent.CardImage
                            src={course.featuredImage?.url || "/courselit_backdrop.webp"}
                            alt={course.title}
                          />
                          <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
                        </div>
                        <CourseCardContent.CardContent className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <CourseCardContent.CardHeader className="flex-1">
                              <span className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                {course.title}
                              </span>
                            </CourseCardContent.CardHeader>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary transition-all duration-300 group-hover:bg-primary/20">
                              <BookOpen className="h-5 w-5" />
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                            {course.shortDescription}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span>
                                {t("course:public.lessons_number", { count: course.statsLessonCount })}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-secondary/60 text-foreground">
                                  {tag.name}
                                </Badge>
                              ))}
                              {extraCount > 0 && (
                                <Badge variant="secondary" className="text-xs bg-secondary/60 text-foreground">
                                  +{extraCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                            {t("frontend:courses.view_course")}
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </CourseCardContent.CardContent>
                      </CourseCardContent.Card>
                    </Link>
                  );
                })}
              </ScrollGroup>

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("common:previous")}
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 ${currentPage === page ? "bg-brand-primary hover:bg-brand-primary-hover" : ""}`}
                        >
                          {page}
                        </Button>
                      ),
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2"
                  >
                    {t("common:next")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function Page() {
  const { t } = useTranslation(["common"]);
  return (
    <Suspense fallback={<div>{t("common:loading")}</div>}>
      <CoursesContent />
    </Suspense>
  );
}
