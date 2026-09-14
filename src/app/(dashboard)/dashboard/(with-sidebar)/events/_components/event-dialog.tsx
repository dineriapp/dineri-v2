"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/shared/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EventType } from "@/drizzle/types";
import { makeEventSchema, EventSchemaType } from "@/lib/tanstack-react-query/hooks/event.schema";
import {
  DEFAULT_EVENT_TIMEZONE,
  earliestEventDate,
  EVENT_MIN_LEAD_HOURS,
} from "@/lib/services/event-visibility";
import { useRestaurantStore } from "@/stores/restaurant-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useCreateEvent, useUpdateEvent } from "@/lib/tanstack-react-query/hooks/events";
import { toast } from "sonner";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: EventType;
  setOpen?: (open: boolean) => void;
};

const EventDialog = ({ children, open, editingRow, setOpen }: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const selectedRestaurant = useRestaurantStore((state) => state.selectedRestaurant);
  const timezone = selectedRestaurant?.timezone ?? DEFAULT_EVENT_TIMEZONE;

  const schema = useMemo(
    () =>
      makeEventSchema({
        timezone,
        existing: editingRow ? { date: editingRow.date, time: editingRow.time } : null,
      }),
    [timezone, editingRow],
  );
  const minDate = useMemo(() => {
    const earliest = earliestEventDate(timezone);
    if (editingRow && editingRow.date < earliest) return undefined;
    return earliest;
  }, [timezone, editingRow]);

  const loading = createEvent.isPending || updateEvent.isPending;
  const form = useForm<EventSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editingRow?.title ?? "",
      active: editingRow?.active ?? true,
      buttonText: editingRow?.buttonText ?? "",
      buttonLink: editingRow?.buttonLink ?? "",
      date: editingRow?.date ?? "",
      description: editingRow?.description ?? "",
      location: editingRow?.location ?? "",
      time: editingRow?.time ?? "13:00",
      sort_order: editingRow?.sort_order ?? 0,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: EventSchemaType) => {
    if (editingRow?.id) {
      updateEvent.mutate(
        { id: editingRow.id, data },
        {
          onSuccess: () => {
            toast.success("Event updated");
            setOpen?.(false);
            form.reset();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createEvent.mutate(data, {
        onSuccess: () => {
          toast.success("Event created");
          setOpen?.(false);
          setInternalOpen(false);
          form.reset();
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  useEffect(() => {
    if (editingRow) {
      form.reset({
        title: editingRow?.title ?? "",
        active: editingRow?.active ?? true,
        buttonText: editingRow?.buttonText ?? "",
        buttonLink: editingRow?.buttonLink ?? "",
        date: editingRow?.date ?? "",
        description: editingRow?.description ?? "",
        location: editingRow?.location ?? "",
        time: editingRow?.time ?? "",
        sort_order: editingRow?.sort_order ?? 0,
      });
    } else {
      form.reset({
        title: "",
        active: true,
        buttonText: "",
        buttonLink: "",
        date: "",
        description: "",
        location: "",
        time: "13:00",
        sort_order: 0,
      });
    }
  }, [editingRow, form]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-xl! pb-4!">
        <DialogHeader className="px-1">
          <DialogTitle>{editingRow ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription className="text-xs! sr-only"></DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-3 px-1 max-h-[70vh] overflow-y-auto overflow-x-visible scrollbar-dark">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1 ">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Title <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. Friday DJ Night"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <div className="w-full grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Controller
                  name="date"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-1 ">
                      <FieldLabel className="text-xs text-muted-foreground">
                        Date <span className="text-red-500">*</span>
                      </FieldLabel>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        minDate={minDate}
                        className="h-10 rounded-lg text-base sm:text-sm"
                        invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="time"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-1 ">
                      <FieldLabel className="text-xs text-muted-foreground">
                        Time <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        type="time"
                        className="h-10 rounded-lg w-full text-base sm:text-sm"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                      )}
                    </Field>
                  )}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Events must start at least {EVENT_MIN_LEAD_HOURS} hours from now, in the venue
                timezone ({timezone}).
              </p>
              <Controller
                name="location"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1 ">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Location <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. Main floor"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="buttonText"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1 ">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Button text <span className="opacity-70">(optional)</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g. Book your seat"
                      aria-invalid={fieldState.invalid}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="buttonLink"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1 ">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Button link <span className="opacity-70">(optional)</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      inputMode="url"
                      placeholder="https://..."
                      aria-invalid={fieldState.invalid}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Leave both blank for no button.
                      </p>
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-1 ">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Description <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className=" rounded-lg w-full max-h-40 min-h-20 scrollbar-dark"
                      placeholder="What's the vibe? What should guests know?"
                      aria-invalid={fieldState.invalid}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Short paragraphs read best on mobile.
                    </p>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="mt-4 flex flex-col-reverse gap-2 px-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setOpen?.(false);
                  setInternalOpen(false);
                }}
                className="w-full rounded-lg border border-white/10 px-4 h-10 text-xs hover:border-white/20 sm:h-8 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type={"submit"}
                disabled={loading}
                className="w-full rounded-lg bg-white px-4 flex items-center justify-center h-10 cursor-pointer gap-1 text-xs font-semibold text-background hover:bg-white/90 sm:h-8 sm:w-auto"
              >
                {loading && <Loader className="animate-spin size-4" />}
                Save event
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
