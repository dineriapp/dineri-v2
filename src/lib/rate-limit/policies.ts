export type RateLimitPolicy = {
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMITS = {
  global: { limit: 1000, windowSeconds: 60 },
  globalPrefetch: { limit: 2000, windowSeconds: 60 },
  emailCheck: { limit: 5, windowSeconds: 60 },
  health: { limit: 60, windowSeconds: 60 },
  qrScan: { limit: 120, windowSeconds: 60 },
  publicTracking: { limit: 60, windowSeconds: 60 },
  publicForm: { limit: 5, windowSeconds: 300 },
  publicOrder: { limit: 30, windowSeconds: 60 },
  publicReservation: { limit: 10, windowSeconds: 60 },
  orderTracking: { limit: 10, windowSeconds: 60 },
  publicAvailability: { limit: 60, windowSeconds: 60 },
  slugCheck: { limit: 30, windowSeconds: 60 },
  signedUpload: { limit: 60, windowSeconds: 60 },
  stripeWebhook: { limit: 5000, windowSeconds: 60 },
  smtpTest: { limit: 5, windowSeconds: 300 },
  smtpVerify: { limit: 10, windowSeconds: 300 },
  testEmail: { limit: 10, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitPolicyName = keyof typeof RATE_LIMITS;
