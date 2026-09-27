export const STRIPE_CURRENCIES = [
    "usd",
    "eur",
    "gbp",
    "aed",
    "pkr",
] as const;

export type StripeCurrency =
    (typeof STRIPE_CURRENCIES)[number];

const STRIPE_CURRENCY_SYMBOLS: Record<StripeCurrency, string> = {
    usd: "$",
    eur: "€",
    gbp: "£",
    aed: "د.إ",
    pkr: "₨",
};

export const getCurrencySymbol = (code?: StripeCurrency | null) => {
    if (!code) return "€";
    return STRIPE_CURRENCY_SYMBOLS[code] ?? "€";
};

export const fmtMoney = (n: number, currencyCode?: string | null) => {
    const symbol = getCurrencySymbol(currencyCode as StripeCurrency | null | undefined);
    return `${symbol}${n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export type StripeConfig = {
    publishable: string;
    secret: string;
    webhook_secret: string;
    currency: StripeCurrency;
    // helper
    webhook_id: string;
    configured: boolean,
    secret_configured: boolean,
    webhook_configured: boolean,
}; 