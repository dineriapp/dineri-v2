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
import { Switch } from "@/components/ui/switch";
import { MenuCategoryType } from "@/drizzle/types";
import {
  useCreateMenuCategory,
  useUpdateMenuCategory,
} from "@/lib/tanstack-react-query/hooks/menu";
import { menuCategorySchema, MenuCategorySchemaType } from "@/lib/validators/zod/menu-scheam";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: MenuCategoryType;
  setOpen?: (open: boolean) => void;
};

const CategoryDialog = ({ children, open, editingRow, setOpen }: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { mutateAsync: createCategory, isPending } = useCreateMenuCategory();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateMenuCategory();

  const loading = isPending || isUpdating;
  const form = useForm<MenuCategorySchemaType>({
    resolver: zodResolver(menuCategorySchema),
    defaultValues: {
      sort_order: editingRow?.sort_order ?? 0,
      name: editingRow?.name ?? "",
      show_on_public_page: editingRow?.show_on_public_page ?? false,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: MenuCategorySchemaType) => {
    if (editingRow?.id) {
      await updateCategory(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Category updated");
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
      await createCategory(data, {
        onSuccess: () => {
          toast.success("Category created");
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
        show_on_public_page: editingRow.show_on_public_page,
        sort_order: editingRow.sort_order,
      });
    } else {
      form.reset({
        name: "",
        show_on_public_page: false,
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

      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
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
                      Category Name <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. Appetizers, Main Courses, Desserts"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="show_on_public_page"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="rounded-xl border border-white/10 bg-surface-1 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <FieldLabel className="text-sm font-medium">Public visibility</FieldLabel>

                        <p className="text-xs text-muted-foreground">
                          Customers can see this category.
                        </p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                    </div>

                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="mt-2 text-sm text-red-500"
                      />
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
};

export default CategoryDialog;
