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
import { Switch } from "@/components/ui/switch";
import { ReservationAreaWithTables, ReservationTableType } from "@/drizzle/types";
import {
  useCreateReservationTable,
  useUpdateReservationTable,
} from "@/lib/tanstack-react-query/hooks/reservation-tables";
import {
  reservationTableSchema,
  ReservationTableSchemaType,
} from "@/lib/validators/zod/reservation-table.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: ReservationTableType;
  areas: ReservationAreaWithTables[];
  defaultAreaId?: string;
  setOpen?: (open: boolean) => void;
};

export default function TableDialog({
  children,
  open,
  editingRow,
  areas,
  defaultAreaId,
  setOpen,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createTableMutation = useCreateReservationTable();
  const updateTableMutation = useUpdateReservationTable();
  const loading = createTableMutation.isPending || updateTableMutation.isPending;

  const form = useForm<ReservationTableSchemaType>({
    resolver: zodResolver(reservationTableSchema),
    defaultValues: {
      label: editingRow?.label ?? "",
      seats: editingRow?.seats ?? 2,
      areaId: editingRow?.areaId ?? defaultAreaId ?? areas[0]?.id ?? "",
      active: editingRow?.active ?? true,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: ReservationTableSchemaType) => {
    if (editingRow?.id) {
      await updateTableMutation.mutateAsync(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Table updated");
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
      await createTableMutation.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Table created");
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
        label: editingRow.label,
        seats: editingRow.seats,
        areaId: editingRow.areaId,
        active: editingRow.active,
      });
    } else {
      form.reset({
        label: "",
        seats: 2,
        areaId: defaultAreaId ?? areas[0]?.id ?? "",
        active: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingRow, defaultAreaId, form]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Add or Edit Table</DialogTitle>
          <DialogDescription>
            Add a table to an area, set its seat count, and mark it active or inactive.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="mt-4 space-y-3">
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
                      placeholder="e.g. T-01"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="seats"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Seats <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="areaId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Area <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background rounded-md w-full h-10!">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border/60 bg-popover">
                        {areas.map((a) => (
                          <SelectItem key={a.id} value={a.id} className="text-xs">
                            {a.name}
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
                name="active"
                control={form.control}
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="items-center justify-between rounded-lg border border-white/10 bg-background px-3 py-2.5"
                  >
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Active
                    </FieldLabel>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                Save table
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
