import { analytics, AnalyticsEventType } from "@/lib/analytics/analytics";
import { ensureAuthenticatedUser } from "@/lib/auth/guards";
import { getAnalyticsRetentionDays } from "@/lib/stripe/checkers";
import { db } from "@/drizzle/db";
import { restaurant } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "./_components/analytics-dashboard";

type PageProps = {
    searchParams: Promise<{ range?: string; type?: string }>;
};

const daysMap: Record<string, number> = {
    "7": 7,
    "15": 15,
    "30": 30,
    "90": 90,
    "120": 120,
    "180": 180,
    "365": 365,
};

const Page = async ({ searchParams }: PageProps) => {
    const { range = "7", type = "pageview" } = await searchParams;

    const auth = await ensureAuthenticatedUser();
    if (!auth.session) {
        redirect("/sign-in");
    }

    const activeRestaurant = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, auth.session.user.activeRestaurantId),
        columns: { slug: true },
    });
    if (!activeRestaurant) {
        redirect("/dashboard");
    }

    const maxDays = getAnalyticsRetentionDays(auth.session.user.subscription.plan);

    // Only offer range options the plan actually allows.
    const allowedRanges = Object.entries(daysMap)
        .filter(([, days]) => days <= maxDays)
        .sort((a, b) => a[1] - b[1]);

    const validTypes: AnalyticsEventType[] = ["pageview", "menu", "reserve"];
    const eventType = validTypes.includes(type as AnalyticsEventType)
        ? (type as AnalyticsEventType)
        : "pageview";

    const isKnownRange = range in daysMap;
    const requestedDays = daysMap[range] ?? 7;
    const isLimited = requestedDays > maxDays;


    const effectiveRange = isLimited || !isKnownRange
        ? (allowedRanges[allowedRanges.length - 1]?.[0] ?? "7")
        : range;
    const daysToFetch = daysMap[effectiveRange] ?? Math.min(7, maxDays);

    // Served from a 2-hour Redis-side cache
    const data = await analytics.getDashboardData(activeRestaurant.slug, eventType, effectiveRange, daysToFetch);

    return (
        <div className="">
            <div className="relative">
                <AnalyticsDashboard
                    data={data}
                    availableTypes={validTypes}
                    allowedRanges={allowedRanges.map(([value]) => value)}
                    maxDays={maxDays}
                    isLimited={isLimited}
                    plan={auth.session.user.subscription.plan}
                />
            </div>
        </div>
    );
};

export default Page;
