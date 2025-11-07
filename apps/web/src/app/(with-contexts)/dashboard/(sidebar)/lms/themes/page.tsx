"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import { CreateButton } from "@/components/dashboard/layout/create-button";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { DataTable } from "@workspace/components-library";
import { DataTableToolbar } from "@workspace/components-library";
import { useDataTable } from "@workspace/components-library";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { ColumnDef } from "@tanstack/react-table";
import { PublicationStatusEnum } from "@workspace/common-logic/lib/publication_status";
import { DeleteConfirmNiceDialog, NiceModal, useToast } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { Edit, MoreHorizontal, Palette, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type ItemType = GeneralRouterOutputs["lmsModule"]["themeModule"]["theme"]["list"]["items"][number];
type QueryParams = Parameters<typeof trpc.lmsModule.themeModule.theme.list.useQuery>[0];

export default function Page() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { toast } = useToast();
  const [parsedData, setParsedData] = useState<ItemType[]>([]);
  const [parsedPagination, setParsedPagination] = useState({ pageCount: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const breadcrumbs = useMemo(() => [
    { label: t("dashboard:lms.theme.module_title"), href: "#" } 
  ], [t]);

  const deleteMutation = trpc.lmsModule.themeModule.theme.delete.useMutation({
    onSuccess: () => {
      toast({ title: t("common:success"), description: "Theme deleted successfully" });
      loadListQuery.refetch();
    },
    onError: (err: any) => {
      toast({ title: t("common:error"), description: err.message, variant: "destructive" });
    },
  });

  const handleDelete = useCallback((theme: ItemType) => {
    NiceModal.show(DeleteConfirmNiceDialog, {
      title: "Delete Theme",
      message: `Are you sure you want to delete "${theme.name}"?`,
      data: theme,
    }).then((result) => {
      if (result.reason === "confirm") {
        deleteMutation.mutate({ id: theme._id });
      }
    });
  }, [deleteMutation]);

  const getStatusBadge = useCallback((status: PublicationStatusEnum) => {
    const variants: Record<PublicationStatusEnum, "default" | "secondary" | "destructive"> = {
      [PublicationStatusEnum.PUBLISHED]: "default",
      [PublicationStatusEnum.DRAFT]: "secondary",
      [PublicationStatusEnum.ARCHIVED]: "destructive",
    };
    const labels: Record<PublicationStatusEnum, string> = {
      [PublicationStatusEnum.PUBLISHED]: t("common:published"),
      [PublicationStatusEnum.DRAFT]: t("common:draft"),
      [PublicationStatusEnum.ARCHIVED]: t("common:archived"),
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  }, [t]);

  const columns: ColumnDef<ItemType>[] = useMemo(() => {
    return [
      {
        accessorKey: "name",
        header: t("common:title"),
        cell: ({ row }) => {
          const theme = row.original;
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded flex items-center justify-center">
                <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium">{theme.name}</div>
                <div className="text-sm text-muted-foreground">
                  {theme.description || "No description"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "publicationStatus",
        header: t("common:status"),
        cell: ({ row }) => getStatusBadge(row.getValue("publicationStatus")),
        meta: {
          label: t("common:status"),
          variant: "select",
          options: [
            { label: t("common:draft"), value: PublicationStatusEnum.DRAFT },
            { label: t("common:published"), value: PublicationStatusEnum.PUBLISHED },
            { label: t("common:archived"), value: PublicationStatusEnum.ARCHIVED },
          ],
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "createdAt",
        header: t("common:created"),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string;
          return <div className="text-sm text-muted-foreground">{new Date(date).toLocaleDateString()}</div>;
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
          const theme = row.original;
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
                  <Link href={`/dashboard/lms/themes/${theme._id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("common:edit")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(theme)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("common:delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [t, getStatusBadge, handleDelete]);

  const { table } = useDataTable({
    columns,
    data: parsedData,
    pageCount: parsedPagination.pageCount,
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
        publicationStatus: (() => {
          const filterValue = tableState.columnFilters.find((filter) => filter.id === "publicationStatus")?.value;
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
      parsed.search = { q: debouncedSearchQuery };
    }
    return parsed;
  }, [tableState.sorting, tableState.pagination, tableState.columnFilters, debouncedSearchQuery]);

  const loadListQuery = trpc.lmsModule.themeModule.theme.list.useQuery(queryParams);

  useEffect(() => {
    if (!loadListQuery.data) return;
    setParsedData(loadListQuery.data.items || []);
    setParsedPagination({
      pageCount: Math.ceil((loadListQuery.data.total || 0) / loadListQuery.data.meta.take),
    });
  }, [loadListQuery.data]);

  return (
    <DashboardContent breadcrumbs={breadcrumbs}>
      <HeaderTopbar
        header={{
          title: t("dashboard:lms.theme.module_title"),   
          subtitle: t("dashboard:lms.theme.module_description"),
        }}
        rightAction={<CreateButton href="/dashboard/lms/themes/new" />}
      />
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 pt-6">
            <Input
              placeholder={t("common:search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
