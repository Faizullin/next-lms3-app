"use client";

import { BaseDialog, IUseDialogControl } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Calendar, Clock, Edit, ExternalLink, MapPin, Users, Video } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/components/contexts/profile-context";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import { LiveClassStatusEnum, LiveClassTypeEnum } from "@workspace/common-logic/models/lms/live-class.types";

export type LiveSessionDialogData = {
    eventId: string;
};

interface LiveSessionViewDialogProps {
    control: IUseDialogControl<LiveSessionDialogData>;
}

export function LiveSessionViewDialog({
    control,
}: LiveSessionViewDialogProps) {
    const { t } = useTranslation(["dashboard", "common"]);
    const { profile } = useProfile();

    const loadLiveSessionQuery = trpc.lmsModule.liveClass.getByEventId.useQuery(
        { eventId: control.data?.eventId || "" },
        { enabled: control.isVisible && !!control.data?.eventId }
    );

    const liveSession = loadLiveSessionQuery.data;

    const isInstructor = profile?.roles?.includes("instructor");

    const getStatusBadgeVariant = (status: LiveClassStatusEnum) => {
        const variants: Record<LiveClassStatusEnum, "default" | "secondary" | "destructive" | "outline"> = {
            [LiveClassStatusEnum.SCHEDULED]: "secondary",
            [LiveClassStatusEnum.LIVE]: "default",
            [LiveClassStatusEnum.ENDED]: "outline",
            [LiveClassStatusEnum.CANCELLED]: "destructive",
        };
        return variants[status];
    };

    const getTypeLabel = (type: LiveClassTypeEnum) => {
        const labels: Record<LiveClassTypeEnum, string> = {
            [LiveClassTypeEnum.LECTURE]: t("dashboard:lms.live_classes.types.lecture"),
            [LiveClassTypeEnum.WORKSHOP]: t("dashboard:lms.live_classes.types.workshop"),
            [LiveClassTypeEnum.Q_AND_A]: t("dashboard:lms.live_classes.types.q_and_a"),
            [LiveClassTypeEnum.GROUP_DISCUSSION]: t("dashboard:lms.live_classes.types.group_discussion"),
            [LiveClassTypeEnum.PRESENTATION]: t("dashboard:lms.live_classes.types.presentation"),
        };
        return labels[type];
    };

    const getStatusLabel = (status: LiveClassStatusEnum) => {
        const labels: Record<LiveClassStatusEnum, string> = {
            [LiveClassStatusEnum.SCHEDULED]: t("dashboard:lms.live_classes.status.scheduled"),
            [LiveClassStatusEnum.LIVE]: t("dashboard:lms.live_classes.status.live"),
            [LiveClassStatusEnum.ENDED]: t("dashboard:lms.live_classes.status.ended"),
            [LiveClassStatusEnum.CANCELLED]: t("dashboard:lms.live_classes.status.cancelled"),
        };
        return labels[status];
    };

    const getDuration = (start: Date, end: Date) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <BaseDialog
            open={control.isVisible}
            onOpenChange={(open) => {
                if (!open) control.hide();
            }}
            title={
                <div className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    {loadLiveSessionQuery.isLoading ? t("common:loading") : liveSession?.title || t("dashboard:lms.live_classes.module_title")}
                </div>
            }
            maxWidth="2xl"
        >
            {loadLiveSessionQuery.isLoading ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <Skeleton className="h-5 w-5" />
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-24 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            ) : !liveSession ? (
                <div className="text-center py-8 space-y-4">
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">{t("common:not_found")}</p>
                    <p className="text-xs text-muted-foreground mb-4">
                        {t("dashboard:instructor.create_live_session")}
                    </p>
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/lms/schedule" onClick={control.hide}>
                                <Calendar className="h-4 w-4 mr-2" />
                                {t("common:schedule")}
                            </Link>
                        </Button>
                        <Button variant="ghost" onClick={control.hide}>
                            {t("common:close")}
                        </Button>
                    </div>
                </div>
            ) : (
            <div className="space-y-6">
                {/* Header with Status and Type */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusBadgeVariant(liveSession.status)}>
                        {getStatusLabel(liveSession.status)}
                    </Badge>
                    <Badge variant="outline">{getTypeLabel(liveSession.type)}</Badge>
                </div>

                {/* Description */}
                {liveSession.description && (
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {liveSession.description}
                        </p>
                    </div>
                )}

                <Separator />

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">{t("common:start_date")}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(liveSession.scheduledStartTime), "PPP")}
                            </p>
                        </div>
                    </div>

                    {/* Start Time */}
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">{t("common:start_time")}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(liveSession.scheduledStartTime), "p")}
                            </p>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">{t("common:duration")}</p>
                            <p className="text-sm text-muted-foreground">
                                {getDuration(liveSession.scheduledStartTime, liveSession.scheduledEndTime)}
                            </p>
                        </div>
                    </div>

                    {/* Instructor */}
                    {liveSession.instructor?.fullName && (
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("common:instructor")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {liveSession.instructor.fullName}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    {liveSession.location?.name && (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("common:location")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {liveSession.location.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Course/Cohort */}
                    {liveSession.entity?.entityIdStr && (
                        <div className="flex items-start gap-3 md:col-span-2">
                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("dashboard:lms.live_classes.course_cohort")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {liveSession.entity.entityIdStr}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    {liveSession.status === LiveClassStatusEnum.SCHEDULED && liveSession.meetingUrl && (
                        <Button asChild>
                            <a href={liveSession.meetingUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {t("dashboard:lms.live_classes.actions.join_meeting")}
                            </a>
                        </Button>
                    )}

                    {liveSession.status === LiveClassStatusEnum.ENDED && liveSession.recordingUrl && (
                        <Button variant="outline" asChild>
                            <a href={liveSession.recordingUrl} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4 mr-2" />
                                {t("common:recording")}
                            </a>
                        </Button>
                    )}

                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/lms/live-classes/${liveSession._id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t("common:view")}
                        </Link>
                    </Button>

                    {isInstructor && (
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/lms/live-classes/${liveSession._id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("common:edit")}
                            </Link>
                        </Button>
                    )}

                    <Button variant="ghost" onClick={control.hide}>
                        {t("common:close")}
                    </Button>
                </div>
            </div>
            )}
        </BaseDialog>
    );
}

