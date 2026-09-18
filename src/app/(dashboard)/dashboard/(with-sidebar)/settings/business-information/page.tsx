"use client";
import { venueDisplayUrl } from "@/lib/venue-url";
import { MultiImageUploader } from "@/components/shared/image-uploader";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { checkRestaurantSlug } from "@/lib/server/func/check-restaurant-slug";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Copy, Globe, ShieldCheck, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import slugify from "slugify";
import { toast } from "sonner";
import { StickySaveBar } from "../_components/sticky-save";
import { updateRestaurantBusinessInfoAction } from "./actions";
import { BusinessInformationSchema, BusinessInformationSchemaValues } from "./schema";

const Page = () => {
  const restaurant = useSelectedRestaurant();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const slugEditedRef = useRef(false);
  const originalSlug = restaurant.slug;
  const originalName = restaurant.name;
  const originalBio = restaurant.bio ?? "";
  const originalT = restaurant.tagline ?? "";
  const originalLogo = restaurant?.logo ?? null;

  const form = useForm<BusinessInformationSchemaValues>({
    resolver: zodResolver(BusinessInformationSchema),
    defaultValues: {
      name: restaurant?.name ?? "",
      slug: restaurant?.slug ?? "",
      bio: restaurant?.bio ?? "",
      tagline: restaurant?.tagline ?? "",
      logo: restaurant?.logo ? [restaurant?.logo] : [],
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleSubmit = async (data: BusinessInformationSchemaValues) => {
    // only check when changed
    if (data.slug !== originalSlug) {
      const response = await checkRestaurantSlug(data.slug);

      if (response.rateLimited) {
        toast.error("Too many checks. Please wait a moment and try again.");

        return;
      }

      if (response.exists) {
        toast.error("This restaurant URL is already taken");

        return;
      }
    }

    const response = await updateRestaurantBusinessInfoAction(data);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    updateSelectedRestaurant({
      name: response.data.name,
      slug: response.data.slug,
      bio: response.data.bio,
      tagline: response.data.tagline,
      logo: response.data.logo,
    });
    form.reset({
      name: response.data.name,
      slug: response.data.slug,
      bio: response.data.bio ?? "",
      tagline: response.data.tagline ?? "",
      logo: response.data.logo ? [response.data.logo] : [],
    });
    toast.success("Business Information updated successfully");
  };

  const values = useWatch({
    control: form.control,
  });

  const isDirty =
    values.slug !== originalSlug ||
    values.name !== originalName ||
    values.tagline !== originalT ||
    values.bio !== originalBio ||
    values?.logo?.[0]?.key !== originalLogo?.key;

  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6"
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 ">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Business Information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your venue&apos;s basic information and branding
            </p>
          </div>
        </div>
        <span className="font-jetbrains-mono uppercase inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-background px-2.5 py-1 text-[9px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 shrink-0 text-white" /> Auto-saved & encrypted
        </span>
      </header>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  Restaurant Name *
                </FieldLabel>
                <div className="flex items-center relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!slugEditedRef.current) {
                        form.setValue(
                          "slug",
                          slugify(e.target.value, {
                            lower: true,
                            strict: true,
                            trim: true,
                          }),
                        );
                      }
                    }}
                    className="h-9 rounded-lg w-full pl-10"
                    placeholder="Trattoria Milano"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  Shown on your public page and receipts.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />
          <Controller
            name="slug"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel className="font-jetbrains-mono uppercase  text-[10px] text-muted-foreground">
                  Page URL *
                </FieldLabel>
                <div className="flex items-stretch overflow-hidden rounded-lg border border-white/10 bg-background focus-within:border-white/50">
                  <span className="flex items-center gap-2 border-r border-white/10 px-3 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" /> {venueDisplayUrl("")}
                  </span>
                  <Input
                    {...field}
                    onChange={(e) => {
                      slugEditedRef.current = true;
                      field.onChange(e.target.value.toLowerCase());
                    }}
                    className="h-9 rounded-lg w-full border-none bg-transparent rounded-l-none!"
                    placeholder="Trattoria Milano"
                    aria-invalid={fieldState.invalid}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      toast("Copied!");
                    }}
                    className="border-l border-white/10 px-3 text-muted-foreground hover:text-white"
                    title="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  Lowercase letters, numbers and hyphens only.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />
          <Controller
            name="bio"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel className="font-jetbrains-mono uppercase  text-[10px] text-muted-foreground">
                  Bio
                </FieldLabel>
                <Textarea
                  {...field}
                  className=" rounded-lg w-full"
                  placeholder="Trattoria Milano"
                  aria-invalid={fieldState.invalid}
                />
                <div className="flex items-start justify-between">
                  <p className="text-[11px] text-muted-foreground/80">
                    Optional: short description shown on your public page.
                  </p>
                  <div className="mt-1.5 flex items-center justify-end">
                    <span className="font-mono text-[10px] text-muted-foreground">10/200</span>
                  </div>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />
          <Controller
            name="tagline"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2">
                <FieldLabel className="font-jetbrains-mono uppercase  text-[10px] text-muted-foreground">
                  Tagline
                </FieldLabel>
                <Textarea
                  {...field}
                  className=" rounded-lg w-full"
                  placeholder="Tagline"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                )}
              </Field>
            )}
          />
          <Controller
            name="logo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-0! w-full">
                <FieldLabel className="block text-[10px] tracking-[0.07em] uppercase text-[#747474] font-medium mb-1.5">
                  Logo
                </FieldLabel>
                <MultiImageUploader
                  value={field.value ?? []}
                  onChange={field.onChange}
                  gridClassName="grid-cols-1 gap-3"
                  PreviewItemClassName="aspect-square! rounded-md"
                  maxFiles={1}
                  className="w-full max-w-50"
                  triggerClassName="w-full max-w-50"
                  showLimit={false}
                  onUploadingChange={setIsUploadingImage}
                >
                  <div className="aspect-square cursor-pointer w-full flex items-center justify-center flex-col">
                    <UploadCloud />
                    <div className="text-sm text-center">Logo preview</div>
                    <div className="text-center text-xs mt-0.5">512×512</div>
                  </div>
                </MultiImageUploader>
                <p className="text-[11px] mt-2 text-muted-foreground/80">
                  Square image works best. Shown on your public page and receipts.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-500 text-[11px]" />
                )}
              </Field>
            )}
          />
          <StickySaveBar
            dirty={isDirty}
            loading={form.formState.isSubmitting}
            disabled={isUploadingImage}
            onDiscard={() => form.reset()}
          />
        </form>
      </FormProvider>
    </section>
  );
};

export default Page;
