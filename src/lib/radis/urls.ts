export type RedisUrls = {
  analytics: string;
  rateLimit: string;
  separate: boolean;
};

export function resolveRedisUrls(env: Record<string, string | undefined> = process.env): RedisUrls {
  const analytics = env.REDIS_URL?.trim();
  if (!analytics) throw new Error("REDIS_URL is not set");

  const rateLimit = env.RATE_LIMIT_REDIS_URL?.trim() || analytics;

  return { analytics, rateLimit, separate: rateLimit !== analytics };
}
