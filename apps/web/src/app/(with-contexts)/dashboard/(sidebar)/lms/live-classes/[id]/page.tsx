"use client";

import { useProfile } from "@/components/contexts/profile-context";
import DashboardContent from "@/components/dashboard/dashboard-content";
import { DangerZone } from "@/components/dashboard/danger-zone";
import HeaderTopbar from "@/components/dashboard/layout/header-topbar";
import { CohortCombobox } from "@/components/form/cohort-combobox";
import { GeneralRouterOutputs } from "@/server/api/types";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { UIConstants } from "@workspace/common-logic/lib/ui/constants";
import { LiveClassStatusEnum, LiveClassTypeEnum } from "@workspace/common-logic/models/lms/live-class.types";
import { ScheduleTypeEnum } from "@workspace/common-logic/models/lms/schedule.types";
import { ComboBox2, DeleteConfirmNiceDialog, NiceModal, useToast } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { format } from "date-fns";
import { Save, Trash2, UserCheck, Play, Square } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const LiveClassSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    type: z.nativeEnum(LiveClassTypeEnum),
    status: z.nativeEnum(LiveClassStatusEnum),
    scheduledStartTime: z.string().min(1),
    scheduledEndTime: z.string().min(1),
    meetingUrl: z.string().url().optional().or(z.literal("")),
    maxParticipants: z.number().min(1).optional(),
    allowRecording: z.boolean(),
    allowChat: z.boolean(),
    allowScreenShare: z.boolean(),
    allowParticipantVideo: z.boolean(),
});
type LiveClassFormDataType = z.infer<typeof LiveClassSchema>;

type LiveClassType = GeneralRouterOutputs["lmsModule"]["liveClass"]["getById"];

