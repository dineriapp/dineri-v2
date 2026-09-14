"use client";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Globe } from "lucide-react";
import { memo } from "react";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { StickySaveBar } from "../_components/sticky-save";
import { DashCombobox } from "./_components/combobox";
import { ALL_TIMEZONE_OPTIONS, POPULAR_TIMEZONE_OPTIONS } from "./_components/timezone-options";
import { updateRestaurantOpeningHoursAction } from "./actions";
import { RestaurantTimeZoneSchema, RestaurantTimeZoneSchemaValues } from "./schema";
import { Input } from "@/components/ui/input";
import { DAYS } from "@/lib/types";

type DayKey = (typeof DAYS)[number]["key"];

const Page = () => {
  const restaurant = useSelectedRestaurant();

  const form = useForm<RestaurantTimeZoneSchemaValues>({
    resolver: zodResolver(RestaurantTimeZoneSchema),
    defaultValues: {
      timezone: restaurant?.timezone,
      opening_hours: restaurant?.opening_hours,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const setAllOpen = () => {
    const newOpeningHours = { ...form.getValues("opening_hours") };
    for (const day of DAYS) {
      newOpeningHours[day.key] = {
        isOpen: true,
        openTime: "09:00",
        closeTime: "22:00",
      };
    }
    form.setValue("opening_hours", newOpeningHours, { shouldDirty: true });
  };

  const closeSunMon = () => {
    const current = form.getValues("opening_hours");
    form.setValue(
      "opening_hours",
      {
        ...current,
        "0": { isOpen: false, openTime: null, closeTime: null }, // Sun
        "1": { isOpen: false, openTime: null, closeTime: null }, // Mon
      },
      { shouldDirty: true },
    );
  };

  const handleSubmit = async (data: RestaurantTimeZoneSchemaValues) => {
    const response = await updateRestaurantOpeningHoursAction(data);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    updateSelectedRestaurant({
      timezone: response.data.timezone,
      opening_hours: response.data.opening_hours,
    });
    form.reset({
      timezone: response.data.timezone,
      opening_hours: response.data.opening_hours,
    });
    toast.success("Opening hours updated successfully");
  };

  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6"
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Opening Hours
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">When your venue is open</p>
          </div>
        </div>
      </header>
      <div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
            <div className="mb-3 grid gap-3 rounded-xl border border-white/10 bg-background p-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Controller
                  name="timezone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2 w-full">
                      <FieldLabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" /> Region / Time zone
                      </FieldLabel>
                      <DashCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        options={ALL_TIMEZONE_OPTIONS}
                        popularOptions={POPULAR_TIMEZONE_OPTIONS}
                        placeholder="Select timezone"
                        className="w-full!"
                        searchPlaceholder="Search timezone..."
                      />
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Used to display opening hours to your guests in their local time.
                      </p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                      )}
                    </Field>
                  )}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={setAllOpen}
                  className="rounded-lg border border-white/10 bg-background px-3 py-1.5 text-xs hover:border-white/20"
                >
                  Open all 9–22
                </button>
                <button
                  type="button"
                  onClick={closeSunMon}
                  className="rounded-lg border border-white/10 bg-background px-3 py-1.5 text-xs hover:border-white/20"
                >
                  Close Sun & Mon
                </button>
              </div>
            </div>
            {/* Opening hours rows */}
            {DAYS.map((day) => (
              <DayRow key={day.key} dayKey={day.key} dayLabel={day.label} />
            ))}

            <StickySaveBar
              dirty={form.formState.isDirty}
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting}
              onDiscard={() => form.reset()}
            />
          </form>
        </FormProvider>
      </div>
    </section>
  );
};

export default Page;

const DayRow = memo(({ dayKey, dayLabel }: { dayKey: DayKey; dayLabel: string }) => {
  const { control, setValue } = useFormContext<RestaurantTimeZoneSchemaValues>();

  const isOpen = useWatch({
    control,
    name: `opening_hours.${dayKey}.isOpen`,
  });
  const openTime = useWatch({
    control,
    name: `opening_hours.${dayKey}.openTime`,
  });
  const closeTime = useWatch({
    control,
    name: `opening_hours.${dayKey}.closeTime`,
  });

  const handleOpenChange = (checked: boolean) => {
    if (!checked) {
      // When closed, clear times
      setValue(`opening_hours.${dayKey}.isOpen`, false, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`opening_hours.${dayKey}.openTime`, null, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`opening_hours.${dayKey}.closeTime`, null, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      // When opened, set default times if they were null
      setValue(`opening_hours.${dayKey}.isOpen`, true, { shouldDirty: true, shouldValidate: true });
      setValue(`opening_hours.${dayKey}.openTime`, openTime ?? "09:00", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`opening_hours.${dayKey}.closeTime`, closeTime ?? "22:00", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div>
      <div
        className={`grid grid-cols-1 gap-2 rounded-xl border px-3 py-2.5 transition sm:grid-cols-[64px_auto_1fr_1fr] sm:items-center sm:gap-3 ${
          isOpen ? "border-white/10 bg-background" : "border-white/5 bg-background/40"
        }`}
      >
        {/* Day + toggle share a line on mobile; separate columns from sm */}
        <div className="flex items-center justify-between gap-3 sm:contents">
          <span className="text-sm font-medium">{dayLabel}</span>

          <Switch checked={isOpen} onCheckedChange={handleOpenChange} />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:contents">
          <div className="flex flex-col gap-1">
            <Input
              type="time"
              disabled={!isOpen}
              value={openTime ?? ""}
              onChange={(e) => {
                setValue(`opening_hours.${dayKey}.openTime`, e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className="text-base sm:text-sm
    [&::-webkit-calendar-picker-indicator]:hidden
    [&::-webkit-clear-button]:hidden
    [&::-webkit-inner-spin-button]:hidden
  "
            />
          </div>

          <div className="flex flex-col gap-1">
            <Input
              type="time"
              disabled={!isOpen}
              value={closeTime ?? ""}
              onChange={(e) => {
                setValue(`opening_hours.${dayKey}.closeTime`, e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className="text-base sm:text-sm
    [&::-webkit-calendar-picker-indicator]:hidden
    [&::-webkit-clear-button]:hidden
    [&::-webkit-inner-spin-button]:hidden
  "
            />
          </div>
        </div>
      </div>
    </div>
  );
});

DayRow.displayName = "DayRow";
