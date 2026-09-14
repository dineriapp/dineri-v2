"use client";

import {
  formatTimeLabel,
  ReservationDatePicker,
  ReservationTimePicker,
} from "@/components/shared/reservation-pickers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminReservationAvailability,
  useAdminReservationContext,
  useCreateAdminReservation,
} from "@/lib/tanstack-react-query/hooks/admin-reservation";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  StickyNote,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  reservationRequestSchema,
  ReservationRequestSchemaType,
} from "@/app/(preview)/r/[slug]/reserve/schema";
import { resolveDepositAmount } from "@/lib/services/reservation-deposit";
import { DashSelect, SectionHeader } from "../../../../_components";
import { fmtMoney } from "../../../orders/_components/utils";
import { AvailabilityBadge } from "./availability-badge";

const ANY_AREA_VALUE = "any";

const inputCls =
  "h-9 w-full rounded-lg border border-white/10 bg-background px-3 text-xs outline-none transition focus:border-white/40 focus:ring-1 focus:ring-white/30";

export function NewReservationForm({
  prefill,
}: {
  prefill: { date?: string; time?: string; areaId?: string };
}) {
  const router = useRouter();
  const { data: context, isPending: contextPending } = useAdminReservationContext();
  const createMutation = useCreateAdminReservation();

  const [created, setCreated] = useState<{
    guestName: string;
    date: string;
    time: string;
    partySize: number;
    amount: string;
    paymentStatus: "paid" | "free";
  } | null>(null);

  const form = useForm<ReservationRequestSchemaType>({
    resolver: zodResolver(reservationRequestSchema),
    defaultValues: {
      name: "",
      partySize: 2,
      phone: "",
      email: "",
      date: prefill.date ?? "",
      time: prefill.time ?? "",
      notes: "",
      areaId: prefill.areaId ?? "",
      isPriority: false,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const values = useWatch({ control: form.control });

  const priorityOffered = !!context?.priorityReservations;
  const isPriority = priorityOffered && !!values.isPriority;

  const [debounced, setDebounced] = useState({
    date: "",
    time: "",
    partySize: 0,
    areaId: "",
    isPriority: false,
  });
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced({
        date: values.date ?? "",
        time: values.time ?? "",
        partySize: values.partySize ?? 0,
        areaId: values.areaId ?? "",
        isPriority,
      });
    }, 500);
    return () => clearTimeout(t);
  }, [values.date, values.time, values.partySize, values.areaId, isPriority]);

  const isReady =
    !!debounced.date &&
    !!debounced.time &&
    Number.isInteger(debounced.partySize) &&
    debounced.partySize > 0;

  const {
    data: availability,
    isPending: checking,
    error: availabilityError,
  } = useAdminReservationAvailability(
    isReady
      ? {
          date: debounced.date,
          time: debounced.time,
          partySize: debounced.partySize,
          areaId: debounced.areaId || undefined,
          isPriority: debounced.isPriority,
        }
      : null,
  );

  const closedDayError =
    availability && !availability.available && availability.reason === "RESTAURANT_CLOSED_DAY"
      ? availability.message
      : undefined;
  const closedTimeError =
    availability && !availability.available && availability.reason === "RESTAURANT_CLOSED_TIME"
      ? availability.message
      : undefined;

  const chargeAmount = context ? resolveDepositAmount(context, isPriority) : 0;
  const depositNote = useMemo(() => {
    if (!context) return null;
    if (chargeAmount <= 0) return "Confirmed · no charge required";
    const label = isPriority ? "priority reservation charge" : "deposit";
    return `Confirmed · marked paid — ${fmtMoney(chargeAmount, context.currency)} ${label}`;
  }, [context, chargeAmount, isPriority]);

  const onSubmit = async (data: ReservationRequestSchemaType) => {
    if (!availability?.available) {
      toast.error("Pick an available date, time and party size first.");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        ...data,
        areaId: data.areaId || undefined,
      });
      setCreated(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create reservation.");
    }
  };

  const closeSuccess = () => {
    setCreated(null);
    router.push("/dashboard/reservations");
  };

  const canSubmit = availability?.available && !createMutation.isPending;

  return (
    <>
      <Link
        href="/dashboard/reservations"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to reservations
      </Link>
      <SectionHeader
        iconClassName="text-white"
        icon={CalendarPlus}
        title="New reservation"
        description="Book a table on behalf of a guest. Availability is checked against the same rules as online bookings, and the reservation is confirmed straight away."
      />
      <div className=" space-y-4 max-w-3xl">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="dash-card space-y-4 rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field label="Guest name" icon={User} error={fieldState.error?.message} required>
                  <input {...field} maxLength={80} className={inputCls} placeholder="Jane Doe" />
                </Field>
              )}
            />
            <Controller
              name="partySize"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  label="Party size"
                  icon={Users}
                  error={fieldState.error?.message}
                  hint={
                    context ? `${context.minPartySize}–${context.maxPartySize} guests` : undefined
                  }
                  required
                >
                  <input
                    type="number"
                    min={context?.minPartySize ?? 1}
                    max={context?.maxPartySize ?? 40}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field label="Phone" icon={Phone} error={fieldState.error?.message} required>
                  <input
                    {...field}
                    inputMode="tel"
                    maxLength={30}
                    className={inputCls}
                    placeholder="+33…"
                    onChange={(e) => field.onChange(e.target.value.replace(/[^\d+]/g, ""))}
                  />
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field label="Email" icon={Mail} error={fieldState.error?.message} required>
                  <input
                    {...field}
                    type="email"
                    maxLength={255}
                    className={inputCls}
                    placeholder="guest@example.com"
                  />
                </Field>
              )}
            />
            <Controller
              name="date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  label="Date"
                  icon={CalendarIcon}
                  error={fieldState.error?.message ?? closedDayError}
                  required
                >
                  <ReservationDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className={pickerTriggerCls}
                    placeholderClassName="text-muted-foreground"
                  />
                </Field>
              )}
            />
            <Controller
              name="time"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  label="Time"
                  icon={Clock}
                  error={fieldState.error?.message ?? closedTimeError}
                  required
                >
                  <ReservationTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    className={cn(inputCls, "scheme-dark")}
                  />
                </Field>
              )}
            />
            <Controller
              name="areaId"
              control={form.control}
              render={({ field }) => (
                <Field label="Dining area" icon={MapPin} hint="optional">
                  <DashSelect
                    value={field.value || ANY_AREA_VALUE}
                    onValueChange={(v) => field.onChange(v === ANY_AREA_VALUE ? "" : v)}
                    ariaLabel="Dining area"
                    className="w-full"
                    options={[
                      { value: ANY_AREA_VALUE, label: "Any area" },
                      ...(context?.areas ?? []).map((a) => ({ value: a.id, label: a.name })),
                    ]}
                  />
                </Field>
              )}
            />
            <div className="sm:col-span-2">
              <Controller
                name="notes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    label="Notes"
                    icon={StickyNote}
                    error={fieldState.error?.message}
                    hint="optional"
                  >
                    <textarea
                      {...field}
                      maxLength={300}
                      rows={2}
                      className={cn(inputCls, "h-auto resize-none py-2")}
                      placeholder="Allergies, occasion, seating preference…"
                    />
                  </Field>
                )}
              />
            </div>
          </div>

          {priorityOffered && (
            <Controller
              name="isPriority"
              control={form.control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-background p-3 transition hover:border-white/30">
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-white"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Star className="h-3.5 w-3.5" /> Priority reservation
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                      Skip the capacity check for this booking, even if the slot is otherwise full.
                    </span>
                  </span>
                </label>
              )}
            />
          )}

          <AvailabilityBadge
            isReady={isReady}
            isLoading={checking}
            result={availability}
            error={availabilityError?.message ?? null}
          />

          <div className="flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              {contextPending ? "…" : depositNote}
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-xs font-semibold text-background shadow-[0_8px_24px_-8px_rgba(255,255,255,0.6)] transition hover:bg-white/90 disabled:opacity-40"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Create reservation
            </button>
          </div>
        </form>
      </div>

      <Dialog open={!!created} onOpenChange={(open) => !open && closeSuccess()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">Reservation created</DialogTitle>
            <DialogDescription className="text-center">
              {created?.paymentStatus === "paid"
                ? "Confirmed and marked as paid."
                : "Confirmed. No deposit was required."}{" "}
              A confirmation email is on its way.
            </DialogDescription>
          </DialogHeader>

          {created && (
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <Summary label="Guest" value={created.guestName} />
              <Summary label="Party" value={`${created.partySize} guests`} />
              <Summary
                label="When"
                value={`${format(new Date(`${created.date}T00:00:00`), "MMM d")} · ${formatTimeLabel(created.time)}`}
              />
              <Summary
                label="Payment"
                value={
                  created.paymentStatus === "paid"
                    ? `Paid · ${fmtMoney(Number(created.amount), context?.currency)}`
                    : "No deposit"
                }
              />
            </dl>
          )}

          <DialogFooter>
            <button
              onClick={closeSuccess}
              className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-white px-3.5 text-xs font-semibold text-background hover:bg-white/90"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const Summary = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-background px-2.5 py-1.5">
    <dt className="font-jetbrains-mono text-[9px] uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-0.5 truncate font-medium">{value}</dd>
  </div>
);

const Field = ({
  label,
  icon: Icon,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="font-jetbrains-mono mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
      {required && <span className="text-white">*</span>}
      {hint && <span className="ml-auto normal-case tracking-normal opacity-70">{hint}</span>}
    </span>
    {children}
    {error && <span className="mt-1 block text-[10px] text-danger">{error}</span>}
  </label>
);

const pickerTriggerCls = cn(inputCls, "flex items-center text-left");
