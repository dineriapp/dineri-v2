"use client";

import { ReactNode, useEffect, useState } from "react";

import { MultiImageUploader } from "@/components/shared/image-uploader";
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
import { Textarea } from "@/components/ui/textarea";
import { SuccessStoryType } from "@/drizzle/types";
import {
  successStorySchema,
  SuccessStorySchemaType,
} from "@/lib/validators/zod/success-story.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, Upload } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  useCreateSuccessStory,
  useUpdateSuccessStory,
} from "@/lib/tanstack-react-query/hooks/success-stories";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: SuccessStoryType;
  setOpen?: (open: boolean) => void;
};

const SuccessStoryDialog = ({ children, open, editingRow, setOpen }: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const createStory = useCreateSuccessStory();
  const updateStory = useUpdateSuccessStory();

  const loading = createStory.isPending || updateStory.isPending;
  const form = useForm<SuccessStorySchemaType>({
    resolver: zodResolver(successStorySchema),
    defaultValues: {
      image: editingRow?.image ? [editingRow?.image] : [],
      sort_order: editingRow?.sort_order ?? 0,
      active: editingRow?.active ?? true,
      body: editingRow?.body ?? "",
      title: editingRow?.title ?? "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: SuccessStorySchemaType) => {
    if (editingRow?.id) {
      await updateStory.mutateAsync(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Story updated");
            setOpen?.(false);
            setInternalOpen(false);
            form.reset();
          },
          onError: (err) => {
            toast.error(err.message ?? "something went wrong!");
          },
        },
      );
    } else {
      await createStory.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Story created");
          setOpen?.(false);
          setInternalOpen(false);
          form.reset();
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
        image: editingRow?.image ? [editingRow?.image] : [],
        sort_order: editingRow?.sort_order ?? 0,
        active: editingRow?.active ?? true,
        body: editingRow?.body ?? "",
        title: editingRow?.title ?? "",
      });
    } else {
      form.reset({
        image: [],
        sort_order: 0,
        active: true,
        body: "",
        title: "",
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
          <DialogTitle>{editingRow ? "Edit success story" : "Add success story"}</DialogTitle>
          <DialogDescription className="text-xs!">
            A cover photo, a title and the story itself.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-3 px-1 max-h-[70vh] overflow-y-auto overflow-x-visible scrollbar-dark">
              <Controller
                name="image"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2! w-full">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Image <span className="text-red-500">*</span>
                    </FieldLabel>
                    <MultiImageUploader
                      value={field.value ?? []}
                      onChange={field.onChange}
                      gridClassName="grid-cols-1 gap-3"
                      PreviewItemClassName="aspect-video rounded-md"
                      maxFiles={1}
                      className="w-full"
                      triggerClassName="w-full border border-dashed hover:border-white/40 hover:bg-white/5"
                      showLimit={false}
                      onUploadingChange={setIsUploadingImage}
                    >
                      <div className="aspect-video  cursor-pointer w-full flex items-center justify-center flex-col">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-surface-2 text-muted-foreground group-hover:text-white">
                          <Upload className="h-4 w-4" />
                        </div>
                        <div className="text-sm font-medium">Upload a cover photo</div>
                        <div className="text-[11px] text-muted-foreground">
                          PNG / JPG up to 4 MB · 16:9 looks best
                        </div>
                      </div>
                    </MultiImageUploader>
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
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2 ">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Title <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="e.g. From 12 to 80 covers a night"
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
                  <Field data-invalid={fieldState.invalid} className="gap-2 ">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Story <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className=" rounded-lg w-full max-h-40 min-h-30 scrollbar-dark text-base sm:text-sm"
                      placeholder="Tell the story in a paragraph. What changed? What was the result?"
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
              <Controller
                name="active"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="rounded-xl border border-white/10 bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <FieldLabel className="text-sm font-medium">Active</FieldLabel>
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
                disabled={loading || isUploadingImage}
                className="w-full rounded-lg bg-white px-4 flex items-center justify-center h-10 cursor-pointer gap-1 text-xs font-semibold text-background hover:bg-white/90 sm:h-8 sm:w-auto"
              >
                {loading && <Loader className="animate-spin size-4" />}
                Save story
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessStoryDialog;