export default function Page() {
    const { t } = useTranslation(["dashboard", "common"]);
    const { toast } = useToast();
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const trpcUtils = trpc.useUtils();
    const { profile } = useProfile();

    const liveClassQuery = trpc.lmsModule.liveClass.getById.useQuery({ id: params.id });
    const liveClass = liveClassQuery.data;

    const isAdmin = useMemo(() =>
        profile?.roles?.includes(UIConstants.roles.admin) || false,
        [profile?.roles]
    );

    const form = useForm<LiveClassFormDataType>({
        resolver: zodResolver(LiveClassSchema),
        values: liveClass ? {
            title: liveClass.title,
            description: liveClass.description || "",
            type: liveClass.type,
            status: liveClass.status,
            scheduledStartTime: liveClass.scheduledStartTime ? new Date(liveClass.scheduledStartTime).toISOString().slice(0, 16) : "",
            scheduledEndTime: liveClass.scheduledEndTime ? new Date(liveClass.scheduledEndTime).toISOString().slice(0, 16) : "",
            meetingUrl: liveClass.meetingUrl || "",
            maxParticipants: liveClass.maxParticipants,
            allowRecording: liveClass.allowRecording,
            allowChat: liveClass.allowChat,
            allowScreenShare: liveClass.allowScreenShare,
            allowParticipantVideo: liveClass.allowParticipantVideo,
        } : undefined,
    });

    const updateMutation = trpc.lmsModule.liveClass.update.useMutation({
        onSuccess: () => {
            toast({ title: t("common:success") });
            trpcUtils.lmsModule.liveClass.list.invalidate();
            liveClassQuery.refetch();
        },
        onError: (err) => {
            toast({ title: t("common:error"), description: err.message, variant: "destructive" });
        },
    });

    const deleteLiveClassMutation = trpc.lmsModule.liveClass.delete.useMutation({
        onSuccess: () => {
            toast({ title: t("common:success") });
            trpcUtils.lmsModule.liveClass.list.invalidate();
            router.push("/dashboard/lms/live-classes");
        },
        onError: (err) => {
            toast({ title: t("common:error"), description: err.message, variant: "destructive" });
        },
    });

    const startSessionMutation = trpc.lmsModule.liveClass.startSession.useMutation({
        onSuccess: () => {
            toast({ title: t("common:success"), description: t("dashboard:lms.live_classes.session_started") });
            liveClassQuery.refetch();
            trpcUtils.lmsModule.liveClass.list.invalidate();
        },
        onError: (err) => {
            toast({ title: t("common:error"), description: err.message, variant: "destructive" });
        },
    });

    const stopSessionMutation = trpc.lmsModule.liveClass.stopSession.useMutation({
        onSuccess: () => {
            toast({ title: t("common:success"), description: t("dashboard:lms.live_classes.session_stopped") });
            liveClassQuery.refetch();
            trpcUtils.lmsModule.liveClass.list.invalidate();
        },
        onError: (err) => {
            toast({ title: t("common:error"), description: err.message, variant: "destructive" });
        },
    });

    const handleDelete = useCallback(() => {
        NiceModal.show(DeleteConfirmNiceDialog, {
            title: t("common:delete"),
            message: t("dashboard:lms.live_classes.delete_confirm", { title: liveClass?.title }),
        })
            .then((result) => {
                if (result.reason === "confirm") {
                    return deleteLiveClassMutation.mutateAsync({ id: params.id });
                }
            })
            .catch((error) => {
                console.error("Error during deletion:", error);
            });
    }, [deleteLiveClassMutation, params.id, liveClass?.title, t]);

    const handleSubmit = useCallback(async (data: LiveClassFormDataType) => {
        await updateMutation.mutateAsync({ 
            id: params.id, 
            data: {
                title: data.title,
                description: data.description,
                type: data.type,
                status: data.status,
                scheduledStartTime: new Date(data.scheduledStartTime).toISOString(),
                scheduledEndTime: new Date(data.scheduledEndTime).toISOString(),
                meetingUrl: data.meetingUrl || "",
                maxParticipants: data.maxParticipants,
                allowRecording: data.allowRecording,
                allowChat: data.allowChat,
                allowScreenShare: data.allowScreenShare,
                allowParticipantVideo: data.allowParticipantVideo,
            }
        });
    }, [updateMutation, params.id]);

    // const searchCohorts = useCallback(async (search: string, offset: number, size: number): Promise<CohortItem[]> => {
    //     const result = await trpcUtils.lmsModule.cohortModule.cohort.list.fetch({
    //         pagination: { skip: offset, take: size },
    //         search: search ? { q: search } : undefined,
    //     }, {
    //         staleTime: 0,
    //     });
    //     return result.items.map(cohort => ({ _id: cohort._id, title: cohort.title }));
    // }, [trpcUtils]);

    const breadcrumbs = useMemo(() => [
        { label: t("dashboard:lms.live_classes.module_title"), href: "/dashboard/lms/live-classes" },
        { label: liveClass?.title || t("common:edit"), href: "#" },
    ], [t, liveClass?.title]);

    const getStatusBadge = useCallback((status: LiveClassStatusEnum) => {
        const variants: Record<LiveClassStatusEnum, "default" | "secondary" | "destructive" | "outline"> = {
            [LiveClassStatusEnum.SCHEDULED]: "secondary",
            [LiveClassStatusEnum.LIVE]: "default",
            [LiveClassStatusEnum.ENDED]: "outline",
            [LiveClassStatusEnum.CANCELLED]: "destructive",
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
    }, []);

    const statusOptionsDict = {
        [LiveClassStatusEnum.SCHEDULED]: t("dashboard:lms.live_classes.status.scheduled"),
        [LiveClassStatusEnum.LIVE]: t("dashboard:lms.live_classes.status.live"),
        [LiveClassStatusEnum.ENDED]: t("dashboard:lms.live_classes.status.ended"),
        [LiveClassStatusEnum.CANCELLED]: t("dashboard:lms.live_classes.status.cancelled"),
    }

    if (liveClassQuery.isLoading) {
        return (
            <DashboardContent breadcrumbs={breadcrumbs} permissions={[UIConstants.permissions.manageAnyCourse]}>
                <div className="flex items-center justify-center h-64">{t("common:loading")}</div>
            </DashboardContent>
        );
    }

    if (!liveClass) {
        return (
            <DashboardContent breadcrumbs={breadcrumbs} permissions={[UIConstants.permissions.manageAnyCourse]}>
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-lg">{t("common:not_found")}</p>
                    <Link href="/dashboard/lms/live-classes">
                        <Button variant="link">{t("common:back")}</Button>
                    </Link>
                </div>
            </DashboardContent>
        );
    }

    return (
        <DashboardContent breadcrumbs={breadcrumbs} permissions={[UIConstants.permissions.manageAnyCourse]}>
            <HeaderTopbar
                header={{
                    title: liveClass.title,
                    subtitle: t("dashboard:lms.live_classes.module_description"),
                }}
                backLink="/dashboard/lms/live-classes"
                rightAction={
                    <div className="flex items-center gap-2">
                        {liveClass.status === LiveClassStatusEnum.SCHEDULED && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => startSessionMutation.mutate({ id: params.id })}
                                disabled={startSessionMutation.isPending}
                            >
                                <Play className="h-4 w-4 mr-2" />
                                {t("common:start")}
                            </Button>
                        )}
                        {liveClass.status === LiveClassStatusEnum.LIVE && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => stopSessionMutation.mutate({ id: params.id })}
                                disabled={stopSessionMutation.isPending}
                            >
                                <Square className="h-4 w-4 mr-2" />
                                {t("common:stop")}
                            </Button>
                        )}
                        <Link href={`/dashboard/lms/live-classes/${params.id}/attendance`}>
                            <Button variant="outline" size="sm">
                                <UserCheck className="h-4 w-4 mr-2" />
                                {t("common:attendance")}
                            </Button>
                        </Link>
                    </div>
                }
            />
            <div className="grid gap-4 md:grid-cols-2">
                {liveClass?.cohort && (
                    <CohortCombobox
                        value={liveClass.cohort}
                        onChange={() => {}}
                        readonly={true}
                        showCreateButton={false}
                        showEditButton={false}
                    />
                )}
                {liveClass?.event && (
                    <ComboBox2<typeof liveClass.event>
                        title={t("common:schedule_event")}
                        valueKey="_id"
                        value={liveClass.event}
                        searchFn={async () => []}
                        renderLabel={(event) => `${event.title} - ${format(new Date(event.startDate), "MMM dd, HH:mm")}`}
                        onChange={() => {}}
                        multiple={false}
                        readonly={true}
                        showCreateButton={false}
                        showEditButton={false}
                    />
                )}
            </div>
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t("common:status")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {getStatusBadge(liveClass.status)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t("common:type")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium capitalize">{liveClass.type.replace(/_/g, ' ')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t("common:start_time")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium">
                            {liveClass.scheduledStartTime ? format(new Date(liveClass.scheduledStartTime), "MMM dd, HH:mm") : "-"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t("common:students")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium">-</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("common:settings")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FieldGroup>
                            <Controller
                                control={form.control}
                                name="title"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="title">{t("common:title")}</FieldLabel>
                                        <Input id="title" {...field} aria-invalid={fieldState.invalid} />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="description"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="description">{t("common:description")}</FieldLabel>
                                        <Textarea id="description" {...field} rows={3} aria-invalid={fieldState.invalid} />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Controller
                                    control={form.control}
                                    name="type"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="type">{t("common:type")}</FieldLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger id="type" aria-invalid={fieldState.invalid}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={LiveClassTypeEnum.LECTURE}>{t("dashboard:lms.live_classes.types.lecture")}</SelectItem>
                                                    <SelectItem value={LiveClassTypeEnum.WORKSHOP}>{t("dashboard:lms.live_classes.types.workshop")}</SelectItem>
                                                    <SelectItem value={LiveClassTypeEnum.Q_AND_A}>{t("dashboard:lms.live_classes.types.q_and_a")}</SelectItem>
                                                    <SelectItem value={LiveClassTypeEnum.GROUP_DISCUSSION}>{t("dashboard:lms.live_classes.types.group_discussion")}</SelectItem>
                                                    <SelectItem value={LiveClassTypeEnum.PRESENTATION}>{t("dashboard:lms.live_classes.types.presentation")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    control={form.control}
                                    name="status"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="status">{t("common:status")}</FieldLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger id="status" aria-invalid={fieldState.invalid}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(LiveClassStatusEnum).map((status) => (
                                                        <SelectItem key={status} value={status}>{statusOptionsDict[status]}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Controller
                                    control={form.control}
                                    name="scheduledStartTime"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="scheduledStartTime">{t("common:start_time")}</FieldLabel>
                                            <Input id="scheduledStartTime" type="datetime-local" {...field} aria-invalid={fieldState.invalid} />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    control={form.control}
                                    name="scheduledEndTime"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="scheduledEndTime">{t("common:end_time")}</FieldLabel>
                                            <Input id="scheduledEndTime" type="datetime-local" {...field} aria-invalid={fieldState.invalid} />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]} />
                                            )}
                                        </Field>
                                    )}
                                />
                            </div>
                            <Controller
                                control={form.control}
                                name="meetingUrl"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="meetingUrl">{t("dashboard:lms.live_classes.meeting_url")}</FieldLabel>
                                        <Input id="meetingUrl" {...field} aria-invalid={fieldState.invalid} />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="maxParticipants"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="maxParticipants">{t("dashboard:lms.live_classes.max_participants")}</FieldLabel>
                                        <Input
                                            id="maxParticipants"
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            value={field.value || ""}
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <div className="space-y-3">
                                <FieldLabel>{t("dashboard:lms.live_classes.permissions")}</FieldLabel>
                                <div className="grid grid-cols-2 gap-4">
                                    <Controller
                                        control={form.control}
                                        name="allowRecording"
                                        render={({ field }) => (
                                            <div className="flex items-center gap-2 space-y-0">
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="allowRecording" />
                                                <FieldLabel htmlFor="allowRecording" className="font-normal cursor-pointer">{t("common:recording")}</FieldLabel>
                                            </div>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name="allowChat"
                                        render={({ field }) => (
                                            <div className="flex items-center gap-2 space-y-0">
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="allowChat" />
                                                <FieldLabel htmlFor="allowChat" className="font-normal cursor-pointer">{t("common:chat")}</FieldLabel>
                                            </div>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name="allowScreenShare"
                                        render={({ field }) => (
                                            <div className="flex items-center gap-2 space-y-0">
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="allowScreenShare" />
                                                <FieldLabel htmlFor="allowScreenShare" className="font-normal cursor-pointer">{t("dashboard:lms.live_classes.screen_share")}</FieldLabel>
                                            </div>
                                        )}
                                    />
                                    <Controller
                                        control={form.control}
                                        name="allowParticipantVideo"
                                        render={({ field }) => (
                                            <div className="flex items-center gap-2 space-y-0">
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="allowParticipantVideo" />
                                                <FieldLabel htmlFor="allowParticipantVideo" className="font-normal cursor-pointer">{t("dashboard:lms.live_classes.participant_video")}</FieldLabel>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>
                            <div>
                                <Button type="submit" size="sm" disabled={updateMutation.isPending || form.formState.isSubmitting}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {updateMutation.isPending ? t("common:saving") : t("common:save")}
                                </Button>
                            </div>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <DangerZone>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">{t("common:delete_permanently")}</p>
                        <p className="text-sm text-muted-foreground">{t("common:delete_warning")}</p>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteLiveClassMutation.isPending}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t("common:delete")}
                    </Button>
                </div>
            </DangerZone>
        </DashboardContent>
    );
}

