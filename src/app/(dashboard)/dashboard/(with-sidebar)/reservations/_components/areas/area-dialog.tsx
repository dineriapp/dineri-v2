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
import { ReservationAreaWithTables } from "@/drizzle/types";
import {
  useCreateReservationArea,
  useUpdateReservationArea,
} from "@/lib/tanstack-react-query/hooks/reservation-areas";
import {
  reservationAreaSchema,
  ReservationAreaSchemaType,
} from "@/lib/validators/zod/reservation-area.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, MapPin } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

const COLOR_OPTIONS = [
  { value: "white", label: "Lime" },
  { value: "info", label: "Blue" },
  { value: "warning", label: "Amber" },
  { value: "danger", label: "Red" },
  { value: "success", label: "Green" },
];

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: ReservationAreaWithTables;
  setOpen?: (open: boolean) => void;
};

export default function AreaDialog({ children, open, editingRow, setOpen }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createAreaMutation = useCreateReservationArea();
  const updateAreaMutation = useUpdateReservationArea();
  const loading = createAreaMutation.isPending || updateAreaMutation.isPending;

  const form = useForm<ReservationAreaSchemaType>({
    resolver: zodResolver(reservationAreaSchema),
    defaultValues: {
      name: editingRow?.name ?? "",
      description: editingRow?.description ?? "",
      color: editingRow?.color ?? "white",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: ReservationAreaSchemaType) => {
    if (editingRow?.id) {
      await updateAreaMutation.mutateAsync(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Area updated");
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
      await createAreaMutation.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Area created");
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

  useEffect(() => {
    if (editingRow) {
      form.reset({
        name: editingRow.name,
        description: editingRow.description ?? "",
        color: editingRow.color,
      });
    } else {
      form.reset({ name: "", description: "", color: "white" });
    }
  }, [editingRow, form]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Add or Edit Area</DialogTitle>
          <DialogDescription>
            Group tables into a service zone, like a main hall or terrace.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="mt-4 space-y-3">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Name <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. Main Hall"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="color"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Color *
                    </FieldLabel>
                    <div className="flex items-center gap-2 relative">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background">
                        <MapPin className={`h-4 w-4 text-${field.value}`} />
                      </div>
                      <div className="w-full">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="bg-background rounded-md w-full h-10!">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-border/60 bg-popover">
                            {COLOR_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Description
                    </FieldLabel>
                    <textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                      className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-white/20 resize-none"
                      placeholder="What makes this area special?"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
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
                Save area
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
