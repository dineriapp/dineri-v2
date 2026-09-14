import "server-only";
import { redis } from '../radis'
import { getDate } from './utils'

export type AnalyticsEventType = "pageview" | "menu" | "reserve";

type TrackEvent = {
    ip?: string;
    country?: string;
    city?: string;
    device?: string;
    traffic?: string;
};

type AnalyticsDayAggregate = {
    date: string;
    total: number;
    country: Record<string, number>;
    city: Record<string, number>;
    device: Record<string, number>;
    traffic: Record<string, number>;
    uniqueVisitors: number;
};

export type AnalyticsDashboardData = {
    range: string;
    eventType: AnalyticsEventType;
    days: AnalyticsDayAggregate[];
    totalVisits: number;
    avgVisitorsPerDay: string;
    visitorsToday: number;
    uniqueVisitors: number;
    topCountries: [string, number][];
    topCities: [string, number][];
    deviceBreakdown: [string, number][];
    trafficSources: [string, number][];
};

type AnalyticsArgs = {
    retention?: number;
};

const DASHBOARD_CACHE_TTL_SECONDS = 60 * 60 * 2;

function unwrapPipeline(results: [Error | null, unknown][] | null): unknown[] {
    if (!results) return [];
    return results.map(([err, value]) => {
        if (err) throw err;
        return value;
    });
}

function toNumberHash(h: Record<string, string> | null | undefined): Record<string, number> {
    if (!h) return {};
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(h)) out[key] = Number(value);
    return out;
}

function mergeInto(target: Map<string, number>, source: Record<string, number>) {
    for (const [key, value] of Object.entries(source)) {
        target.set(key, (target.get(key) ?? 0) + value);
    }
}

