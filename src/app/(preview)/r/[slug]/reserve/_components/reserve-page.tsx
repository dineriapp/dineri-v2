"use client";
import {
  getContrast,
  getFontStack,
  getGlassFilter,
  resolvedButtonRadius,
  resolvedSectionRadius,
  SHADOW_MAP,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/utils";
import {
  formatTimeLabel,
  ReservationDatePicker,
  ReservationTimePicker,
} from "@/components/shared/reservation-pickers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReservationAvailability } from "@/lib/tanstack-react-query/hooks/reservation-availability";
import { useCreateReservation } from "@/lib/tanstack-react-query/hooks/reservation-create";
import { resolveDepositAmount } from "@/lib/services/reservation-deposit";
import { getCurrencySymbol } from "@/lib/stripe/types";
import { AppearanceSettings, DEFAULT_APPEARANCE } from "@/lib/types/appearnace";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarIcon,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Star,
  StickyNote,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ReservationPageRestaurantType } from "../query";
import { reservationRequestSchema, ReservationRequestSchemaType } from "../schema";
import { ReservationAvailabilityCard } from "./reservation-availability-card";
import {
  RESERVATION_POLICY_TITLE,
  ReservationPolicyId,
  resolveReservationPolicies,
  visibleReservationPolicies,
} from "@/lib/types/reservation-policy";
import { AppearanceBackground } from "@/components/shared/appearance-background";

