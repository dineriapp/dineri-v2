
import { BooleanFeatures, NumericLimit, PlanLimits, PlanName } from '../types/plan-limits';
import { PLAN_LIMITS } from './limits';

// Get numeric limit value (returns Infinity for 'unlimited')
function getNumericLimit(limit: NumericLimit): number {
    return limit === 'unlimited' ? Infinity : limit;
}

// Check if a user can add another item of a given resource type
export function canAdd(
    plan: PlanName,
    resource: keyof Pick<PlanLimits, 'links' | 'gallery' | 'faq' | 'events' | 'popups' | 'qrCodes' | 'venues' | "menu" | "items_per_category">,
    currentCount: number
): boolean {
    const limit = PLAN_LIMITS[plan][resource] as NumericLimit;
    const max = getNumericLimit(limit);
    return currentCount < max;
}

// Get remaining slots for a numeric resource
export function getRemainingSlots(
    plan: PlanName,
    resource: keyof Pick<PlanLimits, 'links' | 'gallery' | 'faq' | 'events' | 'popups' | 'qrCodes' | 'venues' | "menu" | "items_per_category">,
    currentCount: number
): number {
    const limit = PLAN_LIMITS[plan][resource] as NumericLimit;
    const max = getNumericLimit(limit);
    return Math.max(0, max - currentCount);
}

// Get analytics retention in days (or Infinity if unlimited)
export function getAnalyticsRetentionDays(plan: PlanName): number {
    const retention = PLAN_LIMITS[plan].analyticsRetention;
    return retention.value;
}

export function getResourceLimit(
    plan: PlanName,
    resource: keyof Pick<PlanLimits, 'links' | 'gallery' | 'faq' | 'events' | 'popups' | 'qrCodes' | 'venues' | "menu" | "items_per_category">
): number | 'unlimited' {
    const limit = PLAN_LIMITS[plan][resource] as NumericLimit;
    return limit === 'unlimited' ? 'unlimited' : limit;
}

export function hasFeature(
    plan: PlanName,
    feature: BooleanFeatures
): boolean {
    return PLAN_LIMITS[plan][feature] as boolean;
}

// Plans are strictly ordered, so "is this plan at least X" is a comparison
// rather than a list of equality checks scattered across the UI.
export const PLAN_RANK: Record<PlanName, number> = { starter: 0, growth: 1, scale: 2 };

export const PLAN_LABEL: Record<PlanName, string> = {
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
};

export function meetsPlan(plan: PlanName, minimum: PlanName): boolean {
    return PLAN_RANK[plan] >= PLAN_RANK[minimum];
}

export function canUseEmail(plan: PlanName): boolean {
    return plan !== 'starter';
}

export function canUseCustomSmtp(plan: PlanName): boolean {
    return plan === 'scale';
}


export function getEmailMode(plan: PlanName): 'disabled' | 'platform' | 'custom' {
    if (plan === 'starter') return 'disabled';
    if (plan === 'growth') return 'platform';
    return 'custom';
}