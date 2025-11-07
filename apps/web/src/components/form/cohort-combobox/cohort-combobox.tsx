"use client";

import { trpc } from "@/utils/trpc";
import { ComboBox2 } from "@workspace/components-library";
import React, { useCallback } from "react";
import { GeneralRouterOutputs } from "@/server/api/types";
import { CohortLabel } from "./cohort-label";

type CohortItemRouterType = GeneralRouterOutputs["lmsModule"]["cohortModule"]["cohort"]["list"]["items"][number];
export type CohortItem = {
  _id: CohortItemRouterType["_id"];
  title: CohortItemRouterType["title"];
  status?: CohortItemRouterType["status"];
};

interface CohortComboboxBaseProps {
  disabled?: boolean;
  readonly?: boolean;
  title?: string;
  showCreateButton?: boolean;
  showEditButton?: boolean;
  onCreateClick?: () => void;
  onEditClick?: (item: CohortItem) => void;
  createUrl?: string;
  editUrl?: string;
  courseId?: string;
}

interface CohortComboboxSingleProps extends CohortComboboxBaseProps {
  multiple?: false;
  value?: CohortItem;
  onChange?: (value: CohortItem) => void;
}

interface CohortComboboxMultipleProps extends CohortComboboxBaseProps {
  multiple: true;
  value?: CohortItem[];
  onChange?: (value: CohortItem[]) => void;
}

type CohortComboboxProps = CohortComboboxSingleProps | CohortComboboxMultipleProps;

export function CohortCombobox(props: CohortComboboxSingleProps): React.ReactElement;
export function CohortCombobox(props: CohortComboboxMultipleProps): React.ReactElement;
export function CohortCombobox(props: CohortComboboxProps): React.ReactElement {
  const {
    value,
    onChange,
    disabled = false,
    readonly = false,
    title = "Select cohort",
    showCreateButton = false,
    showEditButton = true,
    onCreateClick,
    onEditClick,
    createUrl = "/dashboard/lms/cohorts/new",
    editUrl = "/dashboard/lms/cohorts/{id}",
    courseId,
    multiple = false,
  } = props;

  const trpcUtils = trpc.useUtils();

  const searchCohorts = useCallback(
    async (search: string, offset: number, size: number) => {
      const result = await trpcUtils.lmsModule.cohortModule.cohort.list.fetch({
        pagination: { skip: offset, take: size },
        search: search ? { q: search } : undefined,
        filter: courseId ? { courseId } : undefined,
      }, {
        staleTime: 0,
      });
      return result.items.map((cohort: CohortItemRouterType) => ({
        _id: cohort._id,
        title: cohort.title,
        status: cohort.status,
      }));
    },
    [trpcUtils, courseId]
  );

  const handleCreate = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
    } else if (createUrl) {
      window.open(createUrl, "_blank");
    }
  }, [onCreateClick, createUrl]);

  const handleEdit = useCallback((item: CohortItem) => {
    if (onEditClick) {
      onEditClick(item);
    } else if (editUrl) {
      const url = editUrl.replace("{id}", item._id);
      window.open(url, "_blank");
    }
  }, [onEditClick, editUrl]);

  const renderCohortLabel = useCallback((cohort: CohortItem) => {
    return <CohortLabel cohort={cohort} />;
  }, []);

  return (
    <ComboBox2<CohortItem>
      title={title}
      valueKey="_id"
      value={value as any}
      searchFn={searchCohorts}
      renderLabel={renderCohortLabel}
      onChange={onChange as any}
      multiple={multiple}
      disabled={disabled}
      readonly={readonly}
      showCreateButton={showCreateButton}
      showEditButton={showEditButton}
      onCreateClick={handleCreate}
      onEditClick={handleEdit}
    />
  );
}

