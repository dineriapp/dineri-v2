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
import { LinkType } from "@/drizzle/types";
import {
  useCreateRestaurantLink,
  useUpdateRestaurantLink,
} from "@/lib/tanstack-react-query/hooks/links";
import { IconKey } from "@/lib/types/links";
import { linkSchema, LinkSchemaType } from "@/lib/validators/zod/link.schema";
import { ICON_OPTIONS, ICON_REGISTRY } from "@/utils/links";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon, Loader } from "lucide-react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: LinkType;
  setOpen?: (open: boolean) => void;
};

export default function LinkDialog({ children, open, editingRow, setOpen }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createLinkMutation = useCreateRestaurantLink();
  const updateLinkMutation = useUpdateRestaurantLink();
  const loading = createLinkMutation.isPending || updateLinkMutation.isPending;
  const form = useForm<LinkSchemaType>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: editingRow?.title ?? "",
      url: editingRow?.url ?? "",
      icon_key: editingRow?.icon_key ?? "link",
      active: editingRow?.active ?? true,
      sort_order: editingRow?.sort_order ?? 0,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const icon_key = useWatch({
    control: form.control,
    name: "icon_key",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const PreviewIcon = ICON_REGISTRY[icon_key as IconKey]?.Icon ?? LinkIcon;

  const handleSave = async (data: LinkSchemaType) => {
    if (editingRow?.id) {
      await updateLinkMutation.mutateAsync(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Link updated");
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
      await createLinkMutation.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Link created");
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
        title: editingRow.title,
        url: editingRow.url,
        icon_key: editingRow.icon_key,
        active: editingRow.active,
        sort_order: editingRow.sort_order,
      });
    } else {
      form.reset({
        title: "",
        url: "",
        icon_key: "link",
        active: true,
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
          <DialogTitle>Add or Edit Link</DialogTitle>

          <DialogDescription>
            Add a new link to your restaurant profile. You can use links for ordering, reservations,
            menus, social media, or other important destinations.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="mt-4 space-y-3">
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
                      placeholder="e.g. Enter title for your link"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="url"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      URL <span className="text-red-500">*</span>
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
              <Controller
                name="icon_key"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Icon *
                    </FieldLabel>
                    <div className="flex items-center gap-2 relative">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background">
                        <PreviewIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="w-full">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="bg-background rounded-md w-full h-10!">
                            <SelectValue placeholder={"Select icon"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-border/60 bg-popover">
                            {ICON_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value} className="text-xs">
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Pick the icon that best matches this link&apos;s purpose.
                    </p>
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
                type={"submit"}
                disabled={loading}
                className="w-full rounded-lg bg-white px-4 flex items-center justify-center h-10 cursor-pointer gap-1 text-xs font-semibold text-background hover:bg-white/90 sm:h-8 sm:w-auto"
              >
                {loading && <Loader className="animate-spin size-4" />}
                Save link
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
