"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import { CreateButton } from "@/components/dashboard/layout/create-button";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { useCourseDetail } from "@/components/course/detail/course-detail-context";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { ColumnDef } from "@tanstack/react-table";
import { UIConstants } from "@workspace/common-logic/lib/ui/constants";
import { EnrollmentStatusEnum } from "@workspace/common-logic/models/lms/enrollment.types";
import { ComboBox2, DataTable, DataTableToolbar, DeleteConfirmNiceDialog, FormDialog, NiceModal, NiceModalHocProps, useDataTable, useToast } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { truncate } from "@workspace/utils";
import { format } from "date-fns";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserAvatarLabel } from "@/components/form/user-combobox/user-avatar-label";

type ItemType = GeneralRouterOutputs["lmsModule"]["enrollment"]["list"]["items"][number];
type QueryParams = Parameters<typeof trpc.lmsModule.enrollment.list.useQuery>[0];

interface ManageEnrollmentDialogProps extends NiceModalHocProps {
  enrollment: ItemType;
  courseId: string;
}

const ManageEnrollmentDialog = NiceModal.create<
  ManageEnrollmentDialogProps,
  { reason: "cancel" | "submit" }
>(({ enrollment, courseId }) => {
  const { visible, hide, resolve } = NiceModal.useModal();
  const { t } = useTranslation(["course", "common"]);
  const { toast } = useToast();
  const trpcUtils = trpc.useUtils();
  const enrollmentCohort = (enrollment as any).cohort;
  const [selectedCohort, setSelectedCohort] = useState<{ _id: string; title: string } | undefined>(
    enrollmentCohort ? { _id: enrollmentCohort._id, title: enrollmentCohort.title } : undefined
  );

  const updateCohortMutation = trpc.lmsModule.enrollment.updateCohort.useMutation({
    onSuccess: () => {
      toast({
        title: t("common:success"),
        description: t("course:students.cohort_updated"),
      });
      resolve({ reason: "submit" });
      hide();
    },
    onError: (err: any) => {
      toast({ title: t("common:error"), description: err.message, variant: "destructive" });
    },
  });

  const searchCohorts = useCallback(
    async (search: string, offset: number, size: number) => {
      const result = await trpcUtils.lmsModule.cohortModule.cohort.list.fetch({
        pagination: { skip: offset, take: size },
        search: search ? { q: search } : undefined,
        filter: { courseId },
      }, {
        staleTime: 0,
      });
      return result.items.map(cohort => ({
        _id: cohort._id,
        title: cohort.title,
      }));
    },
    [trpcUtils, courseId]
  );

  const handleSubmit = useCallback(async () => {
    await updateCohortMutation.mutateAsync({
      enrollmentId: enrollment._id,
      cohortId: selectedCohort?._id || null,
    });
  }, [updateCohortMutation, enrollment._id, selectedCohort]);

  const handleCancel = useCallback(() => {
    resolve({ reason: "cancel" });
    hide();
  }, [resolve, hide]);

  return (
    <FormDialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}
      title={t("course:students.manage_enrollment")}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitText={t("common:save")}
      cancelText={t("common:cancel")}
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">{t("common:students", { count: 1 })}</p>
          <UserAvatarLabel 
            user={enrollment.user as any} 
            showEmail={true} 
            avatarClassName="h-8 w-8" 
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">{t("course:detail.cohort_groups")}</p>
          <ComboBox2<{ _id: string; title: string }>
            title={t("course:students.select_cohort")}
            valueKey="_id"
            value={selectedCohort}
            searchFn={searchCohorts}
            renderLabel={(cohort) => cohort.title}
            onChange={(cohort) => setSelectedCohort(cohort)}
            multiple={false}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {t("course:students.cohort_help")}
          </p>
        </div>
      </div>
    </FormDialog>
  );
});

