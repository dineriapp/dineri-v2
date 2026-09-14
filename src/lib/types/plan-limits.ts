export type PlanName = 'starter' | 'growth' | 'scale';

// Numeric limits can be number or 'unlimited'
export type NumericLimit = number | 'unlimited';

// Analytics retention value (days, months, or unlimited)
type AnalyticsRetention = { type: 'days'; value: number }

export interface PlanLimits {
    links: NumericLimit;
    menu: NumericLimit;
    items_per_category: NumericLimit;
    faq: NumericLimit;
    success_story: boolean;

    // not done yet
    appearance: 'Full' | 'Brand kit'; // Starter/Growth = 'Full', Scale = 'Brand kit'
    gallery: NumericLimit;
    events: NumericLimit;
    popups: NumericLimit;
    reviews: boolean;

    // Visibility
    customDomain: boolean; // Scale only
    mobileReady: boolean;

    // Orders & Reservations
    orderSystem: boolean;
    reservations: boolean;
    zeroCommission: boolean;

    // QR & Analytics
    qrCodes: NumericLimit;
    analyticsRetention: AnalyticsRetention;
    crossVenueRapportage: boolean;

    // Email Notifications
    automaticEmail: boolean;
    whiteLabelEmail: boolean;

    // Advanced
    venues: NumericLimit;
    ssoRoleBased: boolean;
    supportChannel: 'email' | 'whatsapp' | 'phone';
    whiteLabelBranding: boolean;
    installationOnboarding: boolean;
    accountManager: boolean;

    // API & Integrations
    googleBusiness: boolean;
    googleSheets: boolean;
    metaPixel: boolean;
    lightspeed: boolean;
    deliverect: boolean;
}

export type BooleanFeatures = {
    [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never;
}[keyof PlanLimits];
