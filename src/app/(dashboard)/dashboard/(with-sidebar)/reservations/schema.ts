import { z } from "zod";
import { RESERVATION_POLICY_IDS } from "@/lib/types/reservation-policy";

export const ReservationSettingsSchema = z
  .object({
    emergencyStop: z.boolean(),
    acceptingReservations: z.boolean(),
    requireDeposit: z.boolean(),
    depositAmount: z.number().min(0, "Deposit amount can't be negative"),
    maxPartySize: z.number().int().min(1),
    minPartySize: z.number().int().min(1),
    leadTimeMinutes: z.number().int().min(0),
    maxAdvanceDays: z.number().int().min(1).max(365),
    slotDurationMinutes: z.number().int().min(15),
    autoConfirm: z.boolean(),
    autoReleaseMinutes: z.number().int().min(0),
    notifyEmail: z.boolean(),
    notifySms: z.boolean(),
    reminderHours: z.number().int().min(1).max(72),
    showOnlineWidget: z.boolean(),
    cancellationHours: z.number().int().min(0),
    allowTableCombination: z.boolean(),
    priorityReservations: z.boolean(),
    priorityReservationAmount: z.number().min(0, "Priority reservation amount can't be negative"),
  })
  .superRefine((data, ctx) => {
    if (data.minPartySize > data.maxPartySize) {
      ctx.addIssue({
        code: "custom",
        path: ["minPartySize"],
        message: "Min party size can't be greater than max party size",
      });
    }
  });

export type ReservationSettingsSchemaValues = z.infer<typeof ReservationSettingsSchema>;

export const ReservationPoliciesSchema = z.object({
  policies: z
    .array(
      z.object({
        id: z.enum(RESERVATION_POLICY_IDS),
        enabled: z.boolean(),
        content: z.string().max(4000, "Keep a policy under 4000 characters"),
      }),
    )
    .length(RESERVATION_POLICY_IDS.length),
});

export type ReservationPoliciesSchemaValues = z.infer<typeof ReservationPoliciesSchema>;
