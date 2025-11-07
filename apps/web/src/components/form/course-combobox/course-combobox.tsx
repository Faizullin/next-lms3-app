"use client";

import { trpc } from "@/utils/trpc";
import { ComboBox2 } from "@workspace/components-library";
import React, { useCallback } from "react";
import { GeneralRouterOutputs } from "@/server/api/types";


type CourseItemRouterType = GeneralRouterOutputs["lmsModule"]["courseModule"]["course"]["list"]["items"][number];
type CourseItem = {
  _id: CourseItemRouterType["_id"];
  title: CourseItemRouterType["title"];
  chapters: CourseItemRouterType["chapters"];
};

interface CourseComboboxBaseProps {
  disabled?: boolean;
  title?: string;
  showCreateButton?: boolean;
  showEditButton?: boolean;
  onCreateClick?: () => void;
  onEditClick?: (item: CourseItem) => void;
  createUrl?: string;
  editUrl?: string;
}

interface CourseComboboxSingleProps extends CourseComboboxBaseProps {
  multiple?: false;
  value?: CourseItem;
  onChange?: (value: CourseItem) => void;
}

interface CourseComboboxMultipleProps extends CourseComboboxBaseProps {
  multiple: true;
  value?: CourseItem[];
  onChange?: (value: CourseItem[]) => void;
}

type CourseComboboxProps = CourseComboboxSingleProps | CourseComboboxMultipleProps;

export function CourseCombobox(props: CourseComboboxSingleProps): React.ReactElement;
export function CourseCombobox(props: CourseComboboxMultipleProps): React.ReactElement;
export function CourseCombobox(props: CourseComboboxProps): React.ReactElement {
  const {
    value,
    onChange,
    disabled = false,
    title = "Select course",
    showCreateButton = true,
    showEditButton = true,
    onCreateClick,
    onEditClick,
    createUrl = "/dashboard/lms/courses/new",
    editUrl = "/dashboard/lms/courses/{id}",
    multiple = false,
  } = props;

  const trpcUtils = trpc.useUtils();

  const searchCourses = useCallback(
    async (search: string, offset: number, size: number) => {
      console.log("searchCourses", search, offset, size);
      const result = await trpcUtils.lmsModule.courseModule.course.list.fetch({
        pagination: { skip: offset, take: size },
        search: search ? { q: search } : undefined,
      }, {
        staleTime: 0,
      });
      return result.items.map(course => ({
        _id: course._id,
        title: course.title,
        chapters: course.chapters,
      }));
    },
    [trpcUtils]
  );

  const handleCreate = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
    } else if (createUrl) {
      window.open(createUrl, "_blank");
    }
  }, [onCreateClick, createUrl]);

  const handleEdit = useCallback((item: CourseItem) => {
    if (onEditClick) {
      onEditClick(item);
    } else if (editUrl) {
      const url = editUrl.replace("{id}", item._id);
      window.open(url, "_blank");
    }
  }, [onEditClick, editUrl]);

  return (
    <ComboBox2<CourseItem>
      title={title}
      valueKey="_id"
      value={value as any}
      searchFn={searchCourses}
      renderLabel={(item: CourseItem) => item.title}
      onChange={onChange as any}
      multiple={multiple}
      disabled={disabled}
      showCreateButton={showCreateButton}
      showEditButton={showEditButton}
      onCreateClick={handleCreate}
      onEditClick={handleEdit}
    />
  );
}


