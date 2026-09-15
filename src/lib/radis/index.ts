import "server-only";
import Redis from "ioredis";
import { resolveRedisUrls } from "./urls";

type RedisClients = {
  analytics: Redis;
  rateLimit: Redis;
  separate: boolean;
};

const globalForRedis = globalThis as unknown as { redisClients?: RedisClients };

function createRedisClient(url: string, role: string): Redis {
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  client.on("error", (err) => {
    console.error(`Redis (${role}) connection error:`, err);
  });

  return client;
}

function createRedisClients(): RedisClients {
  const urls = resolveRedisUrls();
  const analytics = createRedisClient(urls.analytics, "analytics");

  const rateLimit = urls.separate ? createRedisClient(urls.rateLimit, "rate-limit") : analytics;

  return { analytics, rateLimit, separate: urls.separate };
}

const clients = globalForRedis.redisClients ?? createRedisClients();

if (process.env.NODE_ENV !== "production") globalForRedis.redisClients = clients;

export const redis = clients.analytics;

export const rateLimitRedis = clients.rateLimit;

export const rateLimitRedisIsSeparate = clients.separate;
