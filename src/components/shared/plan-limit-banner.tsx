
'use client';

import { useAuth } from '@/lib/auth/hooks/use-auth';
import { getRemainingSlotsClient, getResourceLimitClient, } from '@/lib/stripe/client';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

type ResourceType = 'links' | 'gallery' | 'faq' | 'events' | 'popups' | 'qrCodes' | 'venues' | "menu" | "items_per_category";

const resourceDisplayNames: Record<ResourceType, string> = {
    links: 'links',
    gallery: 'gallery images',
    faq: 'FAQ items',
    events: 'events',
    popups: 'popups',
    qrCodes: 'QR codes',
    venues: 'venues',
    menu: 'menu categories',
    items_per_category: 'items per category',
};


interface PlanLimitBannerProps {
    resource: ResourceType;
    currentCount: number;
    /**
     * Show warning when remaining is less than or equal to this threshold
     * @default 0 (only when limit reached)
     */
    warningThreshold?: number;
}

export function PlanLimitBanner({ resource, currentCount, warningThreshold = 0 }: PlanLimitBannerProps) {
    const { user } = useAuth();
    const plan = user?.subscription?.plan ?? 'starter';

    const limit = getResourceLimitClient(plan, resource);
    if (limit === 'unlimited') return null;

    const remaining = getRemainingSlotsClient(plan, resource, currentCount);
    const isReached = remaining === 0;
    const isClose = remaining > 0 && remaining <= warningThreshold;

    if (!isReached && !isClose) return null;

    const message = isReached
        ? `You've reached your ${plan} plan limit of ${limit} ${resourceDisplayNames[resource]}.`
        : `You have ${remaining} ${resourceDisplayNames[resource]} remaining (out of ${limit}).`;

    const actionText = isReached ? 'Upgrade to add more' : 'Upgrade plan';

    return (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
            <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex-1">
                    <p className="text-foreground">
                        {message}
                    </p>
                    <Link
                        href="/dashboard/settings/subscription"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-400"
                    >
                        {actionText} <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}