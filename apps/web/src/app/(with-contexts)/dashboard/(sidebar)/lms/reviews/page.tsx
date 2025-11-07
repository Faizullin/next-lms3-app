"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import { CreateButton } from "@/components/dashboard/layout/create-button";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { DataTable } from "@workspace/components-library";
import { DataTableToolbar } from "@workspace/components-library";
import { useDataTable } from "@workspace/components-library";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { type ColumnDef } from "@tanstack/react-table";
import { NiceModal } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { UserAvatarLabel } from "@/components/form/user-combobox/user-avatar-label";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { Archive, Edit, MoreHorizontal, Star, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReviewFormNiceDialog } from "./_components/review-form-nice-dialog";

const breadcrumbs = [
  { label: "LMS", href: "#" },
  { label: "Reviews", href: "#" },
];

type ItemType =
  GeneralRouterOutputs["lmsModule"]["reviewModule"]["review"]["list"]["items"][number];
type QueryParams = Parameters<
  typeof trpc.lmsModule.reviewModule.review.list.useQuery
>[0];

export default function Page() {
  const { t } = useTranslation(["dashboard"]); 
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [parsedData, setParsedData] = useState<Array<ItemType>>([]);
  const [parsedPageination, setParsedPagination] = useState({
    pageCount: 1,
  });

  const deleteMutation = trpc.lmsModule.reviewModule.review.delete.useMutation({
    onSuccess: () => {
      loadListQuery.refetch();
    },
  });

  const handleDelete = useCallback(
    (review: ItemType) => {
      if (
        confirm(
          t("dashboard:lms.reviews.delete_confirm"),
        )
      ) {
        deleteMutation.mutate({ id: review._id });
      }
    },
    [deleteMutation],
  );

  const handleCreateReview = useCallback(async () => {
    const result = await NiceModal.show(ReviewFormNiceDialog, {
      mode: "create",
    });
    if (result.reason === "submit") {
      loadListQuery.refetch();
    }
  }, []);

  const handleEditReview = useCallback(async (review: ItemType) => {
    const result = await NiceModal.show(ReviewFormNiceDialog, {
      mode: "edit",
      id: review._id,
    });
    if (result.reason === "submit") {
      loadListQuery.refetch();
    }
  }, []);

  const columns: ColumnDef<ItemType>[] = useMemo(() => {
    return [
      {
        accessorKey: "title",
        header: t("common:title"),
        cell: ({ row }) => {
          const review = row.original;
          if (!review.author) {
            return <div className="text-sm text-muted-foreground">Anonymous</div>;
          }
          return (
            <div className="flex flex-col gap-1">
              <UserAvatarLabel 
                user={{
                  _id: review.author._id,
                  email: review.author.email || "",
                  username: review.author.username,
                  fullName: review.author.fullName,
                  avatar: review.author.avatar
                }} 
                showEmail={false} 
                avatarClassName="h-8 w-8"
              />
              <div className="font-medium ml-10">{review.title}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "rating",
        header: t("dashboard:table.rating"),
        cell: ({ row }) => {
          const rating = row.original.rating;
          return (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-medium">{rating}/10</span>
            </div>
          );
        },
      },
      {
        accessorKey: "target",
        header: t("dashboard:table.target_type"),
        cell: ({ row }) => {
          const targetType = row.original.target?.entityType || "unknown";
          return (
            <Badge variant="outline">
              {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
            </Badge>
          );
        },
        meta: {
          label: t("dashboard:table.target_type"),
          variant: "select",
          options: [
            { label: "Website", value: "website" },
            { label: "Course", value: "course" },
            { label: "Product", value: "product" },
            { label: "Blog", value: "blog" },
          ],
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "published",
        header: t("common:status"),
        cell: ({ row }) => {
          const published = row.original.published;
          const isFeatured = row.original.featured;

          if (isFeatured) {
            return <Badge variant="default">{t("dashboard:table.featured")}</Badge>;
          }

          return (
            <Badge variant={published ? "default" : "secondary"}>
              {published ? t("common:published") : t("common:draft")}
            </Badge>
          );
        },
        meta: {
          label: t("common:status"),
          variant: "select",
          options: [
            { label: t("common:published"), value: "true" },
            { label: t("common:draft"), value: "false" },
          ],
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "authorId",
        header: t("dashboard:table.linked_user"),
        cell: ({ row }) => {
          const authorId = row.original.authorId;
          if (!authorId) {
            return <span className="text-muted-foreground">{t("dashboard:table.not_linked")}</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{authorId}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "tags",
        header: t("dashboard:table.tags"),
        cell: ({ row }) => {
          const tags = row.original.tags || [];
          if (tags.length === 0) {
            return <span className="text-muted-foreground">{t("dashboard:table.no_tags")}</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("common:created"),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string;
          return (
            <div className="text-sm text-muted-foreground">
              {new Date(date).toLocaleDateString()}
            </div>
          );
        },
        meta: {
          label: t("common:created"),
          variant: "date",
        },
      },
      {
        id: "actions",
        header: t("common:actions"),
        cell: ({ row }) => {
          const review = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t("dashboard:lms.reviews.actions.open_menu")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditReview(review)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("common:edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(review)}
                  className="text-red-600"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {t("common:delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [handleDelete, handleEditReview]);

  const { table } = useDataTable({
    columns,
    data: parsedData,
    pageCount: parsedPageination.pageCount,
    enableGlobalFilter: true,
    initialState: {
      sorting: [{ id: "rating", desc: true }],
    },
  });

  const tableState = table.getState();
  const queryParams = useMemo(() => {
    const parsed: QueryParams = {
      pagination: {
        skip: tableState.pagination.pageIndex * tableState.pagination.pageSize,
        take: tableState.pagination.pageSize,
      },
      filter: {
        published: (() => {
          const filterValue = tableState.columnFilters.find((filter) => filter.id === "published")?.value;
          if (Array.isArray(filterValue)) {
            return filterValue[0] === "true";
          }
          return undefined;
        })(),
        targetType: (() => {
          const filterValue = tableState.columnFilters.find((filter) => filter.id === "targetType")?.value;
          return Array.isArray(filterValue) ? filterValue[0] : undefined;
        })(),
      },
    };

    if (tableState.sorting[0]) {
      parsed.orderBy = {
        field: tableState.sorting[0].id,
        direction: tableState.sorting[0].desc ? "desc" : "asc",
      };
    }

    if (debouncedSearchQuery) {
      parsed.search = {
        q: debouncedSearchQuery,
      };
    }

    return parsed;
  }, [
    tableState.sorting,
    tableState.pagination,
    tableState.columnFilters,
    tableState.globalFilter,
    debouncedSearchQuery,
  ]);

  const loadListQuery =
    trpc.lmsModule.reviewModule.review.list.useQuery(queryParams);

  useEffect(() => {
    if (!loadListQuery.data) return;
    const parsed = loadListQuery.data.items || [];
    setParsedData(parsed);
    setParsedPagination({
      pageCount: Math.ceil(
        (loadListQuery.data.total || 0) / loadListQuery.data.meta.take,
      ),
    });
  }, [loadListQuery.data]);

  return (
    <DashboardContent breadcrumbs={breadcrumbs}>
      <HeaderTopbar
        header={{
          title: t("dashboard:lms.reviews.module_title"),
          subtitle: t("dashboard:lms.reviews.module_description"),
        }}
        rightAction={
          <CreateButton
            onClick={handleCreateReview}
            text={t("dashboard:lms.reviews.add_review")}
          />
        }
      />
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <Input
              placeholder={t("common:search_placeholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="max-w-sm"
            />
            <DataTable table={table}>
              <DataTableToolbar table={table} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
