"use client";
import { Loader, Lock } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { ChangePasswordSchema, ChangePasswordSchemaValues } from "./schema";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { useQuery } from "@tanstack/react-query";
import { Callout } from "../_components/callout";
import { getPasswordAccountStatus } from "./actions";

const providerLabel = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);

const listProviders = (ids: string[]) => {
  const labels = ids.map(providerLabel);
  if (labels.length <= 1) return labels[0] ?? "a social provider";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
};

const Page = () => {
  const { data: status, isPending: statusPending } = useQuery({
    queryKey: ["password-account-status"],
    queryFn: async () => {
      const result = await getPasswordAccountStatus();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const hasPassword = status?.hasPassword ?? false;
  const locked = statusPending || !hasPassword;

  const form = useForm<ChangePasswordSchemaValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      confirmPassword: "",
      newPassword: "",
      oldPassword: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleSubmit = async (data: ChangePasswordSchemaValues) => {
    if (locked) return;
    try {
      const result = await authClient.changePassword({
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        if (result.error.code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
          toast.error(
            "Your account uses social login (Google, etc.), so you may not have a password.",
          );
        } else {
          toast.error(result.error.message ?? "Failed to change password");
        }
        return;
      }
      form.reset();
      toast.success("Password updated successfully");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative rounded-2xl  border border-white/5 bg-surface-1 p-4 h-fit sm:p-6"
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Lock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Update your account password</p>
          </div>
        </div>
      </header>
      <div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-md space-y-4 ">
            {!statusPending && !hasPassword && (
              <Callout tone="info">
                You sign in with {listProviders(status?.socialProviders ?? [])}, so there is no
                Dineri password to change. Manage your password with{" "}
                {listProviders(status?.socialProviders ?? [])} instead.
              </Callout>
            )}
            <Controller
              name="oldPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                    Current password
                  </FieldLabel>
                  <div className="flex items-center relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                    <Input
                      {...field}
                      disabled={locked}
                      className="h-9 rounded-lg w-full pl-10 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Trattoria Milano"
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
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                    New password
                  </FieldLabel>
                  <div className="flex items-center relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                    <Input
                      {...field}
                      disabled={locked}
                      className="h-9 rounded-lg w-full pl-10 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Trattoria Milano"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  <PasswordStrength value={field.value} />
                  <p className="text-[11px] text-muted-foreground/80">
                    At least 8 characters. Mix letters, numbers and symbols.
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-2">
                  <FieldLabel className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                    Confirm new password
                  </FieldLabel>
                  <div className="flex items-center relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
                    <Input
                      {...field}
                      disabled={locked}
                      className="h-9 rounded-lg w-full pl-10 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Trattoria Milano"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                  )}
                </Field>
              )}
            />
            <div className="flex justify-end w-full">
              <button
                type="submit"
                disabled={locked || form.formState.isSubmitting}
                className="cursor-pointer rounded-full flex items-center justify-center gap-1 bg-white px-4 py-1.5 text-xs font-semibold text-background hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {form.formState.isSubmitting && <Loader className="animate-spin size-4" />}
                Update password
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </section>
  );
};

export default Page;

const PasswordStrength = ({ value }: { value: string }) => {
  const score = useMemo(() => {
    let s = 0;
    if (value.length >= 8) s++;
    if (/[A-Z]/.test(value)) s++;
    if (/[0-9]/.test(value)) s++;
    if (/[^A-Za-z0-9]/.test(value)) s++;
    return s;
  }, [value]);
  if (!value) return null;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-danger", "bg-warning", "bg-white/70", "bg-white"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < score ? colors[score - 1] : "bg-white/5"}`}
          />
        ))}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        Strength:{" "}
        <span className="text-foreground">{labels[Math.max(0, score - 1)] || "Weak"}</span>
      </div>
    </div>
  );
};
