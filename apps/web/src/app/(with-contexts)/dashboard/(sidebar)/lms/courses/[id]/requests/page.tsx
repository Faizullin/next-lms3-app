"use client";

import { useCourseDetail } from "@/components/course/detail/course-detail-context";
import DashboardContent from "@/components/dashboard/dashboard-content";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { ColumnDef } from "@tanstack/react-table";
import { ApprovalStatusEnum } from "@workspace/common-logic/lib/approval_status";
import { DataTableToolbar, DeleteConfirmNiceDialog, NiceModal, useDataTable } from "@workspace/components-library";
import { DataTable } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { format } from "date-fns";
import { Check, Trash2, X } from "lucide-react";
import { parseAsStringEnum, useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CohortSelectDialog } from "../_components/cohort-select-dialog";

type ItemType = GeneralRouterOutputs["lmsModule"]["enrollmentRequest"]["list"]["items"][number];
type QueryParams = Parameters<typeof trpc.lmsModule.enrollmentRequest.list.useQuery>[0];

export default function CourseEnrollmentRequests() {
  const { initialCourse, isLoading } = useCourseDetail();
  const courseId = initialCourse._id;
  const { t } = useTranslation(["course"]); 
  const [filters, setFilters] = useQueryStates({
    "filter[status]": parseAsStringEnum([ApprovalStatusEnum.PENDING, ApprovalStatusEnum.APPROVED, ApprovalStatusEnum.REJECTED]), 
  });
  
  const [parsedData, setParsedData] = useState<ItemType[]>([]);
  const [parsedPagination, setParsedPagination] = useState({ pageCount: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const utils = trpc.useUtils();
  
  const approveMutation = trpc.lmsModule.enrollmentRequest.approve.useMutation({
    onSuccess: () => {
      toast.success(t("course:requests.approve_success"));
      loadListQuery.refetch();
      utils.lmsModule.enrollmentRequest.stats.invalidate({ courseId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.lmsModule.enrollmentRequest.reject.useMutation({
    onSuccess: () => {
      toast.success(t("course:requests.reject_success"));
      loadListQuery.refetch();
      utils.lmsModule.enrollmentRequest.stats.invalidate({ courseId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.lmsModule.enrollmentRequest.delete.useMutation({
    onSuccess: () => {
      toast.success(t("course:requests.delete_success"));
      loadListQuery.refetch();
      utils.lmsModule.enrollmentRequest.stats.invalidate({ courseId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = useCallback(async (request: ItemType) => {
    const result = await NiceModal.show(CohortSelectDialog, {
      courseId: courseId,
    });

    if (result.reason === "submit" && result.cohort) {
      approveMutation.mutate({ 
        id: request._id,
        cohortId: result.cohort._id 
      });
    }
  }, [approveMutation, courseId]);

  const handleReject = useCallback((request: ItemType) => {
    rejectMutation.mutate({ id: request._id });
  }, [rejectMutation]);

  const handleDelete = useCallback((request: ItemType) => {
    NiceModal.show(DeleteConfirmNiceDialog, {
      title: t("course:requests.delete_dialog_title"), 
      message: t("course:requests.delete_dialog_message", { email: request.user?.email || request.email }),
    })
      .then((result) => {
        if (result.reason === "confirm") {
          deleteMutation.mutate({ id: request._id });
        }
      })
      .catch((error) => {
        console.error("Error during deletion:", error);
      });
  }, [deleteMutation, t]);

  
  const statusOptionsDict = {
    [ApprovalStatusEnum.PENDING]: t("course:requests.status.pending"),
    [ApprovalStatusEnum.APPROVED]: t("course:requests.status.approved"),
    [ApprovalStatusEnum.REJECTED]: t("course:requests.status.rejected"),
  };

  const getStatusBadge = useCallback((status: ApprovalStatusEnum) => {
    const variants: Record<ApprovalStatusEnum, "default" | "secondary" | "destructive"> = {
      [ApprovalStatusEnum.PENDING]: "default",
      [ApprovalStatusEnum.APPROVED]: "secondary",
      [ApprovalStatusEnum.REJECTED]: "destructive",
    };
    return <Badge variant={variants[status]}>{statusOptionsDict[status]}</Badge>;
  }, [t]);

  const columns: ColumnDef<ItemType>[] = useMemo(() => {
    return [
      {
        accessorKey: "user",
        header: t("course:requests.table.user"),
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div>
              <div className="font-medium">{user?.fullName || "-"}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("common:status"),
        cell: ({ row }) => getStatusBadge(row.getValue("status")),
      },
      {
        accessorKey: "createdAt",
        header: t("course:requests.table.request_date"),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as Date;
          return date ? format(new Date(date), "MMM dd, yyyy HH:mm") : "-";
        },
      },
      {
        id: "actions",
        header: t("common:actions"),
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="flex items-center gap-2">
              {request.status === ApprovalStatusEnum.PENDING ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprove(request)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t("course:requests.actions.approve")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReject(request)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("course:requests.actions.reject")}
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground mr-2">-</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(request)}
                disabled={deleteMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [getStatusBadge, handleApprove, handleReject, handleDelete, approveMutation.isPending, rejectMutation.isPending, deleteMutation.isPending, t]);

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
        courseId: courseId,
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
    if (filters["filter[status]"]) {
      parsed.filter!.status = filters["filter[status]"];
    }
    return parsed;
  }, [tableState.sorting, tableState.pagination, debouncedSearchQuery, filters["filter[status]"], courseId]);

  const loadListQuery = trpc.lmsModule.enrollmentRequest.list.useQuery(queryParams, {
    enabled: !!courseId,
  });

  useEffect(() => {
    if (!loadListQuery.data) return;
    setParsedData(loadListQuery.data.items || []);
    setParsedPagination({
      pageCount: Math.ceil((loadListQuery.data.total || 0) / loadListQuery.data.meta.take),
    });
  }, [loadListQuery.data]);

  const statsQuery = trpc.lmsModule.enrollmentRequest.stats.useQuery({
    courseId: courseId,
  }, {
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <DashboardContent
        breadcrumbs={[
          { label: t("common:courses"), href: "/dashboard/lms/courses" },
          { label: "...", href: "#" },
          { label: t("course:requests.breadcrumb_requests"), href: "#" },
        ]}
      >
        <div className="space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardContent>
    );
  }

  if (!initialCourse) {
    return (
      <DashboardContent
        breadcrumbs={[
          { label: t("common:courses"), href: "/dashboard/lms/courses" },
          { label: "...", href: "#" },
          { label: t("course:requests.breadcrumb_requests"), href: "#" },
        ]}
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("course:requests.not_found")}</p>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent
      breadcrumbs={[
        { label: t("common:courses"), href: "/dashboard/lms/courses" },
        { label: initialCourse.title || "", href: `/dashboard/lms/courses/${courseId}` },
        { label: t("course:requests.breadcrumb_requests"), href: "#" },
      ]}
    >
      <HeaderTopbar
        backLink={true}
        header={{
          title: t("course:requests.title" ),
          subtitle: t("course:requests.subtitle", { courseName: initialCourse.title || "" }),
        }}
      />

      {statsQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statsQuery.data.pending}</div>
              <p className="text-sm text-muted-foreground">{t("course:requests.stats.pending")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statsQuery.data.approved}</div>
              <p className="text-sm text-muted-foreground">{t("course:requests.stats.approved")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statsQuery.data.rejected}</div>
              <p className="text-sm text-muted-foreground">{t("course:requests.stats.rejected")}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder={t("course:requests.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Select 
              value={filters["filter[status]"] || "all"}
               onValueChange={(value) => value !== "all" ? setFilters({ "filter[status]": value as ApprovalStatusEnum }) : setFilters({ "filter[status]": undefined })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("course:requests.filter_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("course:requests.all_statuses")}</SelectItem>
                  <SelectItem value={ApprovalStatusEnum.PENDING}>{t("course:requests.status.pending")}</SelectItem>
                  <SelectItem value={ApprovalStatusEnum.APPROVED}>{t("course:requests.status.approved")}</SelectItem>
                  <SelectItem value={ApprovalStatusEnum.REJECTED}>{t("course:requests.status.rejected")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DataTable table={table}>
              <DataTableToolbar table={table} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}

