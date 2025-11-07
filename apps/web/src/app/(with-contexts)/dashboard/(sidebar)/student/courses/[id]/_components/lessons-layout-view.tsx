"use client";

import { GeneralRouterOutputs } from "@/server/api/types";
import { LessonTypeEnum } from "@workspace/common-logic/models/lms/lesson.types";
import { UserLessonProgressStatusEnum } from "@workspace/common-logic/models/lms/user-progress.types";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronDown, File, FileText, HelpCircle, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type CourseType = GeneralRouterOutputs["lmsModule"]["courseModule"]["course"]["publicGetByIdDetailed"];
type ChapterType = CourseType["chapters"][number];
type ILessonItemType = GeneralRouterOutputs["lmsModule"]["courseModule"]["lesson"]["list"]["items"][number];

function SortableLesson({
  lesson,
  courseId,
  isCompleted,
  currentLessonId,
}: {
  lesson: ILessonItemType;
  courseId: string;
  isCompleted?: boolean;
  currentLessonId?: string;
}) {
  const router = useRouter();
  const href = `/dashboard/student/courses/${courseId}/lessons/${lesson._id}`;
  const isCurrentLesson = currentLessonId === lesson._id;

  const getLessonIcon = () => {
    switch (lesson.type) {
      case LessonTypeEnum.VIDEO:
        return Video;
      case LessonTypeEnum.QUIZ:
        return HelpCircle;
      case LessonTypeEnum.FILE:
        return File;
      case LessonTypeEnum.TEXT:
      default:
        return FileText;
    }
  };

  const LessonIcon = getLessonIcon();

  const handleClick = () => {
    if (!isCurrentLesson) {
      router.push(href);
    }
  };

  return (
    <div 
      className={cn(
        "group/lesson flex items-center gap-3 w-full py-2 px-3 text-sm transition-colors",
        isCurrentLesson 
          ? "bg-accent cursor-default" 
          : "cursor-pointer hover:bg-accent/50"
      )}
      onClick={handleClick}
    >
      <div className="pl-5 flex items-center gap-2 flex-1 min-w-0">
        <LessonIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{lesson.title}</span>
      </div>
      {isCompleted && (
        <Check className="h-4 w-4 text-green-500 shrink-0" />
      )}
    </div>
  );
}

function SortableChapter({ 
  chapter, 
  lessons, 
  courseId, 
  isExpanded, 
  onToggle,
  completedLessonIds,
  currentLessonId,
}: {
  chapter: ChapterType;
  lessons: ILessonItemType[];
  courseId: string;
  isExpanded: boolean;
  onToggle: (chapter: ChapterType) => void;
  completedLessonIds?: Set<string>;
  currentLessonId?: string;
}) {
  return (
    <div className="group/chapter">
      <div className="flex items-center gap-2 w-full py-2 px-3 hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => onToggle(chapter)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0"
        >
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
        </Button>
        <span className="text-sm font-medium text-foreground truncate flex-1">{chapter.title}</span>
      </div>

      {isExpanded && (
        <div>
          {lessons.map((lesson) => (
              <SortableLesson 
                key={lesson._id} 
                lesson={lesson} 
                courseId={courseId}
                isCompleted={completedLessonIds?.has(lesson._id)}
                currentLessonId={currentLessonId}
              />
            ))}          
        </div>
      )}
    </div>
  );
}

interface LessonsLayoutViewProps {
  courseId: string;
  chapters: ChapterType[];
  progress?: {
    lessons?: Array<{
      lessonId: any;
      status: UserLessonProgressStatusEnum;
    }>;
  } | null;
  currentLessonId?: string;
}

export function LessonsLayoutView({ 
  courseId, 
  chapters, 
  progress, 
  currentLessonId,
}: LessonsLayoutViewProps) {
  const { t } = useTranslation(["dashboard"]);
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  const completedLessonIds = useMemo(() => {
    if (!progress?.lessons) return new Set<string>();
    return new Set(
      progress.lessons
        .filter((l) => l.status === UserLessonProgressStatusEnum.COMPLETED)
        .map((l) => l.lessonId)
    );
  }, [progress]);

  const handleToggleChapter = useCallback((chapter: ChapterType) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter._id)) {
        next.delete(chapter._id);
      } else {
        next.add(chapter._id);
      }
      return next;
    });
  }, []);

  const sortedChapters = useMemo(() => {
    if (!chapters) return [];
    return [...chapters].sort((a, b) => a.order - b.order);
  }, [chapters]);

  useEffect(() => {
    if (chapters) {
      setExpandedChapters(new Set(chapters.map((chapter) => chapter._id)));
    }
  }, [chapters]);

  if (sortedChapters.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {t("dashboard:student.no_lessons")}
      </div>
    );
  }

  return sortedChapters.map((chapter) => (
    <SortableChapter
      key={chapter._id}
      chapter={chapter}
      lessons={chapter.lessons as ILessonItemType[]}
      courseId={courseId}
      isExpanded={expandedChapters.has(chapter._id)}
      onToggle={handleToggleChapter}
      completedLessonIds={completedLessonIds}
      currentLessonId={currentLessonId}
    />
  ));
}
