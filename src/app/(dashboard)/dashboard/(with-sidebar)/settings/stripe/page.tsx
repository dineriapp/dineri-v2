"use client";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { STRIPE_CURRENCIES } from "@/lib/stripe/types";
import {
  updateRestaurantStripeSecret,
  updateSelectedRestaurant,
  useSelectedRestaurant,
} from "@/stores/restaurant-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ExternalLink, Lock } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Callout } from "../_components/callout";
import { StickySaveBar } from "../_components/sticky-save";
import { DashCombobox } from "../hours/_components/combobox";
import { updateRestaurantStripeAction } from "./actions";
import { StripeConfigSchema, StripeConfigSchemaValues } from "./schema";
import { Button } from "@/components/ui/button";

const Page = () => {
  const restaurant = useSelectedRestaurant();
  const currencyLocked = !!restaurant?.stripe?.currency;

  const form = useForm<StripeConfigSchemaValues>({
    resolver: zodResolver(StripeConfigSchema),
    defaultValues: {
      currency: restaurant?.stripe?.currency ?? STRIPE_CURRENCIES[0],
      publishable: restaurant?.stripe?.publishable ?? "",
      secret: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleSubmit = async (data: StripeConfigSchemaValues) => {
    const response = await updateRestaurantStripeAction(data);

    if (!response.success) {
      toast.error(response.error);
      return;
    }

    updateSelectedRestaurant({
      stripe: response.data?.stripe ?? null,
    });
    form.reset({
      currency: response.data?.stripe?.currency,
      publishable: response.data?.stripe?.publishable,
      secret: "",
    });
    toast.success("Stripe info updated successfully");
  };

  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6"
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Stripe Settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Accept payments and deposits</p>
          </div>
        </div>
      </header>
      <div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} autoComplete="off" className="space-y-4">
            <Callout tone="info">
              Connect Stripe to accept reservation deposits and online orders. Keys are encrypted at
              rest.
            </Callout>

            <Controller
              name="publishable"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                    Publishable key *
                  </FieldLabel>
                  <div className="flex items-center relative">
                    <Input
                      {...field}
                      autoComplete="off"
                      className="h-9 rounded-lg w-full "
                      placeholder="pk_live_…"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground/80">
                    Safe to expose in client-side code.
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                  )}
                </Field>
              )}
            />
            {restaurant?.stripe?.secret_configured ? (
              <div className="rounded-lg border border-white/20 bg-white/10 p-3">
                <p className="text-sm">Secret key already configured</p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.setValue("secret", "", { shouldDirty: true });
                    updateRestaurantStripeSecret({
                      secret_configured: false,
                    });
                  }}
                  className="mt-2 cursor-pointer"
                >
                  Replace secret key
                </Button>
              </div>
            ) : (
              <Controller
                name="secret"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                      Secret key *
                    </FieldLabel>
                    <div className="flex items-center relative">
                      <Input
                        {...field}
                        autoComplete="off"
                        className="h-9 rounded-lg w-full "
                        placeholder="sk_live_…"
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground/80">
                      Keep this private. We encrypt it at rest.
                    </p>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
            )}

            <Controller
              name="currency"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2 w-full">
                  <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                    Currency
                  </FieldLabel>
                  {currencyLocked ? (
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background/60 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{field.value?.toUpperCase()}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Locked - permanent</span>
                    </div>
                  ) : (
                    <>
                      <DashCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        options={STRIPE_CURRENCIES.map((c) => ({
                          value: c,
                          label: c.toUpperCase(),
                        }))}
                        popularOptions={[]}
                        placeholder="Select currency"
                        className="w-full!"
                        searchPlaceholder="Search currencies..."
                        headingNormal="Available currencies"
                      />
                      <Callout tone="warn">
                        <span className="font-semibold">Important:</span> Your billing currency can
                        only be selected once. After it is saved, it cannot be changed. Choose
                        carefully, as all future subscriptions, invoices, and payments will use this
                        currency.
                      </Callout>
                    </>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                  )}
                </Field>
              )}
            />
            <StickySaveBar
              dirty={form.formState.isDirty}
              loading={form.formState.isSubmitting}
              disabled={form.formState.isSubmitting}
              onDiscard={() => {
                if (restaurant?.stripe) {
                  updateRestaurantStripeSecret({
                    secret_configured: true,
                  });
                }
                form.reset();
              }}
            />
            {/* Setup guide */}
            <div className="rounded-2xl border border-white/10 bg-background/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-500 text-white">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium leading-tight">How to add Stripe</div>
                    <div className="text-[11px] text-muted-foreground">Takes about 2 minutes</div>
                  </div>
                </div>
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 py-1.5 text-xs hover:border-white/40"
                >
                  Open Stripe <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <ol className="space-y-2.5">
                {[
                  {
                    t: "Create a Stripe account",
                    d: "Go to stripe.com and sign up - it's free. Verify your email and business details.",
                  },
                  {
                    t: "Open the API keys page",
                    d: "In your Stripe Dashboard, go to Developers → API keys.",
                  },
                  {
                    t: "Copy your Publishable key",
                    d: "Starts with pk_live_… (or pk_test_… while testing). Paste it below.",
                  },
                  {
                    t: "Reveal & copy your Secret key",
                    d: "Click 'Reveal live key' - starts with sk_live_…. Never share it publicly.",
                  },
                  {
                    t: "Pick your default currency",
                    d: "Choose the currency your guests will be charged in.",
                  },
                  {
                    t: "Save & test a payment",
                    d: "Hit Save, then run a €1 test booking to confirm everything works.",
                  },
                ].map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-snug">{s.t}</div>
                      <div className="text-xs text-muted-foreground">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <a
                href="https://docs.stripe.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-white"
              >
                Read the full Stripe docs <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </form>
        </FormProvider>
      </div>
    </section>
  );
};

export default Page;
