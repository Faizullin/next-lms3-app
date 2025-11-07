"use client";

import { trpc } from "@/utils/trpc";
import { ComboBox2 } from "@workspace/components-library";
import { useCallback } from "react";
import React from "react";
import { UserAvatarLabel, UserAvatarItem } from "./user-avatar-label";


interface UserComboboxBaseProps {
  disabled?: boolean;
  title?: string;
  showCreateButton?: boolean;
  showEditButton?: boolean;
  onCreateClick?: () => void;
  onEditClick?: (item: UserAvatarItem) => void;
  createUrl?: string;
  editUrl?: string;
}

interface UserComboboxSingleProps extends UserComboboxBaseProps {
  multiple?: false;
  value?: UserAvatarItem;
  onChange?: (value: UserAvatarItem) => void;
}

interface UserComboboxMultipleProps extends UserComboboxBaseProps {
  multiple: true;
  value?: UserAvatarItem[];
  onChange?: (value: UserAvatarItem[]) => void;
}

type UserComboboxProps = UserComboboxSingleProps | UserComboboxMultipleProps;

export function UserCombobox(props: UserComboboxSingleProps): React.ReactElement;
export function UserCombobox(props: UserComboboxMultipleProps): React.ReactElement;
export function UserCombobox(props: UserComboboxProps): React.ReactElement {
  const {
    value,
    onChange,
    disabled = false,
    title = "Select user",
    showCreateButton = false,
    showEditButton = true,
    onCreateClick,
    onEditClick,
    createUrl = "/dashboard/admin/users/new",
    editUrl = "/dashboard/admin/users/{id}",
    multiple = false,
  } = props;

  const trpcUtils = trpc.useUtils();

  const searchUsers = useCallback(
    async (search: string, offset: number, size: number) => {
      const result = await trpcUtils.userModule.user.list.fetch({
        pagination: { skip: offset, take: size },
        search: search ? { q: search } : undefined,
      }, {
        staleTime: 0,
      });
      return result.items.map(user => ({
        _id: user._id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      }));
    },
    [trpcUtils]
  );

  const renderUserLabel = useCallback((user: UserAvatarItem) => {
    return <UserAvatarLabel user={user} showEmail={!!user.fullName} />;
  }, []);

  const handleCreate = useCallback(() => {
    if (onCreateClick) {
      onCreateClick();
    } else if (createUrl) {
      window.open(createUrl, "_blank");
    }
  }, [onCreateClick, createUrl]);

  const handleEdit = useCallback((item: UserAvatarItem) => {
    if (onEditClick) {
      onEditClick(item);
    } else if (editUrl) {
      const url = editUrl.replace("{id}", item._id);
      window.open(url, "_blank");
    }
  }, [onEditClick, editUrl]);

  return (
    <ComboBox2<UserAvatarItem>
      title={title}
      valueKey="_id"
      value={value as any}
      searchFn={searchUsers}
      renderLabel={renderUserLabel}
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


