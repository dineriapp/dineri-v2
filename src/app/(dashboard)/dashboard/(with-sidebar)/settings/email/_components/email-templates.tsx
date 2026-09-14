"use client";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { useSendTestTemplateEmail } from "@/lib/tanstack-react-query/hooks/email-integration";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import {
  BellRing,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Loader,
  Package,
  Send,
  Star,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StickySaveBar } from "../../_components/sticky-save";
import { updateRestaurantEmailTemplatesAction } from "../actions";
import { buildEmail } from "../build-email";
import { defaultEmailTemplates, templatePlaceholders } from "../constants";
import { EmailTemplates } from "../types";
import { validateTemplates } from "../utils";
import { renderTemplatePreview } from "./utils";

const templateMeta: Record<
  string,
  { label: string; desc: string; icon: React.ElementType; trigger: string; accent: string }
> = {
  reservation_confirmation: {
    label: "Reservation confirmation",
    desc: "Sent when a guest's table booking is confirmed.",
    icon: CalendarCheck,
    trigger: "On reservation confirmed",
    accent: "from-white to-emerald-400",
  },
  order_booking: {
    label: "Order booking",
    desc: "Sent when a new order is placed.",
    icon: Package,
    trigger: "On order created",
    accent: "from-indigo-500 to-violet-500",
  },
  delivery_update: {
    label: "Delivery update",
    desc: "Sent when an order's delivery status changes.",
    icon: Truck,
    trigger: "On delivery status change",
    accent: "from-amber-400 to-orange-500",
  },
  booking_cancellation: {
    label: "Booking cancellation",
    desc: "Sent when a reservation is cancelled.",
    icon: XCircle,
    trigger: "On reservation cancelled",
    accent: "from-rose-500 to-red-500",
  },
  order_payment_received: {
    label: "Order payment received",
    desc: "Sent when a customer's payment is confirmed.",
    icon: CreditCard,
    trigger: "On payment confirmed",
    accent: "from-green-500 to-emerald-500",
  },
  order_cancellation: {
    label: "Order cancellation",
    desc: "Sent when an order is cancelled.",
    icon: XCircle,
    trigger: "On order cancelled",
    accent: "from-rose-500 to-red-500",
  },
  reservation_reminder: {
    label: "Reservation reminder",
    desc: "Scheduled when a booking is confirmed, delivered ahead of the reservation.",
    icon: BellRing,
    trigger: "Reminder lead time before the booking",
    accent: "from-sky-400 to-blue-500",
  },
  reservation_review: {
    label: "Review request",
    desc: "Sent after the guest has dined, asking how their visit went.",
    icon: Star,
    trigger: "On reservation completed",
    accent: "from-violet-400 to-purple-500",
  },
};

