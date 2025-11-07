"use client";

import DashboardContent from "@/components/dashboard/dashboard-content";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { CohortCombobox, CohortLabel } from "@/components/form/cohort-combobox";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { ColumnDef } from "@tanstack/react-table";
import { UIConstants } from "@workspace/common-logic/lib/ui/constants";
import { LiveClassStatusEnum, LiveClassTypeEnum } from "@workspace/common-logic/models/lms/live-class.types";
import { DataTable, DataTableToolbar, DeleteConfirmNiceDialog, NiceModal, useDataTable, useDialogControl, useToast } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { format } from "date-fns";
import { Archive, Edit, ExternalLink, Eye, MoreHorizontal, Play } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StartLiveClassDialog } from "./_components/start-live-class-dialog";

type ItemType = GeneralRouterOutputs["lmsModule"]["liveClass"]["list"]["items"][number];
type QueryParams = Parameters<typeof trpc.lmsModule.liveClass.list.useQuery>[0];

type CohortItem = {
    _id: string;
    title: string;
};

export default function Page() {
    const { t } = useTranslation(["dashboard", "common"]);
    const { toast } = useToast();
    const [parsedData, setParsedData] = useState<ItemType[]>([]);
    const [parsedPagination, setParsedPagination] = useState({ pageCount: 0 });
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<LiveClassStatusEnum | "all">("all");
    const [typeFilter, setTypeFilter] = useState<LiveClassTypeEnum | "all">("all");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const startLiveClassDialog = useDialogControl<{ cohortId?: string }>();
    const [selectedCohort, setSelectedCohort] = useState<CohortItem | undefined>(undefined);

    const [filters, setFilters] = useQueryStates({
        "filters[cohortId]": parseAsString,
    }, {
        history: "replace",
        shallow: true,
    });

    const cohortId = filters["filters[cohortId]"] || "";

    const loadCohortQuery = trpc.lmsModule.cohortModule.cohort.getById.useQuery(
        { id: cohortId },
        { enabled: !!cohortId }
    );

    useEffect(() => {
        if (loadCohortQuery.data) {
            setSelectedCohort({
                _id: loadCohortQuery.data._id,
                title: loadCohortQuery.data.title,
            });
        } else if (!cohortId) {
            setSelectedCohort(undefined);
        }
    }, [loadCohortQuery.data, cohortId]);

    const breadcrumbs = useMemo(() => [
        { label: t("dashboard:lms.live_classes.module_title"), href: "/dashboard/lms/live-classes" }
    ], [t]);

    const deleteLiveClassMutation = trpc.lmsModule.liveClass.delete.useMutation({
        onSuccess: () => {
            toast({ 
                title: t("common:success"), 
                description: t("common:toast.item_deleted_successfully", { item: t("dashboard:lms.live_classes.module_title") })
            });
            loadLiveClassesQuery.refetch();
        },
        onError: (error) => {
            toast({ 
                title: t("common:error"), 
                description: error.message, 
                variant: "destructive" 
            });
        },
    });

    const handleDeleteLiveClass = useCallback((liveClass: ItemType) => {
        NiceModal.show(DeleteConfirmNiceDialog, {
            title: t("dashboard:lms.live_classes.module_title"),
            message: t("dashboard:lms.live_classes.delete_confirm", { title: liveClass.title }),
            data: liveClass,
        })
            .then((result) => {
                if (result.reason === "confirm") {
                    deleteLiveClassMutation.mutate({ id: liveClass._id });
                }
            })
            .catch((error) => {
                console.error("Error during deletion:", error);
            });
    }, [deleteLiveClassMutation, t]);

    const getStatusBadge = useCallback((status: LiveClassStatusEnum) => {
        const variants: Record<LiveClassStatusEnum, "default" | "secondary" | "destructive" | "outline"> = {
            [LiveClassStatusEnum.SCHEDULED]: "secondary",
            [LiveClassStatusEnum.LIVE]: "default",
            [LiveClassStatusEnum.ENDED]: "outline",
            [LiveClassStatusEnum.CANCELLED]: "destructive",
        };
        const labels: Record<LiveClassStatusEnum, string> = {
            [LiveClassStatusEnum.SCHEDULED]: t("dashboard:lms.live_classes.status.scheduled"),
            [LiveClassStatusEnum.LIVE]: t("dashboard:lms.live_classes.status.live"),
            [LiveClassStatusEnum.ENDED]: t("dashboard:lms.live_classes.status.ended"),
            [LiveClassStatusEnum.CANCELLED]: t("dashboard:lms.live_classes.status.cancelled"),
        };
        return <Badge variant={variants[status]}>{labels[status]}</Badge>;
    }, [t]);

    const getTypeBadge = useCallback((type: LiveClassTypeEnum) => {
        const labels: Record<LiveClassTypeEnum, string> = {
            [LiveClassTypeEnum.LECTURE]: t("dashboard:lms.live_classes.types.lecture"),
            [LiveClassTypeEnum.WORKSHOP]: t("dashboard:lms.live_classes.types.workshop"),
            [LiveClassTypeEnum.Q_AND_A]: t("dashboard:lms.live_classes.types.q_and_a"),
            [LiveClassTypeEnum.GROUP_DISCUSSION]: t("dashboard:lms.live_classes.types.group_discussion"),
            [LiveClassTypeEnum.PRESENTATION]: t("dashboard:lms.live_classes.types.presentation"),
        };
        return <Badge variant="outline">{labels[type]}</Badge>;
    }, [t]);

    const getPlatform = useCallback((url?: string) => {
        if (!url) return t("dashboard:lms.live_classes.platforms.other");
        if (url.includes("zoom.us")) return t("dashboard:lms.live_classes.platforms.zoom");
        if (url.includes("meet.google.com")) return t("dashboard:lms.live_classes.platforms.google_meet");
        if (url.includes("teams.microsoft.com")) return t("dashboard:lms.live_classes.platforms.ms_teams");
        return t("dashboard:lms.live_classes.platforms.other");
    }, [t]);

    const getDuration = useCallback((start: Date, end: Date) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }, []);

    const columns: ColumnDef<ItemType>[] = useMemo(() => {
        return [
            {
                accessorKey: "title",
                header: t("common:title"),
                cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
            },
            {
                accessorKey: "type",
                header: t("common:type"),
                cell: ({ row }) => getTypeBadge(row.getValue("type")),
            },
            {
                accessorKey: "cohortId",
                header: t("dashboard:cohort"),
                cell: ({ row }) => {
                    const cohort = row.original.cohort;
                    if (!cohort) return <div className="text-sm text-muted-foreground">-</div>;
                    return (
                        <Link 
                            href={`/dashboard/lms/cohorts/${cohort._id}`}
                            className="hover:opacity-70 transition-opacity"
                        >
                            <CohortLabel cohort={cohort} />
                        </Link>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("common:status"),
                cell: ({ row }) => getStatusBadge(row.getValue("status")),
            },
            {
                accessorKey: "instructor",
                header: t("common:instructor"),
                cell: ({ row }) => {
                    const instructor = row.original.instructor;
                    return <div>{instructor?.fullName || "-"}</div>;
                },
            },
            {
                accessorKey: "scheduledStartTime",
                header: t("common:start_time"),
                cell: ({ row }) => {
                    const date = row.getValue("scheduledStartTime") as Date;
                    return date ? format(new Date(date), "MMM dd, HH:mm") : "-";
                },
            },
            {
                id: "duration",
                header: t("common:duration"),
                cell: ({ row }) => {
                    const start = row.original.scheduledStartTime;
                    const end = row.original.scheduledEndTime;
                    return start && end ? getDuration(start, end) : "-";
                },
            },
            {
                id: "platform",
                header: t("common:platform"),
                cell: ({ row }) => {
                    const platform = getPlatform(row.original.meetingUrl);
                    return <Badge variant="secondary" className="text-xs">{platform}</Badge>;
                },
            },
            {
                id: "actions",
                header: t("common:actions"),
                cell: ({ row }) => {
                    const liveClass = row.original;
                    const isScheduled = liveClass.status === LiveClassStatusEnum.SCHEDULED;
                    const hasRecording = liveClass.status === LiveClassStatusEnum.ENDED && liveClass.recordingUrl;

                    return (
                        <div className="flex items-center gap-2">
                            {isScheduled && liveClass.meetingUrl && (
                                <Button size="sm" variant="default" asChild>
                                    <a href={liveClass.meetingUrl} target="_blank" rel="noopener noreferrer">
                                        <Play className="h-3 w-3 mr-1" />
                                        {t("common:view")}
                                    </a>
                                </Button>
                            )}
                            {hasRecording && (
                                <Button size="sm" variant="outline" asChild>
                                    <a href={liveClass.recordingUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        {t("common:recording")}
                                    </a>
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">{t("common:actions")}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/lms/live-classes/${liveClass._id}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            {t("common:view")}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/lms/live-classes/${liveClass._id}`}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            {t("common:edit")}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteLiveClass(liveClass)} className="text-red-600">
                                        <Archive className="h-4 w-4 mr-2" />
                                        {t("common:delete")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ];
    }, [t, getStatusBadge, getTypeBadge, getPlatform, getDuration, handleDeleteLiveClass]);

    const { table } = useDataTable({
        columns,
        data: parsedData,
        pageCount: parsedPagination.pageCount,
        enableGlobalFilter: true,
        initialState: {
            sorting: [{ id: "scheduledStartTime", desc: false }],
        },
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
            parsed.search = { q: debouncedSearchQuery };
        }
        if (statusFilter !== "all" || typeFilter !== "all" || cohortId) {
            parsed.filter = {};
            if (statusFilter !== "all") parsed.filter.status = statusFilter;
            if (typeFilter !== "all") parsed.filter.type = typeFilter;
            if (cohortId) parsed.filter.cohortId = cohortId;
        }
        return parsed;
    }, [tableState.sorting, tableState.pagination, debouncedSearchQuery, statusFilter, typeFilter, cohortId]);

    const loadLiveClassesQuery = trpc.lmsModule.liveClass.list.useQuery(queryParams);

    useEffect(() => {
        if (!loadLiveClassesQuery.data) return;
        setParsedData(loadLiveClassesQuery.data.items || []);
        setParsedPagination({
            pageCount: Math.ceil((loadLiveClassesQuery.data.total || 0) / loadLiveClassesQuery.data.meta.take),
        });
    }, [loadLiveClassesQuery.data]);

    return (
        <DashboardContent
            breadcrumbs={breadcrumbs}
            permissions={[UIConstants.permissions.manageAnyCourse, UIConstants.permissions.manageCourse]}
        >
            <HeaderTopbar
                header={{
                    title: t("dashboard:lms.live_classes.module_title"),
                    subtitle: t("dashboard:lms.live_classes.module_description"),
                }}
                rightAction={
                    <Button onClick={() => startLiveClassDialog.show({ cohortId: cohortId || undefined })}>
                        <Play className="h-4 w-4 mr-2" />
                        {t("dashboard:lms.live_classes.start_live_class")}
                    </Button>
                }
            />
            
            <StartLiveClassDialog control={startLiveClassDialog} />
            
            <Card>
                <CardContent>
                    <div className="flex flex-col gap-4 pt-6">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{t("common:search")}</Label>
                                <Input
                                    placeholder={t("dashboard:lms.live_classes.search_placeholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-[250px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{t("dashboard:cohort")}</Label>
                                <CohortCombobox
                                    value={selectedCohort}
                                    onChange={(cohort) => {
                                        setSelectedCohort(cohort);
                                        setFilters({ "filters[cohortId]": cohort?._id || null });
                                    }}
                                    showCreateButton={false}
                                    showEditButton={false}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{t("common:status")}</Label>
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LiveClassStatusEnum | "all")}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("common:not_selected")}</SelectItem>
                                        <SelectItem value={LiveClassStatusEnum.SCHEDULED}>{t("dashboard:lms.live_classes.status.scheduled")}</SelectItem>
                                        <SelectItem value={LiveClassStatusEnum.LIVE}>{t("dashboard:lms.live_classes.status.live")}</SelectItem>
                                        <SelectItem value={LiveClassStatusEnum.ENDED}>{t("dashboard:lms.live_classes.status.ended")}</SelectItem>
                                        <SelectItem value={LiveClassStatusEnum.CANCELLED}>{t("dashboard:lms.live_classes.status.cancelled")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{t("common:type")}</Label>
                                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as LiveClassTypeEnum | "all")}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("common:not_selected")}</SelectItem> 
                                        <SelectItem value={LiveClassTypeEnum.LECTURE}>{t("dashboard:lms.live_classes.types.lecture")}</SelectItem>
                                        <SelectItem value={LiveClassTypeEnum.WORKSHOP}>{t("dashboard:lms.live_classes.types.workshop")}</SelectItem>
                                        <SelectItem value={LiveClassTypeEnum.Q_AND_A}>{t("dashboard:lms.live_classes.types.q_and_a")}</SelectItem>
                                        <SelectItem value={LiveClassTypeEnum.GROUP_DISCUSSION}>{t("dashboard:lms.live_classes.types.group_discussion")}</SelectItem>
                                        <SelectItem value={LiveClassTypeEnum.PRESENTATION}>{t("dashboard:lms.live_classes.types.presentation")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
