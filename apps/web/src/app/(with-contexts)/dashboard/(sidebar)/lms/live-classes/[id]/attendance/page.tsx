"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { UserAvatarLabel } from "@/components/form/user-combobox/user-avatar-label";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { ColumnDef } from "@tanstack/react-table";
import { UIConstants } from "@workspace/common-logic/lib/ui/constants";
import { ParticipantStatusEnum } from "@workspace/common-logic/models/lms/live-class-participant.types";
import { DataTable, useDataTable, useToast } from "@workspace/components-library";
import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type AttendanceItemType = GeneralRouterOutputs["lmsModule"]["liveClass"]["listAttendance"]["items"][number];

type AttendanceWithChanges = AttendanceItemType & {
    newStatus?: ParticipantStatusEnum;
    hasChanges?: boolean;
};

export default function Page() {
    const { t } = useTranslation(["dashboard", "common"]);
    const { toast } = useToast();
    const params = useParams<{ id: string }>();
    const trpcUtils = trpc.useUtils();

    const [attendanceList, setAttendanceList] = useState<AttendanceWithChanges[]>([]);
    const [hasAnyChanges, setHasAnyChanges] = useState(false);

    const liveClassQuery = trpc.lmsModule.liveClass.getById.useQuery({ id: params.id });
    const attendanceQuery = trpc.lmsModule.liveClass.listAttendance.useQuery({ id: params.id });

    const markAttendanceMutation = trpc.lmsModule.liveClass.markAttendance.useMutation({
        onError: (err) => {
            toast({ title: t("common:error"), description: err.message, variant: "destructive" });
        },
    });

    useEffect(() => {
        if (attendanceQuery.data) {
            setAttendanceList(attendanceQuery.data.items.map(item => ({ ...item })));
        }
    }, [attendanceQuery.data]);

    const handleStatusChange = useCallback((studentId: string, newStatus: ParticipantStatusEnum) => {
        setAttendanceList(prev => {
            const updated = prev.map(item => {
                if (item.student._id === studentId) {
                    const currentStatus = item.participant?.status || ParticipantStatusEnum.ABSENT;
                    const hasChanges = currentStatus !== newStatus;
                    return {
                        ...item,
                        newStatus,
                        hasChanges,
                    };
                }
                return item;
            });
            setHasAnyChanges(updated.some(item => item.hasChanges));
            return updated;
        });
    }, []);

    const handleSave = useCallback(async () => {
        const changedItems = attendanceList.filter(item => item.hasChanges && item.newStatus);
        
        try {
            await Promise.all(
                changedItems.map(item =>
                    markAttendanceMutation.mutateAsync({
                        id: params.id,
                        data: {
                            userId: item.student._id,
                            status: item.newStatus!,
                        },
                    })
                )
            );

            toast({ title: t("common:success") });
            setHasAnyChanges(false);
            attendanceQuery.refetch();
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    }, [attendanceList, markAttendanceMutation, params.id, toast, t, attendanceQuery]);

    const breadcrumbs = useMemo(() => [
        { label: t("dashboard:lms.live_classes.module_title"), href: "/dashboard/lms/live-classes" },
        { label: liveClassQuery.data?.title || "", href: `/dashboard/lms/live-classes/${params.id}` },
        { label: t("common:attendance"), href: "#" },
    ], [t, liveClassQuery.data?.title, params.id]);

    const columns: ColumnDef<AttendanceWithChanges>[] = useMemo(() => {
        return [
            {
                accessorKey: "student",
                header: t("common:students", { count: 1 }),
                cell: ({ row }) => {
                    const student = row.original.student;
                    if (!student) return <div>-</div>;
                    return (
                        <Link 
                            href={`/dashboard/admin/users/${student._id}`}
                            className="hover:opacity-70 transition-opacity"
                        >
                            <UserAvatarLabel 
                                user={student} 
                                showEmail={false} 
                                avatarClassName="h-8 w-8" 
                            />
                        </Link>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("common:status"),
                cell: ({ row }) => {
                    const item = row.original;
                    const currentStatus = item.hasChanges 
                        ? item.newStatus 
                        : (item.participant?.status || ParticipantStatusEnum.ABSENT);
                    return (
                        <Select
                            value={currentStatus}
                            onValueChange={(value) => handleStatusChange(item.student._id, value as ParticipantStatusEnum)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ParticipantStatusEnum.PRESENT}>{t("dashboard:lms.live_classes.attendance_status.present")}</SelectItem>
                                <SelectItem value={ParticipantStatusEnum.ABSENT}>{t("dashboard:lms.live_classes.attendance_status.absent")}</SelectItem>
                                <SelectItem value={ParticipantStatusEnum.LATE}>{t("dashboard:lms.live_classes.attendance_status.late")}</SelectItem>
                                <SelectItem value={ParticipantStatusEnum.EXCUSED}>{t("dashboard:lms.live_classes.attendance_status.excused")}</SelectItem>
                            </SelectContent>
                        </Select>
                    );
                },
            },
        ];
    }, [t, handleStatusChange]);

    const { table } = useDataTable({
        columns,
        data: attendanceList,
        pageCount: 1,
    });

    if (liveClassQuery.isLoading || attendanceQuery.isLoading) {
        return (
            <DashboardContent breadcrumbs={breadcrumbs} permissions={[UIConstants.permissions.manageAnyCourse]}>
                <div className="flex items-center justify-center h-64">{t("common:loading")}</div>
            </DashboardContent>
        );
    }

    if (!liveClassQuery.data) {
        return (
            <DashboardContent breadcrumbs={breadcrumbs} permissions={[UIConstants.permissions.manageAnyCourse]}>
                <div className="flex items-center justify-center h-64">{t("common:not_found")}</div>
            </DashboardContent>
        );
    }

    return (
        <DashboardContent breadcrumbs={breadcrumbs} permissions={[UIConstants.permissions.manageAnyCourse]}>
            <HeaderTopbar
                header={{
                    title: t("common:attendance"),
                    subtitle: liveClassQuery.data.title,
                }}
                backLink={`/dashboard/lms/live-classes/${params.id}`}
                rightAction={
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasAnyChanges || markAttendanceMutation.isPending}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {markAttendanceMutation.isPending ? t("common:saving") : t("common:save")}
                    </Button>
                }
            />
            <DataTable table={table} />
        </DashboardContent>
    );
}

