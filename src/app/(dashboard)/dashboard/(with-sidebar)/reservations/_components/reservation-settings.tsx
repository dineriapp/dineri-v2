"use client";
"use no memo";
import {
  Ban,
  Bell,
  Combine,
  CreditCard,
  Globe,
  Mail,
  MessageSquare,
  Pause,
  Play,
  ShieldAlert,
  Sparkles,
  Star,
  Timer,
} from "lucide-react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateReservationSettingsAction } from "../actions";
import { ReservationSettingsSchema, ReservationSettingsSchemaValues } from "../schema";
import { SettingCard, SettingsGroup, Toggle } from "./utils";

import { getCurrencySymbol } from "@/lib/stripe/types";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { Field, FieldLabel } from "@/components/ui/field";
import { StickySaveBar } from "../../settings/_components/sticky-save";

export const SettingsTab = () => {
  const selectedRestaurant = useSelectedRestaurant();

  const form = useForm<ReservationSettingsSchemaValues>({
    resolver: zodResolver(ReservationSettingsSchema),
    defaultValues: {
      ...selectedRestaurant.reservation_settings,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { control } = form;

  const requireDeposit = useWatch({ control, name: "requireDeposit" });
  const priorityReservations = useWatch({ control, name: "priorityReservations" });
  const acceptingReservations = useWatch({ control, name: "acceptingReservations" });
  const emergencyStop = useWatch({ control, name: "emergencyStop" });

  const handleSubmit = async (data: ReservationSettingsSchemaValues) => {
    const response = await updateReservationSettingsAction(data);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    updateSelectedRestaurant({
      reservation_settings: response.data.reservation_settings,
    });
    form.reset(response.data.reservation_settings);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* === Availability === */}
        <SettingsGroup
          title="Availability"
          description="Control whether new reservations can be made right now."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <SettingCard
              tone="danger"
              icon={ShieldAlert}
              title="Emergency stop"
              description="Instantly block all new reservations across every channel. Existing bookings stay visible."
            >
              <div className="flex items-center gap-2">
                <Controller
                  name="emergencyStop"
                  control={control}
                  render={({ field }) => (
                    <Toggle checked={field.value} onChange={field.onChange} tone="danger" />
                  )}
                />
                <span
                  className={`text-xs font-medium ${emergencyStop ? "text-danger" : "text-muted-foreground"}`}
                >
                  {emergencyStop ? "Active - bookings blocked" : "Disabled"}
                </span>
              </div>
            </SettingCard>

            <SettingCard
              tone="white"
              icon={acceptingReservations ? Play : Pause}
              title="Accepting reservations"
              description="Pause or resume bookings independently of the emergency stop."
            >
              <div className="flex items-center gap-2">
                <Controller
                  name="acceptingReservations"
                  control={control}
                  render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} />}
                />
                <span className="text-xs font-medium">
                  {acceptingReservations ? "Open for bookings" : "Paused"}
                </span>
              </div>
            </SettingCard>

            <SettingCard
              tone="info"
              icon={Globe}
              title="Online booking widget"
              description="Show the public-facing widget on your website and links."
            >
              <Controller
                name="showOnlineWidget"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Toggle checked={field.value} onChange={field.onChange} />
                    <span className="text-xs font-medium">
                      {field.value ? "Visible online" : "Hidden"}
                    </span>
                  </div>
                )}
              />
            </SettingCard>
          </div>
        </SettingsGroup>

        {/* === Booking flow === */}
        <SettingsGroup
          title="Booking flow"
          description="Set how reservations are confirmed, paid, and held."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <SettingCard
              tone="info"
              icon={Sparkles}
              title="Auto-confirm new bookings"
              description="Skip the pending step and confirm reservations automatically."
            >
              <Controller
                name="autoConfirm"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Toggle checked={field.value} onChange={field.onChange} />
                    <span className="text-xs font-medium">
                      {field.value ? "Auto-confirm on" : "Manual review"}
                    </span>
                  </div>
                )}
              />
            </SettingCard>

            <SettingCard
              tone="amber"
              icon={CreditCard}
              title="Require deposit"
              description="Charge a small deposit per booking to reduce no-shows."
            >
              <div className="flex items-center gap-3">
                <Controller
                  name="requireDeposit"
                  control={control}
                  render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} />}
                />
                <Controller
                  name="depositAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={!requireDeposit}
                      className="h-8 w-20 rounded-lg border border-white/10 bg-background px-2 text-xs outline-none focus:border-white/20 disabled:opacity-50"
                    />
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {getCurrencySymbol(selectedRestaurant?.stripe?.currency ?? null)} / booking
                </span>
              </div>
            </SettingCard>

            <SettingCard
              tone="amber"
              icon={Timer}
              title="Auto-release pending"
              description="Cancel pending bookings if not confirmed in time."
            >
              <div className="flex items-center gap-2">
                <Controller
                  name="autoReleaseMinutes"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-9 w-24 rounded-lg border border-white/10 bg-background px-2 text-xs outline-none focus:border-white/20"
                    />
                  )}
                />
                <span className="text-xs text-muted-foreground">minutes after start</span>
              </div>
            </SettingCard>

            <SettingCard
              tone="default"
              icon={Ban}
              title="Cancellation window"
              description="Minimum notice required for free cancellations."
            >
              <div className="flex items-center gap-2">
                <Controller
                  name="cancellationHours"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-9 w-24 rounded-lg border border-white/10 bg-background px-2 text-xs outline-none focus:border-white/20"
                    />
                  )}
                />
                <span className="text-xs text-muted-foreground">hours before service</span>
              </div>
            </SettingCard>

            <SettingCard
              tone="info"
              icon={Combine}
              title="Allow table combination"
              description="Seat larger parties by combining multiple smaller tables within the same area when no single table is big enough."
            >
              <Controller
                name="allowTableCombination"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Toggle checked={field.value} onChange={field.onChange} />
                    <span className="text-xs font-medium">
                      {field.value ? "Combining allowed" : "Single table only"}
                    </span>
                  </div>
                )}
              />
            </SettingCard>

            <SettingCard
              tone="info"
              icon={Star}
              title="Priority reservations"
              description="Let guests pay to skip the capacity check and jump the queue. Leave the amount at 0 to make it free."
            >
              <div className="flex items-center gap-3">
                <Controller
                  name="priorityReservations"
                  control={control}
                  render={({ field }) => (
                    <Toggle checked={!!field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  name="priorityReservationAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={!priorityReservations}
                      className="h-8 w-20 rounded-lg border border-white/10 bg-background px-2 text-xs outline-none focus:border-white/20 disabled:opacity-50"
                    />
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {getCurrencySymbol(selectedRestaurant?.stripe?.currency ?? null)} / booking
                </span>
              </div>
            </SettingCard>
          </div>
        </SettingsGroup>

        {/* === Notifications === */}
        <SettingsGroup title="Notifications" description="How guests and the team get reminded.">
          <div className="grid gap-4 lg:grid-cols-3">
            <SettingCard
              tone="info"
              icon={Mail}
              title="Email notifications"
              description="Send confirmations and updates by email."
            >
              <Controller
                name="notifyEmail"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Toggle checked={field.value} onChange={field.onChange} />
                    <span className="text-xs font-medium">
                      {field.value ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                )}
              />
            </SettingCard>
            <SettingCard
              tone="info"
              icon={MessageSquare}
              title="SMS reminders"
              description="Text guests before their reservation."
            >
              <Controller
                name="notifySms"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Toggle checked={field.value} onChange={field.onChange} />
                    <span className="text-xs font-medium">
                      {field.value ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                )}
              />
            </SettingCard>
            <SettingCard
              tone="default"
              icon={Bell}
              title="Reminder lead time"
              description="Hours before service to send the reminder."
            >
              <div className="flex items-center gap-2">
                <Controller
                  name="reminderHours"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-9 w-20 rounded-lg border border-white/10 bg-background px-2 text-xs outline-none focus:border-white/20"
                    />
                  )}
                />
                <span className="text-xs text-muted-foreground">hours</span>
              </div>
            </SettingCard>
          </div>
        </SettingsGroup>

        {/* === Constraints === */}
        <SettingsGroup
          title="Constraints & service hours"
          description="Rules that shape what guests can book."
        >
          <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Min party size
                </FieldLabel>
                <Controller
                  name="minPartySize"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-9 w-full rounded-lg border border-white/10 bg-background px-3 text-xs outline-none focus:border-white/20"
                      />
                      {fieldState.error && (
                        <p className="mt-1 text-[11px] text-destructive">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Max party size
                </FieldLabel>
                <Controller
                  name="maxPartySize"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-white/10 bg-background px-3 text-xs outline-none focus:border-white/20"
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Slot duration (minutes)
                </FieldLabel>
                <Controller
                  name="slotDurationMinutes"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-white/10 bg-background px-3 text-xs outline-none focus:border-white/20"
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Lead time (minutes before service)
                </FieldLabel>
                <Controller
                  name="leadTimeMinutes"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={0}
                      step={15}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-white/10 bg-background px-3 text-xs outline-none focus:border-white/20"
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Max advance booking (days)
                </FieldLabel>
                <Controller
                  name="maxAdvanceDays"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-white/10 bg-background px-3 text-xs outline-none focus:border-white/20"
                    />
                  )}
                />
              </Field>
            </div>
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
