import { NumericLimit, PlanLimits, PlanName } from "../types/plan-limits";
import { PLAN_LIMITS } from "./limits";

export const formatLimit = (value: NumericLimit): string =>
  value === "unlimited" ? "Unlimited" : String(value);

const limitCell = (value: NumericLimit): string | boolean =>
  value === 0 ? false : formatLimit(value);

const retentionLabel = (plan: PlanName): string => {
  const { value } = PLAN_LIMITS[plan].analyticsRetention;
  return `${value} days`;
};

const SUPPORT_LABEL: Record<PlanLimits["supportChannel"], string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  phone: "Phone",
};

export const PLAN_TAGLINE: Record<PlanName, string> = {
  starter: "Everything to get one venue live.",
  growth: "Everything your restaurant needs to fill tables",
  scale: "Scale across every venue you own",
};

export const PLAN_PERIOD: Record<PlanName, string> = {
  starter: "Free",
  growth: "/ month",
  scale: "/ month",
};

export const PLAN_CTA: Record<PlanName, string> = {
  starter: "Start free",
  growth: "Get started",
  scale: "Get started",
};

export function planHeadlineFeatures(plan: PlanName): string[] {
  const l = PLAN_LIMITS[plan];
  const venues = l.venues === "unlimited" ? "Unlimited venues" : `${l.venues} venue`;

  if (plan === "starter") {
    return [
      `${venues}, ${formatLimit(l.links)} links`,
      `Menu with ${formatLimit(l.menu)} categories, ${formatLimit(l.items_per_category)} items each`,
      `${formatLimit(l.qrCodes)} QR codes`,
      `${retentionLabel(plan)} of analytics`,
      `${SUPPORT_LABEL[l.supportChannel]} support`,
    ];
  }

  if (plan === "growth") {
    return [
      "Online ordering & table reservations",
      "0% commission on every order",
      `${formatLimit(l.links)} links · ${formatLimit(l.menu)} menu categories · unlimited FAQ`,
      `${formatLimit(l.qrCodes)} QR codes · ${retentionLabel(plan)} of analytics`,
      `${SUPPORT_LABEL[l.supportChannel]} support`,
    ];
  }

  return [
    "Unlimited venues, links, menu & events",
    `${retentionLabel(plan)} of analytics`,
    "White-label email & branding",
    "SSO + role-based access",
    `${SUPPORT_LABEL[l.supportChannel]} support & account manager`,
  ];
}

export const PLAN_FEATURES: Record<PlanName, string[]> = {
  starter: planHeadlineFeatures("starter"),
  growth: planHeadlineFeatures("growth"),
  scale: planHeadlineFeatures("scale"),
};

export type CompareValue = boolean | string;
export type CompareRow = { label: string; values: [CompareValue, CompareValue, CompareValue] };
export type CompareSection = { section: string; rows: CompareRow[] };

const ORDER: [PlanName, PlanName, PlanName] = ["starter", "growth", "scale"];

const row = (
  label: string,
  read: (limits: PlanLimits, plan: PlanName) => CompareValue,
): CompareRow => ({
  label,
  values: ORDER.map((p) => read(PLAN_LIMITS[p], p)) as [CompareValue, CompareValue, CompareValue],
});

export const PLAN_COMPARISON: CompareSection[] = [
  {
    section: "Profile & Links",
    rows: [
      row("Links", (l) => limitCell(l.links)),
      row("Menu categories", (l) => limitCell(l.menu)),
      row("Items per category", (l) => limitCell(l.items_per_category)),
      row("Gallery", (l) => limitCell(l.gallery)),
      row("FAQ", (l) => limitCell(l.faq)),
      row("Events", (l) => limitCell(l.events)),
      row("Popups", (l) => limitCell(l.popups)),
      row("Success stories", (l) => l.success_story),
      row("Appearance studio", (l) => l.appearance),
    ],
  },
  {
    section: "Visibility",
    rows: [row("Mobile-ready", (l) => l.mobileReady), row("Custom domain", (l) => l.customDomain)],
  },
  {
    section: "Orders & Reservations",
    rows: [
      row("Order system", (l) => l.orderSystem),
      row("Reservations", (l) => l.reservations),
      row("Confirmations & Reminders via email", (l) => l.zeroCommission),
    ],
  },
  {
    section: "QR & Analytics",
    rows: [
      row("QR codes", (l) => limitCell(l.qrCodes)),
      row("Analytics history", (_l, p) => retentionLabel(p)),
      row("Cross-venue reporting", (l) => l.crossVenueRapportage),
    ],
  },
  {
    section: "Email Notifications",
    rows: [
      row("Automatic notifications", (l) => l.automaticEmail),
      row("White label email customization", (l) => l.whiteLabelEmail),
    ],
  },
  {
    section: "Advanced",
    rows: [
      row("Venues", (l) => limitCell(l.venues)),
      row("Support", (l) => SUPPORT_LABEL[l.supportChannel]),
      row("White label branding", (l) => l.whiteLabelBranding),
      row("Installation & Onboarding", (l) => l.installationOnboarding),
      row("Account manager", (l) => l.accountManager),
    ],
  },
  {
    section: "API & Integrations",
    rows: [
      row("Google Business - Sync Reviews & Opening Hours", (l) => l.googleBusiness),
      row("Google Sheets - Export Reservations & Orders", (l) => l.googleSheets),
    ],
  },
  {
    section: "Comming soon",
    rows: [
      row(
        "Campaign Manager - Set up and manage your own Meta advertisements",
        (l) => l.googleBusiness,
      ),
      row("Guest Profiles & Loyalty program", (l) => l.googleSheets),
      row("POS intergration", (l) => l.googleSheets),
    ],
  },
];
