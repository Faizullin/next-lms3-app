"use client";

import { useCourseDetail } from "@/components/course/detail/course-detail-context";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { LessonTypeEnum } from "@workspace/common-logic/models/lms/lesson.types";
import {
  DeleteConfirmNiceDialog,
  FormDialog,
  IUseDialogControl,
  NiceModal,
  useDialogControl,
  useToast,
} from "@workspace/components-library";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { BookOpen, ChevronDown, Edit, File, FileText, GripVertical, HelpCircle, Plus, Trash2, Video } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

type CourseType = GeneralRouterOutputs["lmsModule"]["courseModule"]["course"]["getById"];
type ChapterType = CourseType["chapters"][number];
type ILessonItemType = GeneralRouterOutputs["lmsModule"]["courseModule"]["lesson"]["list"]["items"][number];

const ChapterSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});
type ChapterFormData = z.infer<typeof ChapterSchema>;

const LessonCreateSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.nativeEnum(LessonTypeEnum),
});
type LessonCreateFormData = z.infer<typeof LessonCreateSchema>;



function SortableLesson({
  lesson,
  chapterId,
  courseId,
  onDelete,
  editable,
}: {
  lesson: ILessonItemType;
  chapterId: string;
  courseId: string;
  onDelete: (lesson: ILessonItemType, lessonTitle: string) => void;
  editable?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const href = `/dashboard/lms/courses/${courseId}/content/section/${chapterId}/lessons/${lesson._id}`;
  const isActive = pathname === `/dashboard/lms/courses/${courseId}/content/section/${chapterId}/lessons/${lesson._id}`;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: lesson._id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group/lesson flex items-center gap-3 w-full py-2 px-3 text-sm transition-colors cursor-pointer",
        isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"
      )}
      onClick={() => router.push(href)}
    >
      <div className="pl-5 flex items-center gap-2 flex-1 min-w-0">
        {editable && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        )}
        <LessonIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{lesson.title}</span>
      </div>
      {editable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover/lesson:opacity-100 transition-opacity shrink-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(lesson, lesson.title);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
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
  onEdit,
  onAddLesson,
  onReorderLessons,
  onDeleteChapter,
  onDeleteLesson,
  editable,
}: {
  chapter: ChapterType;
  lessons: ILessonItemType[];
  courseId: string;
  isExpanded: boolean;
  onToggle: (chapter: ChapterType) => void;
  onEdit: (chapter: ChapterType) => void;
  onAddLesson: (chapter: ChapterType) => void;
  onReorderLessons: (chapter: ChapterType, lessons: ILessonItemType[]) => void;
  onDeleteChapter: (chapter: ChapterType, chapterTitle: string) => void;
  onDeleteLesson: (lesson: ILessonItemType, lessonTitle: string) => void;
  editable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: chapter._id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l._id === active.id);
      const newIndex = lessons.findIndex((l) => l._id === over.id);
      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      onReorderLessons(chapter, newLessons);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="group/chapter">
      <div className="flex items-center gap-2 w-full py-2 px-3 hover:bg-accent/50 transition-colors group cursor-pointer" onClick={() => onToggle(chapter)}>
        {editable && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0"
        >
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
        </Button>
        <span className="text-sm font-medium text-foreground truncate flex-1">{chapter.title}</span>
        
        {editable && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/chapter:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onAddLesson(chapter);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/chapter:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(chapter);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/chapter:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChapter(chapter, chapter.title);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div>
          {editable ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={lessons.map((l) => l._id)} strategy={verticalListSortingStrategy}>
                  {lessons.map((lesson) => (
                    <SortableLesson 
                      key={lesson._id} 
                      lesson={lesson} 
                      chapterId={chapter._id} 
                      courseId={courseId}
                      onDelete={onDeleteLesson}
                      editable={editable}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              lessons.map((lesson) => (
                <SortableLesson 
                  key={lesson._id} 
                  lesson={lesson} 
                  chapterId={chapter._id} 
                  courseId={courseId}
                  onDelete={onDeleteLesson}
                  editable={editable}
                />
              ))
            ) }
        </div>
      )}
    </div>
  );
}

