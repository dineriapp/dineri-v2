import { db } from "@/drizzle/db";
import { rateLimitRedis, rateLimitRedisIsSeparate, redis } from "@/lib/radis";
import { limitApi } from "@/lib/rate-limit/guard";
import { RATE_LIMIT_MESSAGE, rateLimitHeaders } from "@/lib/rate-limit/http";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 3000;

const PROBE_CACHE_MS = 10_000;

type DependencyStatus =
  { status: "up"; latencyMs: number } | { status: "down"; reason: "timeout" | "unreachable" };

type Probe = {
  database: DependencyStatus;
  redis: DependencyStatus;
  rateLimitRedis?: DependencyStatus;
  checkedAt: string;
};

class ProbeTimeoutError extends Error {}

let cachedProbe: { at: number; value: Probe } | null = null;
let inFlight: Promise<Probe> | null = null;

async function withTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(new ProbeTimeoutError(`${label} did not respond within ${CHECK_TIMEOUT_MS}ms`)),
          CHECK_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function check(label: string, probe: () => Promise<unknown>): Promise<DependencyStatus> {
  const startedAt = Date.now();
  try {
    await withTimeout(probe(), label);
    return { status: "up", latencyMs: Date.now() - startedAt };
  } catch (error) {
    console.error(`Health check failed for ${label}:`, error);
    return {
      status: "down",
      reason: error instanceof ProbeTimeoutError ? "timeout" : "unreachable",
    };
  }
}

async function runProbe(): Promise<Probe> {
  const [database, cache, limiter] = await Promise.all([
    check("database", () => db.execute(sql`select 1`)),
    check("redis", () => redis.ping()),
    rateLimitRedisIsSeparate ? check("rate-limit redis", () => rateLimitRedis.ping()) : null,
  ]);
  return {
    database,
    redis: cache,
    ...(limiter ? { rateLimitRedis: limiter } : {}),
    checkedAt: new Date().toISOString(),
  };
}

async function getProbe(): Promise<Probe> {
  const now = Date.now();
  if (cachedProbe && now - cachedProbe.at < PROBE_CACHE_MS) return cachedProbe.value;
  if (inFlight) return inFlight;

  inFlight = runProbe()
    .then((value) => {
      cachedProbe = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

function isOperator(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  const limit = await limitApi("health", "health", req.headers);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: RATE_LIMIT_MESSAGE },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const noStore = { "Cache-Control": "no-store, max-age=0" };

  if (!isOperator(req)) {
    return NextResponse.json({ status: "ok" }, { status: 200, headers: noStore });
  }

  const probe = await getProbe();

  const healthy = probe.database.status === "up";
  const redisUp = probe.redis.status === "up" && (probe.rateLimitRedis?.status ?? "up") === "up";

  return NextResponse.json(
    {
      status: healthy ? (redisUp ? "ok" : "degraded") : "unhealthy",
      checks: {
        database: probe.database,
        redis: probe.redis,
        ...(probe.rateLimitRedis ? { rateLimitRedis: probe.rateLimitRedis } : {}),
      },
      checkedAt: probe.checkedAt,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: noStore },
  );
}
