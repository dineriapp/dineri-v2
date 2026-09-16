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
import { QRCodeType } from "@/drizzle/types";
import { useCreateQRCode, useUpdateQRCode } from "@/lib/tanstack-react-query/hooks/qr-code";
import { qrCodeSchema, QRCodeSchemaType } from "@/lib/validators/zod/qr-code.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { QRPreview } from "./qr-preview";
import { venueUrl } from "@/lib/venue-url";
import { useSelectedRestaurant } from "@/stores/restaurant-store";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: QRCodeType;
  setOpen?: (open: boolean) => void;
};

export default function QrDialog({ children, open, editingRow, setOpen }: Props) {
  const restaurant = useSelectedRestaurant();
  // Where most codes should point. Shown as the hint so a merchant copies the
  // venue host, not a platform URL that would cost the guest a redirect.
  const venueHomeUrl = restaurant?.slug ? venueUrl(restaurant.slug) : "https://…";
  const [internalOpen, setInternalOpen] = useState(false);
  const createMutation = useCreateQRCode();
  const updateMutation = useUpdateQRCode();
  const loading = createMutation.isPending || updateMutation.isPending;
  const form = useForm<QRCodeSchemaType>({
    resolver: zodResolver(qrCodeSchema),
    defaultValues: {
      label: editingRow?.label ?? "",
      targetUrl: editingRow?.targetUrl ?? "",
      foregroundColor: editingRow?.foregroundColor ?? "#0F1115",
      backgroundColor: editingRow?.backgroundColor ?? "#FFFFFF",
      shape: editingRow?.shape ?? "dots",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: QRCodeSchemaType) => {
    if (editingRow?.id) {
      await updateMutation.mutateAsync(
        { qrId: editingRow.id, input: data },
        {
          onSuccess: () => {
            toast.success("QR Code updated");
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
      await createMutation.mutateAsync(data, {
        onSuccess: () => {
          toast.success("QR Code created");
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

  const values = useWatch({
    control: form.control,
  });

  useEffect(() => {
    if (editingRow) {
      form.reset({
        label: editingRow?.label ?? "",
        targetUrl: editingRow?.targetUrl ?? "",
        foregroundColor: editingRow?.foregroundColor ?? "#0F1115",
        backgroundColor: editingRow?.backgroundColor ?? "#FFFFFF",
        shape: editingRow?.shape ?? "dots",
      });
    } else {
      form.reset({
        label: "",
        targetUrl: "",
        foregroundColor: "#0F1115",
        backgroundColor: "#FFFFFF",
        shape: "dots",
      });
    }
  }, [editingRow, form]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-xl!">
        <DialogHeader className="px-1">
          <DialogTitle>{editingRow ? "Edit QR Code" : "Add QR Code"}</DialogTitle>
          <DialogDescription>Label, colors, target etc.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-3 px-1 max-h-[70vh] overflow-y-auto overflow-x-visible scrollbar-dark">
              <div className="grid md:grid-cols-[auto_1fr] gap-3 md:gap-4">
                <div className="rounded-xl border border-white/10 p-3 h-fit max-md:w-fit">
                  <QRPreview
                    qr={{
                      backgroundColor: values.backgroundColor ?? "#FFFFFF",
                      foregroundColor: values.foregroundColor ?? "#0F1115",
                      label: values.label ?? "",
                      shape: values.shape ?? "dots",
                      targetUrl: values.targetUrl ?? "",
                    }}
                    size={140}
                  />
                </div>
                <div className="space-y-3">
                  <Controller
                    name="label"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          Label <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          className="h-10 rounded-lg w-full text-base sm:text-sm"
                          placeholder="e.g. Table tent"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="text-red-500 text-sm"
                          />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="targetUrl"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          Target URL <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          className="h-10 rounded-lg w-full text-base sm:text-sm"
                          placeholder={venueHomeUrl}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="text-red-500 text-sm"
                          />
                        )}
                      </Field>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name="foregroundColor"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="gap-2">
                          <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                            Foreground <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input
                            {...field}
                            type="color"
                            className="h-10 rounded-none w-full p-0!"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError
                              errors={[fieldState.error]}
                              className="text-red-500 text-sm"
                            />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="backgroundColor"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="gap-2">
                          <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                            Background <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input
                            {...field}
                            type="color"
                            className="h-10 rounded-none w-full p-0!"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError
                              errors={[fieldState.error]}
                              className="text-red-500 text-sm"
                            />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  <Controller
                    name="shape"
                    control={form.control}
                    render={({ fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          Style *
                        </FieldLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {(["square", "dots"] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                form.setValue("shape", s);
                              }}
                              className={`rounded-lg border px-3 py-2 text-xs capitalize transition ${
                                values.shape === s
                                  ? "border-white/40 bg-white/10 text-white"
                                  : "border-white/10 hover:border-white/20"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="text-red-500 text-sm"
                          />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>
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
                type={"submit"}
                disabled={loading}
                className="w-full rounded-lg bg-white px-4 flex items-center justify-center h-10 cursor-pointer gap-1 text-xs font-semibold text-background hover:bg-white/90 sm:h-8 sm:w-auto"
              >
                {loading && <Loader className="animate-spin size-4" />}
                Save
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
