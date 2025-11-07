"use client";

import { BaseDialog, IUseDialogControl } from "@workspace/components-library";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { BookOpen, Calendar, CalendarIcon, Edit, ExternalLink, Users } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/components/contexts/profile-context";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";
import { CohortStatusEnum } from "@workspace/common-logic/models/lms/cohort.types";

export type CohortDialogData = {
    cohortId: string;
};

interface CohortViewDialogProps {
    control: IUseDialogControl<CohortDialogData>;
}

export function CohortViewDialog({
    control,
}: CohortViewDialogProps) {
    const { t } = useTranslation(["dashboard", "common"]);
    const { profile } = useProfile();

    const loadCohortQuery = trpc.lmsModule.cohortModule.cohort.getById.useQuery(
        { id: control.data?.cohortId || "" },
        { enabled: control.isVisible && !!control.data?.cohortId }
    );

    const cohort = loadCohortQuery.data;

    const isInstructor = profile?.roles?.includes("instructor");

    const getStatusBadgeVariant = (status: CohortStatusEnum) => {
        const variants: Record<CohortStatusEnum, "default" | "secondary" | "destructive" | "outline"> = {
            [CohortStatusEnum.UPCOMING]: "secondary",
            [CohortStatusEnum.LIVE]: "default",
            [CohortStatusEnum.COMPLETED]: "outline",
            [CohortStatusEnum.CANCELLED]: "destructive",
        };
        return variants[status];
    };

    const getStatusLabel = (status: CohortStatusEnum) => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    return (
        <BaseDialog
            open={control.isVisible}
            onOpenChange={(open) => {
                if (!open) control.hide();
            }}
            title={
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {loadCohortQuery.isLoading ? t("common:loading") : cohort?.title || ""}
                </div>
            }
            maxWidth="2xl"
        >
            {loadCohortQuery.isLoading ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Skeleton className="h-6 w-24" />
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
            ) : !cohort ? (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">{t("common:not_found")}</p>
                </div>
            ) : (
            <div className="space-y-6">
                {/* Header with Status */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getStatusBadgeVariant(cohort.status)}>
                        {getStatusLabel(cohort.status)}
                    </Badge>
                </div>

                {/* Description */}
                {cohort.description && (
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {cohort.description}
                        </p>
                    </div>
                )}

                <Separator />

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course */}
                    {cohort.course?.title && (
                        <div className="flex items-start gap-3">
                            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("common:course")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {cohort.course.title}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Instructor */}
                    {cohort.instructor?.fullName && (
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("common:instructor")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {cohort.instructor.fullName}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Start Date */}
                    {cohort.beginDate && (
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("common:start_date")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(cohort.beginDate), "PPP")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* End Date */}
                    {cohort.endDate && (
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("common:end_date")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(cohort.endDate), "PPP")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Capacity */}
                    {cohort.maxCapacity && (
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("common:capacity")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {cohort.maxCapacity}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Invite Code */}
                    {cohort.inviteCode && (
                        <div className="flex items-start gap-3">
                            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t("dashboard:cohort_edit.invite_code")}</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {cohort.inviteCode}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href={`/dashboard/lms/cohorts/${cohort._id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t("common:view")}
                        </Link>
                    </Button>

                    {cohort.course?._id && (
                        <Button variant="outline" asChild>
                            <Link href={`/dashboard/lms/courses/${cohort.course._id}`}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                {t("common:view")} {t("common:course")}
                            </Link>
                        </Button>
                    )}

                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/lms/schedule?cohortId=${cohort._id}`}>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {t("common:schedule")}
                        </Link>
                    </Button>

                    <Button variant="ghost" onClick={control.hide}>
                        {t("common:close")}
                    </Button>
                </div>
            </div>
            )}
        </BaseDialog>
    );
}

