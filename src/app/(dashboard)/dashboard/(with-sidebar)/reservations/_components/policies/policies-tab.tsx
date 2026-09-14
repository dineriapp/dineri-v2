"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarX2, RotateCcw, ScrollText, UtensilsCrossed } from "lucide-react";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  defaultPolicyContent,
  RESERVATION_POLICY_HINT,
  RESERVATION_POLICY_IDS,
  RESERVATION_POLICY_TITLE,
  ReservationPolicyId,
  resolveReservationPolicies,
} from "@/lib/types/reservation-policy";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";

import { StickySaveBar } from "../../../settings/_components/sticky-save";
import { updateReservationPoliciesAction } from "../../actions";
import { ReservationPoliciesSchema, ReservationPoliciesSchemaValues } from "../../schema";
import { SettingCard, SettingsGroup, Toggle } from "../utils";

const POLICY_ICON: Record<ReservationPolicyId, React.ElementType> = {
  "cancellation-policy": ScrollText,
  "no-show-policy": CalendarX2,
  "dining-policy": UtensilsCrossed,
};

export const PoliciesTab = () => {
  const selectedRestaurant = useSelectedRestaurant();
  const cancellationHours = selectedRestaurant?.reservation_settings?.cancellationHours ?? 24;

  const form = useForm<ReservationPoliciesSchemaValues>({
    resolver: zodResolver(ReservationPoliciesSchema),
    defaultValues: {
      policies: resolveReservationPolicies(
        selectedRestaurant?.reservation_policies,
        cancellationHours,
      ),
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { control, setValue } = form;
  const { fields } = useFieldArray({ control, name: "policies" });
  const policies = useWatch({ control, name: "policies" });

  const handleSubmit = async (data: ReservationPoliciesSchemaValues) => {
    const response = await updateReservationPoliciesAction(data);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    const saved = resolveReservationPolicies(response.data.reservation_policies, cancellationHours);
    updateSelectedRestaurant({ reservation_policies: response.data.reservation_policies });
    form.reset({ policies: saved });
    toast.success("Policies updated");
  };

  const enabledCount = policies?.filter((p) => p.enabled).length ?? 0;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <SettingsGroup
          title="Booking policies"
          description={
            enabledCount === 0
              ? "All hidden - the policies card won't appear on your reserve page"
              : `${enabledCount} of ${fields.length} shown on your reserve page`
          }
        >
          <div className="space-y-4">
            {fields.map((field, index) => {
              const id = policies?.[index]?.id ?? RESERVATION_POLICY_IDS[index];
              const enabled = policies?.[index]?.enabled ?? true;
              const content = policies?.[index]?.content ?? "";
              const error = form.formState.errors.policies?.[index]?.content;

              return (
                <SettingCard
                  key={field.id}
                  icon={POLICY_ICON[id]}
                  title={RESERVATION_POLICY_TITLE[id]}
                  description={RESERVATION_POLICY_HINT[id]}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {enabled ? "Shown to guests" : "Hidden from guests"}
                      </span>
                      <Controller
                        control={control}
                        name={`policies.${index}.enabled`}
                        render={({ field: f }) => (
                          <Toggle checked={f.value} onChange={f.onChange} />
                        )}
                      />
                    </div>

                    <Controller
                      control={control}
                      name={`policies.${index}.content`}
                      render={({ field: f }) => (
                        <textarea
                          {...f}
                          rows={6}
                          disabled={!enabled}
                          aria-label={`${RESERVATION_POLICY_TITLE[id]} text`}
                          aria-invalid={!!error}
                          placeholder="What should guests know?"
                          className={`w-full resize-y rounded-lg border bg-background px-3 py-2 text-xs leading-relaxed outline-none transition placeholder:text-muted-foreground focus:border-white/25 disabled:opacity-50 ${
                            error ? "border-danger/50" : "border-white/10"
                          }`}
                        />
                      )}
                    />

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">
                        {error ? (
                          <span className="text-danger">{error.message}</span>
                        ) : (
                          `${content.length} / 4000 · blank lines start a new paragraph`
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setValue(
                            `policies.${index}.content`,
                            defaultPolicyContent(id, cancellationHours),
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-muted-foreground transition hover:border-white/25 hover:text-foreground"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset to default
                      </button>
                    </div>
                  </div>
                </SettingCard>
              );
            })}
          </div>
        </SettingsGroup>

        <StickySaveBar
          dirty={form.formState.isDirty}
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitting}
          onDiscard={() => form.reset()}
        />
      </form>
    </FormProvider>
  );
};
