"use client";

import { IUseDialogControl, FormDialog } from "@workspace/components-library";
import { ComboBox2 } from "@workspace/components-library";
import { CohortCombobox, type CohortItem } from "@/components/form/cohort-combobox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/utils/trpc";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@workspace/components-library";
import { ScheduleTypeEnum } from "@workspace/common-logic/models/lms/schedule.types";
import { LiveClassTypeEnum } from "@workspace/common-logic/models/lms/live-class.types";

const FormSchema = z.object({
    eventId: z.string().min(1, "Please select a schedule event"),
    cohortId: z.string().optional(),
});

type FormDataType = z.infer<typeof FormSchema>;

type ScheduleEventItem = {
    _id: string;
    title: string;
    startDate: Date;
    type: ScheduleTypeEnum;
};

interface StartLiveClassDialogProps {
    control: IUseDialogControl<{ cohortId?: string }>;
}

export function StartLiveClassDialog({ control }: StartLiveClassDialogProps) {
    const { t } = useTranslation(["dashboard", "common"]);
    const { toast } = useToast();
    const trpcUtils = trpc.useUtils();
    const [selectedCohort, setSelectedCohort] = useState<CohortItem | undefined>(undefined);

    const form = useForm<FormDataType>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            eventId: "",
            cohortId: "",
        },
    });

    const cohortIdFromControl = control.data?.cohortId || "";

    const loadCohortQuery = trpc.lmsModule.cohortModule.cohort.getById.useQuery(
        { id: cohortIdFromControl },
        { enabled: control.isVisible && !!cohortIdFromControl }
    );

    useEffect(() => {
        if (control.isVisible) {
            if (loadCohortQuery.data) {
                const cohort: CohortItem = {
                    _id: loadCohortQuery.data._id,
                    title: loadCohortQuery.data.title,
                };
                setSelectedCohort(cohort);
                form.reset({
                    eventId: "",
                    cohortId: cohort._id,
                });
            } else if (!cohortIdFromControl) {
                setSelectedCohort(undefined);
                form.reset({
                    eventId: "",
                    cohortId: "",
                });
            }
        }
    }, [control.isVisible, loadCohortQuery.data, cohortIdFromControl, form]);

    const searchScheduleEvents = useCallback(
        async (search: string, offset: number, size: number): Promise<ScheduleEventItem[]> => {
            const cohortId = form.watch("cohortId");
            const result = await trpcUtils.lmsModule.schedule.list.fetch({
                pagination: { skip: offset, take: size },
                search: search ? { q: search } : undefined,
                filter: {
                    type: ScheduleTypeEnum.LIVE_SESSION,
                    cohortId: cohortId || undefined,
                },
            });
            return result.items.map((event) => ({
                _id: event._id,
                title: event.title,
                startDate: event.startDate,
                type: event.type,
            }));
        },
        [trpcUtils, form]
    );


    const createLiveClassMutation = trpc.lmsModule.liveClass.create.useMutation({
        onSuccess: (data) => {
            toast({
                title: t("common:success"),
                description: t("dashboard:instructor.live_session_created"),
            });
            window.open(`/dashboard/lms/live-classes/${data._id}`, "_blank");
            control.hide();
            form.reset();
        },
        onError: (error) => {
            toast({
                title: t("common:error"),
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = useCallback(
        async (data: FormDataType) => {
            try {
                const event = await trpcUtils.lmsModule.schedule.getById.fetch({
                    id: data.eventId,
                });

                await createLiveClassMutation.mutateAsync({
                    data: {
                        title: event.title,
                        description: event.description,
                        type: LiveClassTypeEnum.LECTURE,
                        entityType: "schedule",
                        entityId: event._id,
                        eventId: event._id,
                        instructorId: event.instructorId || "",
                        cohortId: event.cohortId,
                        scheduledStartTime: new Date(event.startDate).toISOString(),
                        scheduledEndTime: new Date(event.endDate).toISOString(),
                        locationOnline: true,
                        allowRecording: true,
                        allowChat: true,
                        allowScreenShare: true,
                        allowParticipantVideo: true,
                    },
                });
            } catch (error) {
                console.error("Error creating live class:", error);
            }
        },
        [trpcUtils, createLiveClassMutation]
    );

    return (
        <FormDialog
            open={control.isVisible}
            onOpenChange={(open) => {
                if (!open) {
                    control.hide();
                    form.reset();
                }
            }}
            title={t("dashboard:lms.live_classes.start_live_class")}
            onSubmit={form.handleSubmit(handleSubmit)}
            onCancel={control.hide}
            isLoading={createLiveClassMutation.isPending}
            submitText={t("common:create")}
            cancelText={t("common:cancel")}
        >
            <FieldGroup>
                <Controller
                    name="cohortId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>{t("dashboard:cohort")}</FieldLabel>
                            <CohortCombobox
                                value={selectedCohort}
                                onChange={(cohort) => {
                                    setSelectedCohort(cohort);
                                    field.onChange(cohort?._id || "");
                                    form.setValue("eventId", "");
                                }}
                                showCreateButton={false}
                                showEditButton={false}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />

                <Controller
                    name="eventId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>
                                {t("dashboard:lms.live_classes.select_schedule_event")}
                            </FieldLabel>
                            <ComboBox2<ScheduleEventItem>
                                title={t("dashboard:lms.live_classes.select_schedule_event")}
                                valueKey="_id"
                                value={field.value ? { _id: field.value, title: "", startDate: new Date(), type: ScheduleTypeEnum.LIVE_SESSION } : undefined}
                                searchFn={searchScheduleEvents}
                                renderLabel={(event) => `${event.title} - ${new Date(event.startDate).toLocaleDateString()}`}
                                onChange={(event) => field.onChange(event?._id || "")}
                                multiple={false}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                    )}
                />
            </FieldGroup>
        </FormDialog>
    );
}


