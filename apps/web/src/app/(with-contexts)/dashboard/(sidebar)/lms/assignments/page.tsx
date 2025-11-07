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
import { PublicationStatusEnum } from "@workspace/common-logic/lib/publication_status";
import { Badge } from "@workspace/ui/components/badge";
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
import { Archive, Edit, Eye, FileText, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";



type ItemType =
  GeneralRouterOutputs["lmsModule"]["assignmentModule"]["assignment"]["list"]["items"][number];
type QueryParams = Parameters<
  typeof trpc.lmsModule.assignmentModule.assignment.list.useQuery
>[0];

export default function Page() {
  const { t } = useTranslation(["dashboard"]); 
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [parsedData, setParsedData] = useState<Array<ItemType>>([]);
  const [parsedPageination, setParsedPagination] = useState({
    pageCount: 1,
  });

  const archiveMutation =
    trpc.lmsModule.assignmentModule.assignment.archive.useMutation({
      onSuccess: () => {
        // Refetch the data to update the list
        loadListQuery.refetch();
      },
    });

  const handleArchive = useCallback(
    (assignment: ItemType) => {
      if (confirm(t("dashboard:lms.assignment.archive_confirm"))) {
        archiveMutation.mutate({
          id: assignment._id,
        });
      }
    },
    [archiveMutation, t],
  );

  const breadcrumbs = [
    { label: t("dashboard:lms.assignment.module_title"), href: "#" },
  ];

  const columns: ColumnDef<ItemType>[] = useMemo(() => {
    return [
      {
        accessorKey: "title",
        header: t("common:title"), 
        cell: ({ row }) => {
          const obj = row.original;
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium">{obj.title}</div>
                <div className="text-sm text-muted-foreground">
                  {obj.description}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "courseId",
        header: t("dashboard:table.course"),
        cell: ({ row }) => {
          const assignment = row.original;
          const course = (assignment as any).course;
          return (
            <Badge variant="outline">
              {course?.title || assignment.courseId || t("dashboard:table.no_course")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "ownerId",
        header: t("dashboard:table.owner"),
        cell: ({ row }) => {
          const assignment = row.original;
          const owner = (assignment as any).owner;
          return (
            <div className="text-sm text-muted-foreground">
              {owner?.name || owner?.email || assignment.ownerId || t("common:unknown")}
            </div>
          );
        },
      },
      {
        accessorKey: "assignmentType",
        header: t("common:type"),
        cell: ({ row }) => {
          const assignmentType = row.getValue("assignmentType") as string;
          return (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              {assignmentType
                ?.replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()) || t("common:unknown")}
            </div>
          );
        },
      },
      {
        accessorKey: "publicationStatus",
        header: t("common:publication_status"),
        cell: ({ row }) => {
          const status = row.original.publicationStatus;
          const getStatusVariant = (status: PublicationStatusEnum) => {
            switch (status) {
              case PublicationStatusEnum.PUBLISHED:
                return "default";
              case PublicationStatusEnum.DRAFT:
                return "secondary"
              case PublicationStatusEnum.ARCHIVED:
                return "destructive"
              default:
                return "secondary";
            }
          };

          const getStatusLabel = (status: PublicationStatusEnum) => {
            switch (status) {
              case PublicationStatusEnum.PUBLISHED:
                return t("common:published");
              case PublicationStatusEnum.DRAFT:
                return t("common:draft");
              case PublicationStatusEnum.ARCHIVED:
                return t("common:archived");
              default:
                return t("common:draft");
            }
          };

          return (
            <Badge variant={getStatusVariant(status)}>
              {getStatusLabel(status)}
            </Badge>
          );
        },
        meta: {
          label: t("common:status"),
          variant: "select",
          options: [
            { label: t("common:published"), value: "published" },
            { label: t("common:draft"), value: "draft" },
            { label: t("common:archived"), value: "archived" },
          ],
        },
        enableColumnFilter: true,
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
          const obj = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/lms/assignments/${obj._id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("common:view")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/lms/assignments/${obj._id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("common:edit")}
                  </Link>
                </DropdownMenuItem>
                {obj.publicationStatus !== PublicationStatusEnum.ARCHIVED && (
                  <DropdownMenuItem
                    onClick={() => handleArchive(obj)}
                    className="text-orange-600"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {t("dashboard:table.archive")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [handleArchive]);

  const { table } = useDataTable({
    columns,
    data: parsedData,
    pageCount: parsedPageination.pageCount,
    enableGlobalFilter: true,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
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
        publicationStatus: Array.isArray(
          tableState.columnFilters.find((filter) => filter.id === "publicationStatus")
            ?.value,
        )
          ? ((
            tableState.columnFilters.find((filter) => filter.id === "publicationStatus")
              ?.value as PublicationStatusEnum[]
          )[0])
          : undefined,
      },
    };
    if (tableState.sorting[0]) {
      parsed.orderBy = {
        field: tableState.sorting[0].id as any,
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
    trpc.lmsModule.assignmentModule.assignment.list.useQuery(queryParams);

  useEffect(() => {
    if (!loadListQuery.data) return;
    const parsed = loadListQuery.data.items || [];
    setParsedData(parsed);
    setParsedPagination({
      pageCount: Math.ceil(
        loadListQuery.data.total / loadListQuery.data.meta.take,
      ),
    });
  }, [loadListQuery.data]);

  return (
    <DashboardContent breadcrumbs={breadcrumbs}>
      <HeaderTopbar
        header={{
          title: t("dashboard:lms.assignment.module_title"), 
          subtitle: t("dashboard:lms.assignment.module_description"),
        }}
        rightAction={<CreateButton href="/dashboard/lms/assignments/new" />}
      />
      <Card>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Input
              placeholder={t("common:search_placeholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-8 w-40 lg:w-56"
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
