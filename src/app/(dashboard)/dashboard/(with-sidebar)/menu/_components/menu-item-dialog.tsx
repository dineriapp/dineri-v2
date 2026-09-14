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
import { MenuItemType } from "@/drizzle/types";
import { toTagKeys } from "@/utils/tags";
import { menuItemSchema, MenuItemSchemaType } from "@/lib/validators/zod/menu-scheam";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, UploadCloud } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { MultiImageUploader } from "@/components/shared/image-uploader";
import { NumberInput } from "@/components/ui/input-number";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Addons from "./addons";
import Tags from "./tags";
import { useCreateMenuItem, useUpdateMenuItem } from "@/lib/tanstack-react-query/hooks/menu";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type Props = {
  children?: ReactNode;
  open?: boolean;
  categories: { id: string; name: string }[];
  categoryId?: string;
  editingRow?: MenuItemType;
  setOpen?: (open: boolean) => void;
};

const MenuItemDialog = ({ children, open, categoryId, categories, editingRow, setOpen }: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();

  const loading = createItem.isPending || updateItem.isPending;
  const form = useForm<MenuItemSchemaType>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      image: editingRow?.image ? [editingRow?.image] : [],
      emoji: editingRow?.emoji ?? "",
      name: editingRow?.name ?? "",
      price: Number(editingRow?.price) ?? 1,
      categoryId: editingRow?.categoryId ? editingRow?.categoryId : (categoryId ?? ""),

      description: editingRow?.description ?? "",
      addons: editingRow?.addons ?? [],
      customization_detail: editingRow?.customization_detail ?? "",
      show_on_public_page: editingRow?.show_on_public_page ?? false,
      sort_order: editingRow?.sort_order ?? 0,
      tags: toTagKeys(editingRow?.tags),
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: MenuItemSchemaType) => {
    if (editingRow?.id) {
      updateItem.mutate(
        { id: editingRow.id, data },
        {
          onSuccess: () => {
            toast.success("Item updated");
            setOpen?.(false);
            setInternalOpen(false);
            form.reset();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createItem.mutate(data, {
        onSuccess: () => {
          toast.success("Item added");
          setOpen?.(false);
          setInternalOpen(false);
          form.reset();
        },
        onError: (err) => {
          toast.error(err.message);
        },
      });
    }
  };

  useEffect(() => {
    if (editingRow) {
      form.reset({
        image: editingRow.image ? [editingRow?.image] : [],
        emoji: editingRow?.emoji ?? "",
        name: editingRow?.name ?? "",
        price: Number(editingRow?.price) ?? 1,
        categoryId: editingRow?.categoryId ? editingRow?.categoryId : "",
        description: editingRow?.description ?? "",
        addons: editingRow?.addons ?? [],
        customization_detail: editingRow?.customization_detail ?? "",
        show_on_public_page: editingRow?.show_on_public_page ?? false,
        sort_order: editingRow?.sort_order ?? 0,
        tags: toTagKeys(editingRow?.tags),
      });
    } else {
      form.reset({
        addons: [],
        categoryId: categoryId ?? "",
        customization_detail: "",
        description: "",
        emoji: "",
        image: [],
        name: "",
        price: 1,
        show_on_public_page: false,
        sort_order: 0,
        tags: [],
      });
    }
  }, [editingRow, form, categoryId]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-xl!">
        <DialogHeader className="px-1">
          <DialogTitle>{editingRow ? "Edit menu item" : "Add menu item"}</DialogTitle>
          <DialogDescription>Image, name, price, description, customization etc.</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-3 px-1 max-h-[70vh] overflow-y-auto overflow-x-visible scrollbar-dark">
              <Controller
                name="image"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0! w-full">
                    <FieldLabel className="block text-[10px] tracking-[0.07em] uppercase text-[#747474] font-medium mb-1.5">
                      Image <span className="normal-case opacity-70">(optional)</span>
                    </FieldLabel>
                    <div className="flex items-start gap-3">
                      <MultiImageUploader
                        value={field.value ?? []}
                        onChange={field.onChange}
                        gridClassName="grid-cols-1 gap-3"
                        PreviewItemClassName="aspect-square! rounded-md"
                        maxFiles={1}
                        className="w-full max-w-40 border border-white/10"
                        triggerClassName="w-full max-w-40"
                        showLimit={false}
                        onUploadingChange={setIsUploadingImage}
                      >
                        <div className="aspect-square cursor-pointer w-full flex items-center justify-center flex-col">
                          <UploadCloud />
                          <div className="text-center text-xs mt-0.5">512×512</div>
                        </div>
                      </MultiImageUploader>
                    </div>

                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      PNG / JPG up to 4 MB. Square works best.
                    </p>
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="text-red-500 text-[11px]"
                      />
                    )}
                  </Field>
                )}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2 sm:col-span-2">
                      <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                        Name <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        className="h-10 rounded-lg w-full text-base sm:text-sm"
                        placeholder="e.g. Pizza"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="price"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="gap-2">
                      <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                        price <span className="text-red-500">*</span>
                      </FieldLabel>
                      <NumberInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        placeholder="e.g. 10"
                        className="h-10 rounded-lg w-full text-base sm:text-sm"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0! w-full">
                    <FieldLabel className="block text-[10px] tracking-[0.07em] uppercase text-[#747474] font-medium mb-1.5">
                      category
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background rounded-md w-full h-10!">
                        <SelectValue placeholder={"Select Category"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border/60 bg-popover">
                        {categories?.map((o) => (
                          <SelectItem key={o.id} value={o.id} className="text-xs">
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Choose which category this item appears under (e.g. <em>Pizza</em>,{" "}
                      <em>Burgers</em>, <em>Starters</em>).
                    </p>
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="text-red-500 text-[11px]"
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2 col-span-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Description
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className=" rounded-lg w-full max-h-30 scrollbar-dark text-base sm:text-sm"
                      placeholder="Short, mouth-watering description…"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="customization_detail"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2 col-span-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Customization details
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className=" rounded-lg w-full max-h-30 scrollbar-dark text-base sm:text-sm"
                      placeholder="e.g. Choose pasta type, spice level, sides… anything customers should know."
                      aria-invalid={fieldState.invalid}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Free-text - shown to customers when they tap “Customize”.
                    </p>
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
                          Customers can see this item.
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
              <Addons />
              <Tags />
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 px-1 sm:flex-row sm:justify-end">
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
                disabled={loading || isUploadingImage}
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

export default MenuItemDialog;
