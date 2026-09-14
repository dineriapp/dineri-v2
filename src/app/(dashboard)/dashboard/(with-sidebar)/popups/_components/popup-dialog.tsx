"use client";

import { ReactNode, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PopupType } from "@/drizzle/types";
import { useCreatePopup, useUpdatePopup } from "@/lib/tanstack-react-query/hooks/popups";
import { popupSchema, PopupSchemaType } from "@/lib/validators/zod/popup.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: PopupType;
  setOpen?: (open: boolean) => void;
};

const ON_PAGE_OPTIONS: { value: PopupSchemaType["onPage"]; label: string }[] = [
  { value: "restaurant", label: "Restaurant page" },
  { value: "menu", label: "Menu page" },
  { value: "reserve", label: "Reserve table page" },
];

const TRIGGER_OPTIONS: { value: PopupSchemaType["trigger_after_seconds"]; label: string }[] = [
  { value: 0, label: "Immediately" },
  { value: 10, label: "After 10 seconds" },
  { value: 30, label: "After 30 seconds" },
  { value: 60, label: "After 1 minute" },
];

const DEFAULT_VALUES: PopupSchemaType = {
  badge: "",
  title: "",
  body: "",
  cta: "Learn more",
  ctaUrl: "",
  footerNote: "",
  onPage: "restaurant",
  trigger_after_seconds: 0,
  status: "paused",
};

export default function PopupDialog({ children, open, editingRow, setOpen }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createPopupMutation = useCreatePopup();
  const updatePopupMutation = useUpdatePopup();
  const loading = createPopupMutation.isPending || updatePopupMutation.isPending;

  const form = useForm<PopupSchemaType>({
    resolver: zodResolver(popupSchema),
    defaultValues: editingRow
      ? {
          badge: editingRow.badge ?? "",
          title: editingRow.title,
          body: editingRow.body,
          cta: editingRow.cta,
          ctaUrl: editingRow.ctaUrl,
          footerNote: editingRow.footerNote ?? "",
          onPage: editingRow.onPage,
          trigger_after_seconds: editingRow.trigger_after_seconds,
          status: editingRow.status,
        }
      : DEFAULT_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: PopupSchemaType) => {
    if (editingRow?.id) {
      await updatePopupMutation.mutateAsync(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Popup updated");
            form.reset();
            setOpen?.(false);
            setInternalOpen(false);
          },
          onError: (err) => {
            toast.error(err.message ?? "something went wrong!");
          },
        },
      );
    } else {
      await createPopupMutation.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Popup created");
          form.reset();
          setOpen?.(false);
          setInternalOpen(false);
        },
        onError: (err) => {
          toast.error(err.message ?? "something went wrong!");
        },
      });
    }
  };

  const trigger_after_seconds = useWatch({
    control: form.control,
    name: "trigger_after_seconds",
  });

  useEffect(() => {
    if (editingRow) {
      form.reset({
        badge: editingRow.badge ?? "",
        title: editingRow.title,
        body: editingRow.body,
        cta: editingRow.cta,
        ctaUrl: editingRow.ctaUrl,
        footerNote: editingRow.footerNote ?? "",
        onPage: editingRow.onPage,
        trigger_after_seconds: editingRow.trigger_after_seconds,
        status: editingRow.status,
      });
    } else {
      form.reset(DEFAULT_VALUES);
    }
  }, [editingRow, form]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRow ? "Edit popup" : "New popup"}</DialogTitle>
          <DialogDescription>
            Promote an offer, event or announcement with a timed popup on your public page.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="-mt-2 space-y-3">
              <Controller
                name="badge"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Badge <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. Welcome"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Title <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. Ramadan iftar set menu"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="body"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Body <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      rows={3}
                      className="w-full rounded-lg text-base sm:text-sm"
                      placeholder="Three courses with traditional sweets. Limited seats every evening."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Controller
                  name="cta"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2">
                      <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                        CTA label <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        className="h-10 rounded-lg w-full text-base sm:text-sm"
                        placeholder="Reserve"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="ctaUrl"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2">
                      <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                        CTA URL <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        className="h-10 rounded-lg w-full text-base sm:text-sm"
                        placeholder="https://…"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="footerNote"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Footer note (optional)
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. No booking fee · Free cancellation"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="onPage"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Shown on <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background rounded-md w-full h-10!">
                        <SelectValue placeholder="Select a page" />
                      </SelectTrigger>
                      <SelectContent>
                        {ON_PAGE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="trigger_after_seconds"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Time to display
                    </FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {TRIGGER_OPTIONS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => field.onChange(t.value)}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
                            Number(trigger_after_seconds) === t.value
                              ? "border-white/40 bg-white/10 text-white"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}
              />
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background px-3 py-2.5">
                    <div>
                      <div className="text-xs font-medium">Show this popup</div>
                      <div className="text-[11px] text-muted-foreground">
                        {field.value === "live"
                          ? "On - visible to guests"
                          : "Off - hidden from guests"}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value === "live"}
                      aria-label={field.value === "live" ? "Turn popup off" : "Turn popup on"}
                      onClick={() => field.onChange(field.value === "live" ? "paused" : "live")}
                      className={`relative h-5 w-9 shrink-0 rounded-full border transition ${
                        field.value === "live"
                          ? "border-white/40 bg-white/30"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span
                        className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all ${
                          field.value === "live" ? "left-4.5 bg-white" : "left-0.5 bg-white/40"
                        }`}
                      />
                    </button>
                  </div>
                )}
              />
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-white px-4 flex items-center justify-center h-10 cursor-pointer gap-1 text-xs font-semibold text-background hover:bg-white/90 sm:h-8 sm:w-auto"
              >
                {loading && <Loader className="animate-spin size-4" />}
                Save popup
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
