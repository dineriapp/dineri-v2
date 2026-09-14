
import { NumericLimit } from '../types/plan-limits';
import { PLAN_LIMITS } from './limits';
import { PlanName } from './plans';

export function getResourceLimitClient(
    plan: PlanName,
    resource: 'links' | 'gallery' | 'faq' | 'events' | 'popups' | 'qrCodes' | 'venues' | "menu" | "items_per_category"
): number | 'unlimited' {
    const limit = PLAN_LIMITS[plan][resource] as NumericLimit;
    return limit === 'unlimited' ? 'unlimited' : limit;
}

export function getRemainingSlotsClient(
    plan: PlanName,
    resource: 'links' | 'gallery' | 'faq' | 'events' | 'popups' | 'qrCodes' | 'venues' | "menu" | "items_per_category",
    currentCount: number
): number {
    const limit = PLAN_LIMITS[plan][resource] as NumericLimit;
    if (limit === 'unlimited') return Infinity;
    return Math.max(0, limit - currentCount);
}

export function canAddClient(
    plan: PlanName,
    resource: 'links' | 'gallery' | 'faq' | 'events' | 'popups' | 'qrCodes' | 'venues' | "menu" | "items_per_category",
    currentCount: number
): boolean {
    const remaining = getRemainingSlotsClient(plan, resource, currentCount);
    return remaining > 0;
}