const ReservePage = ({
  restaurant,
  slug,
}: {
  restaurant: ReservationPageRestaurantType;
  slug: string;
}) => {
  const settings: AppearanceSettings = restaurant?.appearance_settings ?? DEFAULT_APPEARANCE;

  const [openPolicy, setOpenPolicy] = useState<ReservationPolicyId | null>(null);
  const shownPolicies = visibleReservationPolicies(
    resolveReservationPolicies(
      restaurant?.reservation_policies,
      restaurant?.reservation_settings?.cancellationHours ?? 24,
    ),
  );
  const activePolicy = shownPolicies.find((p) => p.id === openPolicy) ?? null;
  const font = getFontStack(settings.fontFamily);
  const sectionRadius = resolvedSectionRadius(settings);
  const buttonRadius = resolvedButtonRadius(settings);
  const glassFilter = getGlassFilter(settings.glassBlur);

  const sectionDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.sectionShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };
  const buttonDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.buttonShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };

  const sectionStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...sectionDepth,
      border: `1px solid ${settings.sectionBorderColor}`,
      borderRadius: sectionRadius,
    };
    switch (settings.sectionStyle) {
      case "outline":
        return { ...base, background: "transparent" };
      case "gradient":
        return {
          ...base,
          background: `linear-gradient(135deg, ${settings.sectionBgColor}, ${settings.sectionBgColorTo})`,
        };
      default:
        return { ...base, background: settings.sectionBgColor };
    }
  };

  const buttonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...buttonDepth,
      color: settings.buttonTextColor,
      border: `1px solid ${settings.buttonBorderColor}`,
    };
    switch (settings.buttonStyle) {
      case "outline":
        return { ...base, background: "transparent" };
      case "gradient":
        return {
          ...base,
          background: `linear-gradient(135deg, ${settings.buttonBgColor}, ${settings.buttonBgColorTo})`,
        };
      default:
        return { ...base, background: settings.buttonBgColor };
    }
  };

  const HeaderIconStyle: React.CSSProperties = {
    background: settings.sectionIconBgColor,
    color: settings.sectionIconColor,
    border: `1px solid ${settings.sectionIconBorderColor}`,
    borderRadius: `${settings.sectionIconRadiusPx}px`,
  };

  const router = useRouter();
  const createMutation = useCreateReservation();

  const form = useForm<ReservationRequestSchemaType>({
    resolver: zodResolver(reservationRequestSchema),
    defaultValues: {
      name: "",
      partySize: 2,
      phone: "",
      email: "",
      date: "",
      time: "",
      notes: "",
      areaId: "",
      isPriority: false,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const values = useWatch({ control: form.control });

  // Only offered when the venue has switched priority reservations on; with it
  // off this page behaves exactly as it did before the feature existed.
  const reservationSettings = restaurant?.reservation_settings;
  const priorityOffered = !!reservationSettings?.priorityReservations;
  const isPriority = priorityOffered && !!values.isPriority;

  const depositDue = reservationSettings
    ? resolveDepositAmount(reservationSettings, isPriority)
    : 0;
  const currencySymbol = getCurrencySymbol(restaurant?.currency ?? null);

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

  const isAvailabilityInputReady =
    !!debounced.date &&
    !!debounced.time &&
    Number.isInteger(debounced.partySize) &&
    debounced.partySize > 0;

  const {
    data: availabilityResult,
    isPending: isCheckingAvailability,
    error: availabilityError,
  } = useReservationAvailability(
    isAvailabilityInputReady
      ? {
          slug,
          date: debounced.date,
          time: debounced.time,
          partySize: debounced.partySize,
          areaId: debounced.areaId || undefined,
          isPriority: debounced.isPriority,
        }
      : null,
  );

  const closedDayError =
    availabilityResult &&
    !availabilityResult.available &&
    availabilityResult.reason === "RESTAURANT_CLOSED_DAY"
      ? availabilityResult.message
      : undefined;
  const closedTimeError =
    availabilityResult &&
    !availabilityResult.available &&
    availabilityResult.reason === "RESTAURANT_CLOSED_TIME"
      ? availabilityResult.message
      : undefined;

  const onSubmit = async (data: ReservationRequestSchemaType) => {
    if (!availabilityResult?.available) {
      toast.error("Please choose an available date, time, and party size before booking.");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        slug,
        ...data,
        areaId: data.areaId || undefined,
      });

      if (result.status === "awaiting_payment") {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = result.checkoutUrl;
        return;
      }

      router.push(result.successPath);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create reservation. Please try again.",
      );
    }
  };

  return (
    <div className="relative isolate min-h-screen" style={{ fontFamily: font }}>
      <AppearanceBackground settings={settings} />
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href={`/r/${slug}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
            style={{ ...sectionStyle(), color: settings.sectionItemHeadingColor }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div
            className="inline-flex items-center gap-1.5 text-xs"
            style={{ color: settings.text_color }}
          >
            <CalendarCheck className="h-3.5 w-3.5" style={{ color: settings.heading_color }} />{" "}
            Reservation
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* LEFT - form */}
          <section>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: settings.heading_color }}
            >
              Reserve a table
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: settings.text_color }}>
              Fill in your details - we&apos;ll confirm instantly.
            </p>

            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-6 space-y-4 rounded-3xl p-5"
                style={sectionStyle()}
              >
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      label="Guest name"
                      icon={User}
                      error={fieldState.error?.message}
                      settings={settings}
                      sectionRadius={sectionRadius}
                    >
                      <input
                        {...field}
                        maxLength={80}
                        className={inputCls}
                        style={inputStyle(settings)}
                        placeholder="Jane Doe"
                      />
                    </Field>
                  )}
                />
                <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <Controller
                    name="partySize"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        label="Party size"
                        icon={Users}
                        error={fieldState.error?.message}
                        settings={settings}
                        sectionRadius={sectionRadius}
                      >
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className={inputCls}
                          style={inputStyle(settings)}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        label="Phone"
                        icon={Phone}
                        error={fieldState.error?.message}
                        settings={settings}
                        sectionRadius={sectionRadius}
                      >
                        <input
                          {...field}
                          type="text"
                          inputMode="tel"
                          maxLength={30}
                          className={inputCls}
                          style={inputStyle(settings)}
                          placeholder="+33 …"
                          onChange={(e) => field.onChange(e.target.value.replace(/[^\d+]/g, ""))}
                        />
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      label="Email"
                      icon={Mail}
                      error={fieldState.error?.message}
                      settings={settings}
                      sectionRadius={sectionRadius}
                    >
                      <input
                        {...field}
                        type="email"
                        autoComplete="email"
                        maxLength={255}
                        className={inputCls}
                        style={inputStyle(settings)}
                        placeholder="you@example.com"
                      />
                    </Field>
                  )}
                />
                <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                  <Controller
                    name="date"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        label="Date"
                        icon={CalendarIcon}
                        error={fieldState.error?.message ?? closedDayError}
                        settings={settings}
                        sectionRadius={sectionRadius}
                      >
                        <ReservationDatePicker
                          value={field.value}
                          onChange={field.onChange}
                          className={pickerTriggerCls}
                          style={inputStyle(settings)}
                          placeholderStyle={{ opacity: 0.6 }}
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
                        settings={settings}
                        sectionRadius={sectionRadius}
                      >
                        <ReservationTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          className={inputCls}
                          style={inputStyle(settings)}
                        />
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  name="areaId"
                  control={form.control}
                  render={({ field }) => (
                    <Field
                      label="Dining area (optional)"
                      icon={MapPin}
                      settings={settings}
                      sectionRadius={sectionRadius}
                    >
                      <Select
                        value={field.value || ANY_AREA_VALUE}
                        onValueChange={(v) => field.onChange(v === ANY_AREA_VALUE ? "" : v)}
                      >
                        <SelectTrigger
                          className="h-auto w-full justify-between rounded-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none outline-none focus-visible:ring-0 data-[size=default]:h-auto"
                          style={inputStyle(settings)}
                        >
                          <SelectValue placeholder="Any area">
                            {field.value
                              ? (restaurant?.areas?.find((a) => a.id === field.value)?.name ??
                                "Any area")
                              : "Any area"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ANY_AREA_VALUE}>Any area</SelectItem>
                          {restaurant?.areas?.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  name="notes"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      label="Notes (optional)"
                      icon={StickyNote}
                      error={fieldState.error?.message}
                      settings={settings}
                      sectionRadius={sectionRadius}
                    >
                      <textarea
                        {...field}
                        maxLength={300}
                        rows={2}
                        className={inputCls + " resize-none"}
                        style={inputStyle(settings)}
                        placeholder="Allergies, special occasion…"
                      />
                    </Field>
                  )}
                />
                {/* Priority reservation - only when the venue offers it */}
                {priorityOffered && (
                  <Controller
                    name="isPriority"
                    control={form.control}
                    render={({ field }) => (
                      <label
                        className="flex cursor-pointer items-start gap-2.5 rounded-2xl p-3 transition"
                        style={{
                          background: settings.sectionInIconBgColor,
                          border: `1px solid ${field.value ? settings.sectionItemHeadingColor : settings.sectionInIconBorderColor}`,
                          borderRadius: sectionRadius,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                          style={{ accentColor: settings.sectionItemHeadingColor }}
                        />
                        <span className="min-w-0">
                          <span
                            className="flex items-center gap-1.5 text-sm font-semibold"
                            style={{ color: settings.sectionItemHeadingColor }}
                          >
                            <Star className="h-3.5 w-3.5" /> Priority Reservation
                          </span>
                          <span
                            className="mt-1 block text-[11px] leading-relaxed"
                            style={{ color: settings.sectionItemTextColor }}
                          >
                            Check this option only if you want your reservation to be treated as a
                            priority. Even if our restaurant is fully booked, we will do our best to
                            accommodate your reservation.
                            {(reservationSettings?.priorityReservationAmount ?? 0) > 0
                              ? ` An additional priority fee applies${
                                  reservationSettings?.requireDeposit &&
                                  reservationSettings.depositAmount > 0
                                    ? " on top of the deposit"
                                    : ""
                                }.`
                              : ""}
                          </span>
                        </span>
                      </label>
                    )}
                  />
                )}

                {/* Reservation availability */}
                <ReservationAvailabilityCard
                  settings={settings}
                  sectionRadius={sectionRadius}
                  isReady={isAvailabilityInputReady}
                  isLoading={isCheckingAvailability}
                  result={availabilityResult}
                  error={availabilityError?.message ?? null}
                />
                <button
                  type="submit"
                  disabled={createMutation.isPending || form.formState.isSubmitting}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
                  style={{ ...buttonStyle(), borderRadius: buttonRadius }}
                >
                  {createMutation.isPending
                    ? "Confirming…"
                    : depositDue > 0
                      ? `Pay ${currencySymbol}${depositDue.toFixed(2)} to confirm your reservation`
                      : "Confirm reservation"}
                </button>
                <p
                  className="text-center text-[10px]"
                  style={{ color: settings.sectionItemTextColor }}
                >
                  No payment is required unless a deposit applies - you&apos;ll be notified before
                  any card is charged.
                </p>
              </form>
            </FormProvider>
          </section>

          {/* RIGHT - policy + availability + live preview */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start ">
            {/* Live preview */}
            <div
              className="font-jetbrains-mono text-[10px] uppercase tracking-wider"
              style={{ color: settings.text_color }}
            >
              Live preview
            </div>
            <div className="overflow-hidden rounded-3xl shadow-2xl" style={sectionStyle()}>
              <div className="px-5 pt-5 text-center">
                {restaurant?.logo?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={restaurant.logo.url}
                    alt={restaurant.name}
                    className="mx-auto h-14 w-14 shrink-0 rounded-2xl object-cover shadow-2xl"
                  />
                ) : (
                  <div
                    className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold shadow-2xl"
                    style={{
                      background: getContrast(settings.heading_color),
                      color: settings.heading_color,
                      border: `1px solid ${settings.sectionBorderColor}`,
                    }}
                  >
                    {(restaurant?.name ?? "").slice(0, 2).toUpperCase() || "•"}
                  </div>
                )}
                <h2
                  className="mt-3 text-lg font-semibold"
                  style={{ color: settings.sectionItemHeadingColor }}
                >
                  {restaurant?.name ?? "Restaurant"}
                </h2>
                <p className="text-xs" style={{ color: settings.sectionItemTextColor }}>
                  Reservation summary
                </p>
              </div>

              <div
                className="m-5 mt-4 rounded-2xl p-4 text-sm"
                style={{
                  background: settings.sectionInIconBgColor,
                  border: `1px solid ${settings.sectionInIconBorderColor}`,
                }}
              >
                <Row label="Guest" value={values.name || "-"} icon={User} settings={settings} />
                <Row
                  label="Party"
                  value={
                    values.partySize
                      ? `${values.partySize} guest${values.partySize > 1 ? "s" : ""}`
                      : "-"
                  }
                  icon={Users}
                  settings={settings}
                />
                <Row
                  label="Date"
                  value={
                    values.date && values.time
                      ? `${format(new Date(`${values.date}T00:00:00`), "EEE, MMM d")} · ${formatTimeLabel(values.time)}`
                      : "-"
                  }
                  icon={CalendarIcon}
                  settings={settings}
                />
                <Row label="Phone" value={values.phone || "-"} icon={Phone} settings={settings} />
                <Row
                  label="Email"
                  value={values.email || "-"}
                  icon={Mail}
                  settings={settings}
                  last
                />
                {values.notes && (
                  <div
                    className="mt-3 rounded-lg p-2.5 text-[11px]"
                    style={{
                      background: settings.sectionBgColor,
                      color: settings.sectionItemTextColor,
                    }}
                  >
                    “{values.notes}”
                  </div>
                )}
              </div>
            </div>
            {shownPolicies.length > 0 && (
              <div className="rounded-3xl p-5" style={sectionStyle()}>
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={HeaderIconStyle}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: settings.sectionItemHeadingColor }}
                    >
                      Policies
                    </h3>
                    <p className="text-xs" style={{ color: settings.sectionItemTextColor }}>
                      what to know before you book.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {shownPolicies.map((p) => (
                    <div
                      key={p.id}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left"
                      style={{
                        border: `1px solid ${settings.sectionInIconBorderColor}`,
                        background: settings.sectionInIconBgColor,
                      }}
                    >
                      <span
                        className="min-w-0 flex-1 text-sm font-semibold"
                        style={{ color: settings.sectionInIconColor }}
                      >
                        {RESERVATION_POLICY_TITLE[p.id]}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPolicy(p.id)}
                        className="shrink-0 text-xs font-medium underline underline-offset-2 transition hover:opacity-80"
                        style={{ color: settings.sectionItemHeadingColor }}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {activePolicy && (
        <PolicyDialog
          title={RESERVATION_POLICY_TITLE[activePolicy.id]}
          content={activePolicy.content}
          settings={settings}
          sectionStyle={sectionStyle()}
          headerIconStyle={HeaderIconStyle}
          onClose={() => setOpenPolicy(null)}
        />
      )}
    </div>
  );
};

const PolicyDialog = ({
  title,
  content,
  settings,
  sectionStyle,
  headerIconStyle,
  onClose,
}: {
  title: string;
  content: string;
  settings: AppearanceSettings;
  sectionStyle: React.CSSProperties;
  headerIconStyle: React.CSSProperties;
  onClose: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl p-5"
        style={sectionStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={headerIconStyle}
          >
            <ShieldCheck className="h-4 w-4" />
          </span>
          <h3
            className="min-w-0 flex-1 pt-1.5 text-sm font-semibold"
            style={{ color: settings.sectionItemHeadingColor }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 transition hover:opacity-70"
            style={{ color: settings.sectionItemTextColor }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="whitespace-pre-line text-xs leading-relaxed"
              style={{ color: settings.sectionItemTextColor }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReservePage;

const inputCls =
  "peer w-full rounded-xl bg-transparent px-3 py-2.5 text-sm outline-none transition placeholder:opacity-60 [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer";

const inputStyle = (settings: AppearanceSettings): React.CSSProperties => {
  const isLight = getContrast(settings.sectionBgColor) === "#000000";
  return {
    color: settings.sectionItemHeadingColor,
    colorScheme: isLight ? "light" : "dark",
    // @ts-expect-error CSS custom properties aren't in the CSSProperties type
    "--autofill-bg": settings.sectionBgColor,
    "--autofill-fg": settings.sectionItemHeadingColor,
  };
};

const ANY_AREA_VALUE = "any";

const pickerTriggerCls =
  inputCls + " flex items-center justify-between gap-2 text-left cursor-pointer";

const Field = ({
  label,
  icon: Icon,
  error,
  settings,
  sectionRadius,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  error?: string;
  settings: AppearanceSettings;
  sectionRadius: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span
      className="font-jetbrains-mono mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider"
      style={{ color: settings.sectionItemHeadingColor }}
    >
      {Icon && <Icon className="h-3 w-3" />} {label}
    </span>
    <div
      className="transition focus-within:ring-2 focus-within:ring-offset-0"
      style={{
        background: settings.sectionBgColor,
        border: `1px solid ${error ? settings.sectionItemHeadingColor : settings.sectionBorderColor}`,
        borderRadius: sectionRadius,
        overflow: "hidden",
        // @ts-expect-error CSS var for ring color
        "--tw-ring-color": error
          ? `${settings.sectionItemHeadingColor}59`
          : `${settings.sectionItemHeadingColor}26`,
      }}
    >
      {children}
    </div>
    {error && (
      <span
        className="mt-1 flex gap-1 items-start text-[13px]"
        style={{ color: settings.sectionItemHeadingColor }}
      >
        <ShieldAlert className="size-4 shrink-0" /> {error}
      </span>
    )}
  </label>
);

const Row = ({
  label,
  value,
  icon: Icon,
  settings,
  last,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  settings: AppearanceSettings;
  last?: boolean;
}) => (
  <div
    className="flex items-center justify-between gap-4 py-2"
    style={{ borderBottom: last ? "none" : `1px solid ${settings.sectionInIconBorderColor}` }}
  >
    <span
      className="flex items-center gap-1.5 text-xs"
      style={{ color: settings.sectionItemTextColor }}
    >
      {Icon && <Icon className="h-3 w-3" />} {label}
    </span>
    <span
      className="text-xs truncate font-medium"
      style={{ color: settings.sectionItemHeadingColor }}
    >
      {value}
    </span>
  </div>
);
