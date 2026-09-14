"use client";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Mail, Phone } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { StickySaveBar } from "../_components/sticky-save";
import { updateRestaurantContactInfoAction } from "./actions";
import { ContactInformationSchema, ContactInformationSchemaValues } from "./schema";

const Page = () => {
  const restaurant = useSelectedRestaurant();

  const form = useForm<ContactInformationSchemaValues>({
    resolver: zodResolver(ContactInformationSchema),
    defaultValues: {
      address: restaurant?.address ?? "",
      email: restaurant?.email ?? "",
      phone: restaurant?.phone ?? "",
      website: restaurant?.website ?? "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleSubmit = async (data: ContactInformationSchemaValues) => {
    const response = await updateRestaurantContactInfoAction(data);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    updateSelectedRestaurant({
      address: response.data.address,
      email: response.data.email,
      phone: response.data.phone,
      website: response.data.website,
    });
    form.reset({
      address: response.data.address ?? undefined,
      email: response.data.email ?? undefined,
      phone: response.data.phone ?? undefined,
      website: response.data.website ?? undefined,
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
            <Phone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Contact Information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Email, phone and address</p>
          </div>
        </div>
      </header>
      <div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                    Email *
                  </FieldLabel>
                  <div className="flex items-center relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                    <Input
                      {...field}
                      className="h-9 rounded-lg w-full pl-10"
                      placeholder="contact@example.com"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                  )}
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                    Phone
                  </FieldLabel>
                  <div className="flex items-center relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                    <Input
                      {...field}
                      className="h-9 rounded-lg w-full pl-10"
                      placeholder="+1 (555) 123-4567"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                  )}
                </Field>
              )}
            />
            <div className="sm:col-span-2">
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Address
                    </FieldLabel>
                    <div className="flex items-center relative">
                      <Input
                        {...field}
                        className="h-9 rounded-lg w-full"
                        placeholder="123 Main Street, New York, NY 10001"
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <Controller
                name="website"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Website
                    </FieldLabel>
                    <div className="flex items-center relative">
                      <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                      <Input
                        {...field}
                        className="h-9 rounded-lg w-full pl-10"
                        placeholder="https://www.example.com"
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <StickySaveBar
                dirty={form.formState.isDirty}
                loading={form.formState.isSubmitting}
                disabled={form.formState.isSubmitting}
                onDiscard={() => form.reset()}
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </section>
  );
};

export default Page;