export default function Page() {
  const { t } = useTranslation(["course", "dashboard", "common"]);
  const { toast } = useToast();
  const { initialCourse } = useCourseDetail();
  const courseId = initialCourse._id;
  const [parsedData, setParsedData] = useState<ItemType[]>([]);
  const [parsedPagination, setParsedPagination] = useState({ pageCount: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatusEnum | "all">("all");
  const [cohortFilter, setCohortFilter] = useState<{ _id: string; title: string } | "no-group" | undefined>(undefined);
  
  const trpcUtils = trpc.useUtils();

  const searchCohorts = useCallback(
    async (search: string, offset: number, size: number) => {
      const result = await trpcUtils.lmsModule.cohortModule.cohort.list.fetch({
        pagination: { skip: offset, take: size },
        search: search ? { q: search } : undefined,
        filter: { courseId },
      }, {
        staleTime: 0,
      });
      return result.items.map(cohort => ({
        _id: cohort._id,
        title: cohort.title,
      }));
    },
    [trpcUtils, courseId]
  );

  const breadcrumbs = useMemo(() => [
    { label: t("common:courses"), href: "/dashboard/lms/courses" },
    {
      label: initialCourse ? truncate(initialCourse.title, 20) || "..." : "...",
      href: `/dashboard/lms/courses/${courseId}`,
    },
    { label: t("common:students"), href: "#" }
  ], [t, initialCourse, courseId]);

  const unenrollMutation = trpc.lmsModule.enrollment.unenroll.useMutation({
    onSuccess: (_, variables) => {
      const enrollment = parsedData.find(e => e._id === variables.id);
      toast({
        title: t("common:success"),
        description: t("common:toast.item_removed_successfully", { item: `"${enrollment?.user?.fullName || enrollment?.user?.email || ""}"`}),
      });
      loadListQuery.refetch();
    },
    onError: (err: any) => {
      toast({ title: t("common:error"), description: err.message, variant: "destructive" });
    },
  });

  const handleRemoveStudent = useCallback((enrollment: ItemType) => {
    const userName = enrollment.user?.fullName || enrollment.user?.email || "";
    NiceModal.show(DeleteConfirmNiceDialog, {
      title: t("common:delete"),
      message: t("course:students.remove_student_confirm", { name: userName }),
    })
      .then((result) => {
        if (result.reason === "confirm") {
          unenrollMutation.mutate({ id: enrollment._id });
        }
      })
      .catch((error) => {
        console.error("Error removing student:", error);
      });
  }, [unenrollMutation, t]);

  const handleManageEnrollment = useCallback(async (enrollment: ItemType) => {
    const result = await NiceModal.show(ManageEnrollmentDialog, {
      enrollment,
      courseId,
    });
    if (result.reason === "submit") {
      await trpcUtils.lmsModule.enrollment.list.invalidate();
    }
  }, [courseId, trpcUtils]);

  const handleInviteStudents = useCallback(() => {
    toast({
      title: t("course:students.coming_soon"),
      description: t("course:students.coming_soon_desc")
    });
  }, [toast, t]);

  const columns: ColumnDef<ItemType>[] = useMemo(() => {
    return [
      {
        accessorKey: "user",
        header: t("common:students", { count: 1 }),
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <div>-</div>;
          return (
            <Link 
              href={`/dashboard/admin/users/${user._id}`}
              className="hover:opacity-70 transition-opacity"
            >
              <UserAvatarLabel user={user} showEmail={false} />
            </Link>
          );
        },
      },
      {
        accessorKey: "user.email",
        header: t("common:email"),
        cell: ({ row }) => {
          const user = row.original.user;
          return <div>{user?.email || "-"}</div>;
        },
      },
      {
        accessorKey: "cohort",
        header: t("course:detail.cohort_groups", { count: 1 }),
        cell: ({ row }) => {
          const cohort = (row.original as any).cohort;
          if (!cohort) return <div className="text-muted-foreground text-sm">-</div>;
          return (
            <Link 
              href={`/dashboard/lms/cohorts/${cohort._id}`}
              className="text-sm hover:underline"
            >
              {cohort.title}
            </Link>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("common:status"),
        cell: ({ row }) => {
          const status = row.getValue("status") as EnrollmentStatusEnum;
          const statusLabel = status === EnrollmentStatusEnum.ACTIVE 
            ? t("common:active") 
            : t("common:inactive");
          return <Badge variant={status === EnrollmentStatusEnum.ACTIVE ? "default" : "secondary"}>{statusLabel}</Badge>;
        },
      },
      {
        accessorKey: "createdAt",
        header: t("common:enrolled"),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as Date;
          return date ? format(new Date(date), "MMM dd, yyyy") : "-";
        },
      },
      {
        id: "actions",
        header: t("common:actions"),
        cell: ({ row }) => {
          const enrollment = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleManageEnrollment(enrollment)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("course:students.manage_enrollment")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRemoveStudent(enrollment)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("common:delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [t, handleRemoveStudent, handleManageEnrollment]);

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
      filter: {
        courseId: courseId,
      },
      pagination: {
        skip: tableState.pagination.pageIndex * tableState.pagination.pageSize,
        take: tableState.pagination.pageSize,
      },
      populateCohort: true,
    };
    if (statusFilter !== "all") {
      parsed.filter!.status = statusFilter;
    }
    if (cohortFilter === "no-group") {
      parsed.filter!.cohortId = null;
    } else if (cohortFilter) {
      parsed.filter!.cohortId = cohortFilter._id;
    }
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
  }, [tableState.sorting, tableState.pagination, debouncedSearchQuery, courseId, statusFilter, cohortFilter]);

  const loadListQuery = trpc.lmsModule.enrollment.list.useQuery(queryParams, { enabled: !!courseId });

  useEffect(() => {
    if (!loadListQuery.data) return;
    setParsedData(loadListQuery.data.items || []);
    setParsedPagination({
      pageCount: Math.ceil((loadListQuery.data.total || 0) / loadListQuery.data.meta.take),
    });
  }, [loadListQuery.data]);

  return (
    <DashboardContent
      breadcrumbs={breadcrumbs}
      permissions={[UIConstants.permissions.manageCourse]}
    >
      <HeaderTopbar
        header={{
          title: initialCourse.title,
          subtitle: t("course:students.subtitle"),
        }}
        backLink={true}
        rightAction={
          <CreateButton onClick={handleInviteStudents} text={t("common:invite")} />
        }
      />

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder={t("common:search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EnrollmentStatusEnum | "all")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("common:status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common:not_selected")}</SelectItem>
                  <SelectItem value={EnrollmentStatusEnum.ACTIVE}>{t("common:active")}</SelectItem>
                  <SelectItem value={EnrollmentStatusEnum.INACTIVE}>{t("common:inactive")}</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={cohortFilter === "no-group" ? "no-group" : cohortFilter?._id || "all"} 
                onValueChange={(value) => {
                  if (value === "all") {
                    setCohortFilter(undefined);
                  } else if (value === "no-group") {
                    setCohortFilter("no-group");
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("course:detail.cohort_groups")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common:not_selected")}</SelectItem>
                  <SelectItem value="no-group">{t("course:students.no_group")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-[240px]">
                <ComboBox2<{ _id: string; title: string }>
                  title={t("course:detail.cohort_groups")}
                  valueKey="_id"
                  value={cohortFilter && cohortFilter !== "no-group" ? cohortFilter : undefined}
                  searchFn={searchCohorts}
                  renderLabel={(cohort) => cohort.title}
                  onChange={(cohort) => setCohortFilter(cohort)}
                  multiple={false}
                />
              </div>
            </div>
            <DataTable table={table} isLoading={loadListQuery.isLoading}>
              <DataTableToolbar table={table} />
            </DataTable>
          </div>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}

