"use client";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Phone, Share2 } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { toast } from "sonner";
import { Callout } from "../_components/callout";
import { StickySaveBar } from "../_components/sticky-save";
import { updateRestaurantSocialLinksAction } from "./actions";
import { SocialLinksSchema, SocialLinksSchemaValues } from "./schema";

const Page = () => {
  const restaurant = useSelectedRestaurant();

  const form = useForm<SocialLinksSchemaValues>({
    resolver: zodResolver(SocialLinksSchema),
    defaultValues: {
      instagram: restaurant?.instagram ?? "",
      facebook: restaurant?.facebook ?? "",
      tiktok: restaurant?.tiktok ?? "",
      x_twitter: restaurant?.x_twitter ?? "",
      youtube: restaurant?.youtube ?? "",
      linkedin: restaurant?.linkedin ?? "",
      whatsapp: restaurant?.whatsapp ?? "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleSubmit = async (data: SocialLinksSchemaValues) => {
    const response = await updateRestaurantSocialLinksAction(data);

    if (!response.success) {
      toast.error(response.error);
      return;
    }
    updateSelectedRestaurant({
      instagram: response.data.instagram ?? "",
      facebook: response.data.facebook ?? "",
      tiktok: response.data.tiktok ?? "",
      x_twitter: response.data.x_twitter ?? "",
      youtube: response.data.youtube ?? "",
      linkedin: response.data.linkedin ?? "",
      whatsapp: response.data.whatsapp ?? "",
    });
    form.reset({
      instagram: response.data.instagram ?? "",
      facebook: response.data.facebook ?? "",
      tiktok: response.data.tiktok ?? "",
      x_twitter: response.data.x_twitter ?? "",
      youtube: response.data.youtube ?? "",
      linkedin: response.data.linkedin ?? "",
      whatsapp: response.data.whatsapp ?? "",
    });
    toast.success("Contact Information updated successfully");
  };

  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6"
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Social Media
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Link your public profiles</p>
          </div>
        </div>
      </header>
      <div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <Callout tone="info">
              Link your public profiles so guests can find and follow your venue. Add your @handle
              or paste a full profile URL.
            </Callout>
            {(() => {
              const platforms = [
                {
                  k: "instagram" as const,
                  label: "Instagram",
                  brand: "from-fuchsia-500 via-pink-500 to-amber-400",
                  Icon: FaInstagram,
                  IconInput: AtSign,
                  placeholder: "Add your @handle or profile URL",
                  domain: "instagram.com/",
                },
                {
                  k: "facebook" as const,
                  label: "Facebook",
                  brand: "from-blue-600 to-blue-500",
                  Icon: FaFacebook,
                  IconInput: AtSign,
                  placeholder: "Add your @handle or profile URL",
                  domain: "facebook.com/",
                },
                {
                  k: "tiktok" as const,
                  label: "TikTok",
                  brand: "from-zinc-900 to-zinc-700",
                  Icon: FaTiktok,
                  IconInput: AtSign,
                  placeholder: "Add your @handle or profile URL",
                  domain: "tiktok.com/@",
                },
                {
                  k: "x_twitter" as const,
                  label: "X (Twitter)",
                  brand: "from-zinc-800 to-zinc-600",
                  Icon: FaTwitter,
                  IconInput: AtSign,
                  placeholder: "Add your @handle or profile URL",
                  domain: "x.com/",
                },
                {
                  k: "youtube" as const,
                  label: "YouTube",
                  brand: "from-red-600 to-red-500",
                  Icon: FaYoutube,
                  IconInput: AtSign,
                  placeholder: "Add your @handle or profile URL",
                  domain: "youtube.com/@",
                },
                {
                  k: "linkedin" as const,
                  label: "LinkedIn",
                  brand: "from-sky-700 to-sky-500",
                  Icon: FaLinkedin,
                  IconInput: AtSign,
                  placeholder: "Add your @handle or profile URL",
                  domain: "linkedin.com/company/",
                },
                {
                  // A phone number, so it takes a dialling prefix rather than
                  // the @-handle affordance every other platform uses.
                  k: "whatsapp" as const,
                  label: "WhatsApp",
                  brand: "from-emerald-600 to-green-500",
                  Icon: FaWhatsapp,
                  IconInput: Phone,
                  placeholder: "+92 300 1234567",
                  domain: "wa.me/",
                },
              ];
              return (
                <div className="grid gap-4 sm:grid-cols-2">
                  {platforms.map(({ k, label, brand, Icon, placeholder, IconInput, domain }) => {
                    const connected = restaurant?.[k];
                    return (
                      <div
                        key={k}
                        className="group rounded-xl border border-white/10 bg-background/40 p-4 transition-colors hover:border-white/20"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${brand} text-white shadow-sm`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium leading-tight">{label}</div>
                              <div className="truncate text-[11px] text-muted-foreground">
                                {domain}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${connected ? "bg-white/15 text-white" : "bg-white/5 text-muted-foreground"}`}
                          >
                            {connected ? "Linked" : "Not set"}
                          </span>
                        </div>
                        <Controller
                          name={k}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="gap-2">
                              <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                                {label}
                              </FieldLabel>
                              <div className="flex items-center relative">
                                <IconInput className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                                <Input
                                  {...field}
                                  className="h-9 rounded-lg w-full pl-10"
                                  placeholder={placeholder}
                                  aria-invalid={fieldState.invalid}
                                />
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
                    );
                  })}
                </div>
              );
            })()}
            <StickySaveBar
              dirty={form.formState.isDirty}
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting}
              onDiscard={() => form.reset()}
            />
          </form>
        </FormProvider>
      </div>
    </section>
  );
};

export default Page;
