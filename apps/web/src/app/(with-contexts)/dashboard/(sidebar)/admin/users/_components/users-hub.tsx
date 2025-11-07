"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { UserAvatarLabel } from "@/components/form/user-combobox/user-avatar-label";
import { formattedLocaleDate } from "@/lib/ui/utils";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableToolbar, useDataTable } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type UserItemType =
  GeneralRouterOutputs["userModule"]["user"]["list"]["items"][number];
type QueryParams = Parameters<
  typeof trpc.userModule.user.list.useQuery
>[0];

export default function UsersHub() {
  const { t } = useTranslation(["dashboard", "common"]);
  const breadcrumbs = [{ label: t("dashboard:sidebar.users"), href: "#" }];

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [parsedData, setParsedData] = useState<Array<UserItemType>>([]);
  const [parsedPagination, setParsedPagination] = useState({
    pageCount: 1,
  });

  const columns: ColumnDef<UserItemType>[] = useMemo(() => {
    return [
      {
        accessorKey: "username",
        header: t("common:name"),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Link 
              href={`/dashboard/admin/users/${user._id}`}
              className="hover:opacity-70 transition-opacity"
            >
              <UserAvatarLabel user={user as any} showEmail={true} avatarClassName="h-8 w-8" />
            </Link>
          );
        },
      },
      {
        accessorKey: "active",
        header: t("common:status"),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Badge variant={user.active ? "default" : "secondary"}>
              {user.active ? t("common:active") : t("common:inactive")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("dashboard:users.table.joined"),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-sm text-muted-foreground">
              {user.createdAt ? formattedLocaleDate(user.createdAt) : ""}
            </div>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: t("dashboard:users.table.last_active"),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-sm text-muted-foreground">
              {user.updatedAt !== user.createdAt && user.updatedAt
                ? formattedLocaleDate(user.updatedAt)
                : ""}
            </div>
          );
        },
      },
    ];
  }, [t]);

  const { table } = useDataTable({
    columns,
    data: parsedData,
    pageCount: parsedPagination.pageCount,
    enableGlobalFilter: false,
  });

  const tableState = table.getState();

  const queryParams = useMemo(() => {
    const parsed: QueryParams = {
      pagination: {
        skip: tableState.pagination.pageIndex * tableState.pagination.pageSize,
        take: tableState.pagination.pageSize,
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
    debouncedSearchQuery,
  ]);

  const loadUsersQuery = trpc.userModule.user.list.useQuery(queryParams);

  useEffect(() => {
    if (!loadUsersQuery.data) return;
    const parsed = loadUsersQuery.data.items || [];
    setParsedData(parsed);
    setParsedPagination({
      pageCount: Math.ceil(
        (loadUsersQuery.data.total || 0) / loadUsersQuery.data.meta.take,
      ),
    });
  }, [loadUsersQuery.data]);

  return (
    <DashboardContent breadcrumbs={breadcrumbs}>
      <HeaderTopbar
        header={{
          title: t("dashboard:sidebar.users"),
        }}
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
