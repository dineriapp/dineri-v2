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
import { GalleryType } from "@/drizzle/types";
import {
  useCreateGalleryItem,
  useUpdateGalleryItem,
} from "@/lib/tanstack-react-query/hooks/gallery";
import { gallerySchema, GallerySchemaType } from "@/lib/validators/zod/gallery.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader, UploadCloud, VideoIcon } from "lucide-react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: GalleryType;
  setOpen?: (open: boolean) => void;
};

const GalleryDialog = ({ children, open, editingRow, setOpen }: Props) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const createGalleryItem = useCreateGalleryItem();
  const updateGalleryItem = useUpdateGalleryItem();

  const loading = createGalleryItem.isPending || updateGalleryItem.isPending;
  const form = useForm<GallerySchemaType>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      type: "image",
      active: true,
      image: [],
      sort_order: 0,
      title: "",
      youtube_poster: "",
      youtube_url: "",
      link_url: undefined,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const type = useWatch({
    control: form.control,
    name: "type",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: GallerySchemaType) => {
    if (editingRow?.id) {
      await updateGalleryItem.mutateAsync(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Gallery item updated");
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
      createGalleryItem.mutate(data, {
        onSuccess: () => {
          toast.success("Gallery item added");
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
        type: editingRow?.type ?? "image",
        active: editingRow?.active ?? true,
        image: editingRow?.image ? [editingRow.image] : [],
        sort_order: editingRow?.sort_order ?? 0,
        title: editingRow?.title ?? "",
        youtube_poster: editingRow?.youtube_poster ?? "",
        youtube_url: editingRow?.youtube_url ?? "",
        link_url: editingRow?.link_url ?? undefined,
      });
    } else {
      form.reset({
        type: "image",
        active: true,
        image: [],
        sort_order: 0,
        title: "",
        youtube_poster: "",
        youtube_url: "",
        link_url: undefined,
      });
    }
  }, [editingRow, form, open]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-xl!">
        <DialogHeader className="px-1">
          <DialogTitle>{editingRow ? "Edit gallery item" : "Add to gallery"}</DialogTitle>
          <DialogDescription>
            Upload an image or video, add a title and short caption.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-3 px-1 max-h-[70vh] overflow-y-auto overflow-x-visible scrollbar-dark pb-1">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-background p-1">
                {(["image", "video"] as const).map((t) => {
                  const Icon = t === "image" ? ImageIcon : VideoIcon;
                  const on = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        form.setValue("type", t);
                      }}
                      type="button"
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs capitalize transition ${
                        on
                          ? "bg-white text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {t}
                    </button>
                  );
                })}
              </div>
              {type === "image" && (
                <>
                  <Controller
                    name="image"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2! w-full">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          Image <span className="text-danger">*</span>
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

                        <p className="text-[11px] mt-2 text-muted-foreground/80">
                          Square image works best.
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
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2 col-span-2">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          Title (caption) <span className="text-danger">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-lg w-full text-base sm:text-sm"
                          placeholder="e.g. Summer special, Chef’s signature, etc."
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
                    name="link_url"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          URL (optional)
                        </FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-lg w-full text-base sm:text-sm"
                          placeholder="https://… (where this image links to)"
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
                </>
              )}
              {type === "video" && (
                <>
                  <Controller
                    name="youtube_url"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          YouTube URL <span className="text-danger">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-lg w-full text-base sm:text-sm"
                          placeholder="https://youtube.com/watch?v=… or https://youtu.be/…"
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
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2 col-span-2">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          Title <span className="text-danger">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          className="h-10 rounded-lg w-full text-base sm:text-sm"
                          placeholder="e.g. Summer special, Chef’s signature, etc."
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
                    name="image"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="gap-2! w-full">
                        <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                          Poster / thumbnail (optional)
                        </FieldLabel>
                        <div className="flex items-start gap-3">
                          <MultiImageUploader
                            value={field.value ?? []}
                            onChange={field.onChange}
                            gridClassName="grid-cols-1 gap-3"
                            PreviewItemClassName="aspect-video! rounded-md"
                            maxFiles={1}
                            className="w-full max-w-70 border border-white/10"
                            triggerClassName="w-full max-w-70"
                            showLimit={false}
                            onUploadingChange={setIsUploadingImage}
                          >
                            <div className="aspect-video cursor-pointer w-full flex items-center justify-center flex-col">
                              <UploadCloud />
                              <div className="text-center text-xs mt-0.5">16/9</div>
                            </div>
                          </MultiImageUploader>
                        </div>
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="text-red-500 text-[11px]"
                          />
                        )}
                      </Field>
                    )}
                  />
                </>
              )}
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

export default GalleryDialog;