function topN(m: Map<string, number>, n = 5): [string, number][] {
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

class Analytics {
    private retention: number = 60 * 60 * 24 * 365;

    constructor(opts?: AnalyticsArgs) {
        if (opts?.retention) this.retention = opts.retention;
    }

    private keyBase(slug: string, type: AnalyticsEventType, date: string): string {
        return `analytics:{${slug}}:${type}:${date}`;
    }

    async track(slug: string, type: AnalyticsEventType, event: TrackEvent): Promise<void> {
        const date = getDate();
        const base = this.keyBase(slug, type, date);

        const p = redis.pipeline();
        p.incr(`${base}:total`);
        p.expire(`${base}:total`, this.retention);

        if (event.country) {
            p.hincrby(`${base}:country`, event.country, 1);
            p.expire(`${base}:country`, this.retention);
        }
        if (event.city) {
            p.hincrby(`${base}:city`, event.city, 1);
            p.expire(`${base}:city`, this.retention);
        }
        if (event.device) {
            p.hincrby(`${base}:device`, event.device, 1);
            p.expire(`${base}:device`, this.retention);
        }
        if (event.traffic) {
            p.hincrby(`${base}:traffic`, event.traffic, 1);
            p.expire(`${base}:traffic`, this.retention);
        }
        if (event.ip) {
            p.pfadd(`${base}:uniques`, event.ip);
            p.expire(`${base}:uniques`, this.retention);
        }

        await p.exec();
    }

    private async retrieveRange(
        slug: string,
        type: AnalyticsEventType,
        dates: string[],
    ): Promise<AnalyticsDayAggregate[]> {
        if (!dates.length) return [];

        const p = redis.pipeline();
        for (const date of dates) {
            const base = this.keyBase(slug, type, date);
            p.get(`${base}:total`);
            p.hgetall(`${base}:country`);
            p.hgetall(`${base}:city`);
            p.hgetall(`${base}:device`);
            p.hgetall(`${base}:traffic`);
            p.pfcount(`${base}:uniques`);
        }

        const results = unwrapPipeline(await p.exec());
        const FIELDS_PER_DAY = 6;

        return dates.map((date, i) => {
            const offset = i * FIELDS_PER_DAY;
            return {
                date,
                total: Number(results[offset] ?? 0),
                country: toNumberHash(results[offset + 1] as Record<string, string> | null),
                city: toNumberHash(results[offset + 2] as Record<string, string> | null),
                device: toNumberHash(results[offset + 3] as Record<string, string> | null),
                traffic: toNumberHash(results[offset + 4] as Record<string, string> | null),
                uniqueVisitors: Number(results[offset + 5] ?? 0),
            };
        });
    }
    private async retrieveRangeUniqueVisitors(
        slug: string,
        type: AnalyticsEventType,
        dates: string[],
    ): Promise<number> {
        if (!dates.length) return 0;

        const sourceKeys = dates.map((date) => `${this.keyBase(slug, type, date)}:uniques`);
        if (sourceKeys.length === 1) {
            return redis.pfcount(sourceKeys[0]);
        }

        const mergedKey = `analytics:{${slug}}:${type}:merge:${dates[0]}:${dates[dates.length - 1]}`;
        try {
            await redis.pfmerge(mergedKey, ...sourceKeys);
            await redis.expire(mergedKey, 60); // scratch key, short-lived safety net
            return await redis.pfcount(mergedKey);
        } finally {
            void redis.del(mergedKey).catch(() => { });
        }
    }

    private aggregate(
        rangeLabel: string,
        type: AnalyticsEventType,
        days: AnalyticsDayAggregate[],
        uniqueVisitors: number,
    ): AnalyticsDashboardData {
        const countryTotals = new Map<string, number>();
        const cityTotals = new Map<string, number>();
        const deviceTotals = new Map<string, number>();
        const trafficTotals = new Map<string, number>();
        let totalVisits = 0;

        for (const day of days) {
            totalVisits += day.total;
            mergeInto(countryTotals, day.country);
            mergeInto(cityTotals, day.city);
            mergeInto(deviceTotals, day.device);
            mergeInto(trafficTotals, day.traffic);
        }

        const numberOfDays = days.length || 1;
        const avgVisitorsPerDay = (totalVisits / numberOfDays).toFixed(1);
        const visitorsToday = days.length ? days[days.length - 1].total : 0;

        return {
            range: rangeLabel,
            eventType: type,
            days,
            totalVisits,
            avgVisitorsPerDay,
            visitorsToday,
            uniqueVisitors,
            topCountries: topN(countryTotals),
            topCities: topN(cityTotals),
            deviceBreakdown: [...deviceTotals.entries()].sort((a, b) => b[1] - a[1]),
            trafficSources: [...trafficTotals.entries()].sort((a, b) => b[1] - a[1]),
        };
    }


    async getDashboardData(
        slug: string,
        type: AnalyticsEventType,
        rangeLabel: string,
        nDays: number,
    ): Promise<AnalyticsDashboardData> {
        const cacheKey = `analytics:cache:{${slug}}:${type}:days-${nDays}`;

        const cached = await redis
            .get(cacheKey)
            .then((raw) => (raw ? (JSON.parse(raw) as AnalyticsDashboardData) : null))
            .catch(() => null);
        if (cached) {
            return cached;
        }

        // oldest -> newest, so `days[days.length - 1]` is always "today" for visitorsToday
        const dates = Array.from({ length: nDays }, (_, i) => getDate(nDays - 1 - i));

        const [days, uniqueVisitors] = await Promise.all([
            this.retrieveRange(slug, type, dates),
            this.retrieveRangeUniqueVisitors(slug, type, dates),
        ]);

        const data = this.aggregate(rangeLabel, type, days, uniqueVisitors);

        await redis
            .set(cacheKey, JSON.stringify(data), "EX", DASHBOARD_CACHE_TTL_SECONDS)
            .catch((err) => console.error("Failed to populate analytics dashboard cache:", err));

        return data;
    }
}

export const analytics = new Analytics()