export function CourseNavSidebar({
  editable = false,
}: {
  editable?: boolean;
}) {
  const { t } = useTranslation(["common", "dashboard"]);
  const pathname = usePathname();
  const { toast } = useToast();
  const trpcUtils = trpc.useUtils();

  const { initialCourse, loadCourseDetailQuery } = useCourseDetail() 
  const loadLessonsQuery = trpc.lmsModule.courseModule.lesson.list.useQuery({ courseId: initialCourse._id }, { enabled: !!initialCourse._id });

  const chapterDialog = useDialogControl<{ args: { chapter: ChapterType | null; course: CourseType } }>();
  const lessonDialog = useDialogControl<{ args: {  chapter: ChapterType; course: CourseType  } }>();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [pendingChapterOrder, setPendingChapterOrder] = useState<string[] | null>(null);
  const [pendingLessonOrders, setPendingLessonOrders] = useState<Map<string, string[]>>(new Map());

  const lessons = useMemo(() => loadLessonsQuery.data?.items || [], [loadLessonsQuery.data?.items]);
  const hasChanges = pendingChapterOrder !== null || pendingLessonOrders.size > 0;

  const reorderStructureMutation = trpc.lmsModule.courseModule.course.reorderStructure.useMutation({
    onSuccess: () => {
      setPendingChapterOrder(null);
      setPendingLessonOrders(new Map());
      trpcUtils.lmsModule.courseModule.course.getById.invalidate({ id: initialCourse._id });
      trpcUtils.lmsModule.courseModule.lesson.list.invalidate({ courseId: initialCourse._id });
      toast({ title: t("common:success"), description: t("dashboard:lms.course.order_saved") });
    },
    onError: (error) => {
      toast({ title: t("common:error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteChapterMutation = trpc.lmsModule.courseModule.course.removeCourseChapter.useMutation({
    onSuccess: () => {
      trpcUtils.lmsModule.courseModule.course.getById.invalidate({ id: initialCourse._id });
    },
    onError: (error) => {
      toast({ title: t("common:error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteLessonMutation = trpc.lmsModule.courseModule.lesson.delete.useMutation({
    onSuccess: () => {
      trpcUtils.lmsModule.courseModule.course.getById.invalidate({ id: initialCourse._id });
      trpcUtils.lmsModule.courseModule.lesson.list.invalidate({ courseId: initialCourse._id });
    },
    onError: (error) => {
      toast({ title: t("common:error"), description: error.message, variant: "destructive" });
    },
  });

  const currentChapters = loadCourseDetailQuery.data?.chapters || [];

  useEffect(() => {
    if (currentChapters) {
      const allChapterIds = new Set(currentChapters.map((ch) => ch._id));
      setExpandedChapters(allChapterIds);
    }
  }, [currentChapters]);

  useEffect(() => {
    if (!reorderStructureMutation.isPending && initialCourse) {
      if (pendingChapterOrder) {
        const currentOrder = [...(currentChapters || [])].sort((a, b) => a.order - b.order).map(ch => ch._id);
        const pendingMatches = JSON.stringify(currentOrder) === JSON.stringify(pendingChapterOrder);
        if (pendingMatches) {
          setPendingChapterOrder(null);
        }
      }

      if (pendingLessonOrders.size > 0) {
        const updatedLessonOrders = new Map(pendingLessonOrders);
        let hasChanges = false;

        pendingLessonOrders.forEach((pendingLessons, chapterId) => {
          const chapter = currentChapters?.find(ch => ch._id === chapterId);
          if (chapter) {
            const currentLessonIds = chapter.lessonOrderIds || [];
            const pendingMatches = JSON.stringify(currentLessonIds) === JSON.stringify(pendingLessons);
            if (pendingMatches) {
              updatedLessonOrders.delete(chapterId);
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          setPendingLessonOrders(updatedLessonOrders);
        }
      }
    }
  }, [initialCourse, reorderStructureMutation.isPending, pendingChapterOrder, pendingLessonOrders]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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

  const handleReorderChapters = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!currentChapters) return;

    if (over && active.id !== over.id) {
      const chapters = [...currentChapters].sort((a, b) => a.order - b.order);
      const oldIndex = chapters.findIndex((item) => item._id === active.id);
      const newIndex = chapters.findIndex((item) => item._id === over.id);
      const reorderedChapters = arrayMove(chapters, oldIndex, newIndex);
      setPendingChapterOrder(reorderedChapters.map(ch => ch._id));
    }
  }, [currentChapters]);

  const handleReorderLessons = useCallback((chapter: ChapterType, newLessons: ILessonItemType[]) => {
    const newLessonIds = newLessons.map(l => l._id);
    setPendingLessonOrders(prev => {
      const next = new Map(prev);
      next.set(chapter._id, newLessonIds);
      return next;
    });
  }, []);

  const handleDeleteChapter = useCallback((chapter: ChapterType, chapterTitle: string) => {
    NiceModal.show(DeleteConfirmNiceDialog, {
      title: t("dashboard:lms.course.delete_chapter"),
      message: t("dashboard:lms.course.delete_chapter_confirm", { title: chapterTitle }),
    })
      .then((result) => {
        if (result.reason === "confirm") {
          deleteChapterMutation.mutate({
            courseId: initialCourse._id,
            chapterId: chapter._id,
          });
        }
      })
      .catch((error) => {
        console.error("Error during deletion:", error);
      });
  }, [initialCourse._id, deleteChapterMutation, t]);

  const handleDeleteLesson = useCallback((lesson: ILessonItemType, lessonTitle: string) => {
    NiceModal.show(DeleteConfirmNiceDialog, {
      title: t("dashboard:lms.course.delete_lesson"),
      message: t("dashboard:lms.course.delete_lesson_confirm", { title: lessonTitle }),
    })
      .then((result) => {
        if (result.reason === "confirm") {
          deleteLessonMutation.mutate({
            id: lesson._id,
          });
        }
      })
      .catch((error) => {
        console.error("Error during deletion:", error);
      });
  }, [deleteLessonMutation, t]);

  const handleSaveOrder = useCallback(async () => {
      if (!initialCourse) return;
    
    try {
      const chapterOrder = pendingChapterOrder || 
        [...currentChapters].sort((a, b) => a.order - b.order).map(ch => ch._id);
      
      const chapters = chapterOrder.map((chapterId, index) => {
        const chapter = currentChapters.find(ch => ch._id === chapterId);
        const lessonOrderIds = pendingLessonOrders.get(chapterId) || chapter?.lessonOrderIds;
        
        return {
          chapterId,
          order: index,
          lessonOrderIds,
        };
      });

      await reorderStructureMutation.mutateAsync({
        courseId: initialCourse._id,
        chapters,
      });
    } catch (error) {
      console.error("Failed to save order:", error);
    }
  }, [
    pendingChapterOrder,
    pendingLessonOrders,
    initialCourse,
    initialCourse._id,
    reorderStructureMutation,
  ]);

  const getChapterLessons = useCallback((chapter: ChapterType): ILessonItemType[] => {
    const lessonOrderIds = pendingLessonOrders.get(chapter._id) || chapter.lessonOrderIds || [];
    const lessonMap = new Map(lessons.map(lesson => [lesson._id, lesson]));
    return lessonOrderIds
      .map(id => lessonMap.get(id))
      .filter((lesson) => !!lesson);
  }, [lessons, pendingLessonOrders]);

  const sortedChapters = useMemo(() => {
    if (!currentChapters) return [];
    const chapters = [...currentChapters].sort((a, b) => a.order - b.order);
    if (pendingChapterOrder) {
      return pendingChapterOrder.map(id => chapters.find(ch => ch._id === id)).filter(Boolean) as ChapterType[];
    }
    return chapters;
  }, [currentChapters, pendingChapterOrder]);

  const isOnCoursePage = pathname?.startsWith(`/dashboard/lms/courses/${initialCourse._id}`);

  if (loadCourseDetailQuery.isLoading) {
    return (
      <aside className="w-full h-full space-y-3 p-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </aside>
    );
  }

  return (
    <>
      <aside className="w-full h-full lg:border lg:bg-card lg:shadow-sm">
        <div className="flex flex-col">
          <div className="p-4">
            <Link
              href={`/dashboard/lms/courses/${initialCourse._id}`}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isOnCoursePage ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <BookOpen className="h-5 w-5 shrink-0" />
              <span className="flex-1 truncate">{initialCourse.title}</span>
            </Link>
          </div>

          {
            editable && (
              <div className="p-4 flex justify-start gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => chapterDialog.show({ args: { chapter: null, course: initialCourse } })}
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  {t("dashboard:lms.course.add_chapter")}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="text-xs" 
                  onClick={handleSaveOrder}
                  disabled={reorderStructureMutation.isPending || !hasChanges}
                >
                  {reorderStructureMutation.isPending ? t("common:saving") : t("dashboard:lms.course.save_order")}
                </Button>
              </div>
            )
          }

          {editable ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorderChapters}>
              <SortableContext items={sortedChapters.map((c) => c._id)} strategy={verticalListSortingStrategy}>
                {sortedChapters.map((chapter) => (
                  <SortableChapter
                    key={chapter._id}
                    chapter={chapter}
                    lessons={getChapterLessons(chapter)}
                    courseId={initialCourse._id}
                    isExpanded={expandedChapters.has(chapter._id)}
                    onToggle={handleToggleChapter}
                    onEdit={(ch) => chapterDialog.show({ args: { chapter: ch, course: initialCourse } })}
                    onAddLesson={(ch) => lessonDialog.show({ args: { chapter: ch, course: initialCourse } })}
                    onReorderLessons={handleReorderLessons}
                    onDeleteChapter={handleDeleteChapter}
                    onDeleteLesson={handleDeleteLesson}
                    editable={editable}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            sortedChapters.map((chapter) => (
              <SortableChapter
                key={chapter._id}
                chapter={chapter}
                lessons={getChapterLessons(chapter)}
                courseId={initialCourse._id}
                isExpanded={expandedChapters.has(chapter._id)}
                onToggle={handleToggleChapter}
                onEdit={(ch) => chapterDialog.show({ args: { chapter: ch, course: initialCourse } })}
                onAddLesson={(ch) => lessonDialog.show({ args: { chapter: ch, course: initialCourse } })}
                onReorderLessons={handleReorderLessons}
                onDeleteChapter={handleDeleteChapter}
                onDeleteLesson={handleDeleteLesson}
                editable={editable}
              />
            ))
          )}
        </div>
      </aside>

      <ChapterDialog control={chapterDialog} />
      <LessonCreateDialog control={lessonDialog} />
    </>
  );
}

function ChapterDialog({
  control,
}: {
  control: IUseDialogControl<{ args: { chapter: ChapterType | null; course: CourseType } }>;
}) {
  const { t } = useTranslation(["common", "dashboard"]);
  const { toast } = useToast();
  const trpcUtils = trpc.useUtils();

  const editingChapter = control.data?.args.chapter ?? null;
  const initialCourse = control.data?.args.course;

  const form = useForm<ChapterFormData>({
    resolver: zodResolver(ChapterSchema),
    defaultValues: {
      title: editingChapter?.title || "",
      description: editingChapter?.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      title: editingChapter?.title || "",
      description: editingChapter?.description || "",
    });
  }, [editingChapter, form]);

  const createMutation = trpc.lmsModule.courseModule.course.addCourseChapter.useMutation({
    onSuccess: () => {
      toast({ title: t("common:success"), description: t("dashboard:lms.course.chapter_created") });
      trpcUtils.lmsModule.courseModule.course.getById.invalidate();
      control.hide();
    },
  });

  const updateMutation = trpc.lmsModule.courseModule.course.updateCourseChapter.useMutation({
    onSuccess: () => {
      toast({ title: t("common:success"), description: t("dashboard:lms.course.chapter_updated") });
      trpcUtils.lmsModule.courseModule.course.getById.invalidate();
      control.hide();
    },
  });

  const handleSubmit = useCallback(
    (data: ChapterFormData) => {
      if (!initialCourse) return;
      if (editingChapter) {
        updateMutation.mutate({
          courseId: initialCourse._id,
          chapterId: editingChapter._id,
          data,
        });
      } else {
        createMutation.mutate({ courseId: initialCourse._id, data });
      }
    },
    [initialCourse, editingChapter, createMutation, updateMutation]
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <FormDialog
      open={control.isVisible}
      onOpenChange={(open) => {
        if (!open) control.hide();
      }}
      title={editingChapter ? t("dashboard:lms.course.edit_chapter") : t("dashboard:lms.course.new_chapter")}
      onSubmit={form.handleSubmit(handleSubmit)}
      onCancel={control.hide}
      isLoading={isSaving}
      submitText={editingChapter ? t("common:save") : t("common:create")}
      cancelText={t("common:cancel")}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{t("common:title")}</FieldLabel>
              <Input {...field} placeholder={t("dashboard:lms.course.chapter_title_placeholder")} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </FormDialog>
  );
}

function LessonCreateDialog({
  control,
}: {
  control: IUseDialogControl<{ args: { chapter: ChapterType; course: CourseType } }>;
}) {
  const { t } = useTranslation(["common", "dashboard"]);
  const trpcUtils = trpc.useUtils();

  const form = useForm<LessonCreateFormData>({
    resolver: zodResolver(LessonCreateSchema),
    defaultValues: { title: "", type: LessonTypeEnum.TEXT },
  });

  useEffect(() => {
    if (control.isVisible) {
      form.reset({ title: "", type: LessonTypeEnum.TEXT });
    }
  }, [control.isVisible, form]);

  const createLessonMutation = trpc.lmsModule.courseModule.lesson.create.useMutation({
    onSuccess: (created) => {
      trpcUtils.lmsModule.courseModule.course.getById.invalidate();
      trpcUtils.lmsModule.courseModule.lesson.list.invalidate();
      control.hide();
    },
  });

  const handleSubmit = useCallback(
    (data: LessonCreateFormData) => {
      const args = control.data?.args;
      if (!args) return;

      createLessonMutation.mutate({
        data: {
          courseId: args.course._id, 
          chapterId: args.chapter._id,
          title: data.title,
          type: data.type,
          content: { type: "doc", content: "", assets: [], widgets: [], config: { editorType: "tiptap" } },
          requiresEnrollment: true,
          downloadable: false,
        },
      });
    },
    [control.data?.args, createLessonMutation]
  );

  return (
    <FormDialog
      open={control.isVisible}
      onOpenChange={(open) => {
        if (!open) control.hide();
      }}
      title={t("dashboard:lms.course.new_lesson")}
      onSubmit={form.handleSubmit(handleSubmit)}
      onCancel={control.hide}
      submitText={t("dashboard:lms.course.create_and_edit")}
      cancelText={t("common:cancel")}
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{t("common:title")}</FieldLabel>
              <Input {...field} placeholder={t("dashboard:lms.course.lesson_title_placeholder")} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </FormDialog>
  );
}

