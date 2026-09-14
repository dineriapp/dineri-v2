import { StripePlan } from "@better-auth/stripe";
import { PlanLimits } from "../types/plan-limits";
import { PLAN_LIMITS } from "./limits";
import { PLAN_FEATURES } from "./plan-features";

type AppStripePlan = StripePlan & {
  features?: string[];
  monthlyPrice: number;
  yearlyPrice: number;
};

const toStripeLimits = (limits: PlanLimits): Record<string, unknown> =>
  limits as unknown as Record<string, unknown>;

export const PLANS = [
  {
    name: "starter",
    priceId: "",
    annualDiscountPriceId: "",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: toStripeLimits(PLAN_LIMITS.starter),
    features: PLAN_FEATURES.starter,
  },
  {
    name: "growth",
    priceId: "price_1TYnB2SGotLD6A2M0FxMhi87",
    annualDiscountPriceId: "price_1TYnBsSGotLD6A2MK623e6PG",
    monthlyPrice: 29,
    yearlyPrice: 288,
    limits: toStripeLimits(PLAN_LIMITS.growth),
    features: PLAN_FEATURES.growth,
  },
  {
    name: "scale",
    priceId: "price_1TYnCuSGotLD6A2Ml8kZwqOG",
    annualDiscountPriceId: "price_1TYnF1SGotLD6A2Mz2BpYqzz",
    monthlyPrice: 69,
    yearlyPrice: 738,
    limits: toStripeLimits(PLAN_LIMITS.scale),
    features: PLAN_FEATURES.scale,
  },
] as const satisfies AppStripePlan[];

export const STRIPE_PLANS = PLANS.filter((plan) => plan.priceId !== "") satisfies StripePlan[];

export type PlanName = (typeof PLANS)[number]["name"];

type PlanPrice = {
  monthly: number;
  yearly: number;
};

export const PLAN_TO_PRICE: Record<PlanName, PlanPrice> = Object.fromEntries(
  PLANS.map((plan) => [
    plan.name,
    {
      monthly: plan.monthlyPrice,
      yearly: plan.yearlyPrice,
    },
  ]),
) as Record<PlanName, PlanPrice>;

export * from "./checkers";
export * from "./plan-features";