const EmailTemplatesSection = () => {
  const restaurant = useSelectedRestaurant();
  const { user } = useAuth();
  const sendTestMutation = useSendTestTemplateEmail();
  const [templates, setTemplates] = useState<EmailTemplates>(() => {
    const restaurantTemplates = restaurant?.email_templates;
    const merged = { ...defaultEmailTemplates };
    if (restaurantTemplates) {
      for (const key of Object.keys(merged) as (keyof EmailTemplates)[]) {
        if (restaurantTemplates[key]) {
          merged[key] = { ...merged[key], ...restaurantTemplates[key] };
        }
      }
    }
    return merged;
  });
  const [activeTemplate, setActiveTemplate] = useState<keyof EmailTemplates>(
    "reservation_confirmation",
  );
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<"subject" | "body" | null>(null);

  const updateTemplate = (
    key: keyof EmailTemplates,
    patch: Partial<EmailTemplates[keyof EmailTemplates]>,
  ) => {
    setTemplates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
    setDirty(true);
  };

  const resetAll = () => {
    setTemplates(defaultEmailTemplates);
    setDirty(true);
    toast("Reset to default templates");
  };

  const resetCurrentToDefault = () => {
    updateTemplate(activeTemplate, defaultEmailTemplates[activeTemplate]);
  };

  const handleSubmit = async () => {
    const { valid, error } = validateTemplates(templates);
    if (!valid) {
      toast.error(error);
      return;
    }
    setIsSaving(true);
    try {
      const response = await updateRestaurantEmailTemplatesAction(templates);
      if (!response.success) {
        toast.error(response.error);
        return;
      }
      updateSelectedRestaurant({
        email_templates: response.data.email_templates,
      });
      setTemplates(response.data.email_templates);
      setDirty(false);
      toast.success("Changes to email templates saved");
    } catch {
      toast.error("Failed to save templates");
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setTemplates(restaurant?.email_templates ?? defaultEmailTemplates);
    setDirty(false);
  };

  const current = templates[activeTemplate];
  const meta = templateMeta[activeTemplate];
  const ActiveIcon = meta.icon;
  const placeholders = templatePlaceholders[activeTemplate];

  const tplKeys = Object.keys(templateMeta) as (keyof EmailTemplates)[];

  const insertPlaceholder = (placeholder: string) => {
    if (!focusedField) {
      updateTemplate(activeTemplate, { body: current.body + " " + placeholder });
      return;
    }
    if (focusedField === "subject") {
      updateTemplate(activeTemplate, { subject: current?.subject + " " + placeholder });
    } else {
      updateTemplate(activeTemplate, { body: current?.body + " " + placeholder });
    }
  };

  const preview = renderTemplatePreview(current, activeTemplate, restaurant.name);

  return (
    <div>
      <div className="rounded-2xl border border-white/5 bg-surface-1 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-white" />
            <h3 className="text-sm font-semibold">Email templates</h3>
            <span className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
              AUTO-SENT BY EVENT
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {Object.values(templates).filter((t) => t.enabled).length} of {tplKeys.length} active
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* Template list */}
          <ul className="space-y-1.5">
            {tplKeys.map((k) => {
              const m = templateMeta[k];
              const Icon = m.icon;
              const isActive = k === activeTemplate;
              const enabled = templates[k]?.enabled ?? false;
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate(k)}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      isActive
                        ? "border-white/40 bg-white/5"
                        : "border-white/10 bg-background hover:border-white/20"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isActive ? "border-white/40 bg-white/15 text-white" : "border-white/10 text-muted-foreground"}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{m.label}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-white" : "bg-white/20"}`}
                        />
                        {enabled ? "Active" : "Off"}
                      </span>
                    </span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 transition ${isActive ? "text-white" : "text-muted-foreground/50 group-hover:text-muted-foreground"}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Editor */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-background p-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${meta.accent} text-background`}
                >
                  <ActiveIcon className="h-4 w-4 shrink-0" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{meta.desc}</div>
                  <div className="font-jetbrains-mono uppercase mt-1 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-surface-1 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    <Zap className="h-2.5 w-2.5 shrink-0" /> {meta.trigger}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Auto-send</span>
                <input
                  type="checkbox"
                  checked={current.enabled}
                  onChange={(e) => updateTemplate(activeTemplate, { enabled: e.target.checked })}
                  className="relative h-4 w-7 cursor-pointer appearance-none rounded-full bg-white/10 transition after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-background after:transition checked:bg-white checked:after:left-3.5"
                />
              </label>
            </div>

            <SettingField label="Subject line">
              <TextInput
                icon={<Edit3 className="h-4 w-4" />}
                value={current?.subject ?? ""}
                onFocus={() => setFocusedField("subject")}
                onClick={() => setFocusedField("subject")}
                onChange={(v) => updateTemplate(activeTemplate, { subject: v })}
                placeholder="Email subject"
              />
            </SettingField>

            <SettingField
              label="Message body"
              hint="Use placeholders like {{customer_name}} - they'll be filled in automatically."
            >
              <textarea
                value={current?.body ?? ""}
                onChange={(e) => updateTemplate(activeTemplate, { body: e.target.value })}
                onFocus={() => setFocusedField("body")}
                rows={8}
                className="w-full rounded-xl border border-white/10 bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:border-white/50 focus:outline-none"
                placeholder="Write your email…"
              />
            </SettingField>

            <div>
              <div className="font-jetbrains-mono uppercase mb-1.5 text-[10px] text-muted-foreground">
                INSERT PLACEHOLDER
              </div>
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => insertPlaceholder(p)}
                    className="rounded-md border border-white/10 bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground transition hover:border-white/40 hover:text-white"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-white/10 bg-background p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">
                  LIVE PREVIEW
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sendTestMutation.mutate(activeTemplate, {
                      onSuccess: () => {
                        toast("Test email sent", {
                          description: `${meta.label} → ${restaurant?.email_config?.testEmail || user?.email}`,
                        });
                      },
                      onError: (error) => {
                        toast.error(error.message || "Failed to send test email");
                      },
                    });
                  }}
                  disabled={sendTestMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[10px] hover:border-white/20"
                >
                  {sendTestMutation.isPending ? (
                    <Loader className="h-3 animate-spin w-3" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}{" "}
                  Send test
                </button>
              </div>

              <div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: buildEmail(preview?.body ?? "", preview?.subject ?? ""),
                  }}
                />
              </div>
            </div>
            <div className="-mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <FileText className="h-3 w-3" />
              Footer with dineri.app, X and Instagram links is automatically added to every email.
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetCurrentToDefault}
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                Reset this template
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                Reset all to default
              </button>
            </div>
          </div>
        </div>
      </div>
      <StickySaveBar
        dirty={dirty}
        loading={isSaving}
        onDiscard={discardChanges}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EmailTemplatesSection;

const SettingField = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="font-jetbrains-mono uppercase text-[10px] text-muted-foreground">{label}</span>
    <div className="mt-1.5">{children}</div>
    {hint && <p className="mt-1.5 text-[11px] text-muted-foreground/80">{hint}</p>}
  </label>
);

const TextInput = ({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
  icon,
  onBlur,
  onFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onClick?: () => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  icon?: React.ReactNode;
}) => {
  const isPassword = type === "password";
  const [reveal, setReveal] = useState(false);
  const effectiveType = isPassword ? (reveal ? "text" : "password") : type;
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-background focus-within:border-white/50">
      {icon && <span className="pl-3 text-muted-foreground">{icon}</span>}
      <input
        type={effectiveType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onBlur}
        className="w-full bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          aria-label={reveal ? "Hide password" : "Show password"}
          aria-pressed={reveal}
          tabIndex={-1}
          className="flex h-full items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
};
