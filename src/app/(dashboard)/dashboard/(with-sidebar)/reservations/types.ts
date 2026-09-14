export const RESERVATION_TAB_IDS = [
  "timeline",
  "list-view",
  "tables",
  "areas",
  "payments",
  "policies",
  "settings",
] as const;

export type ReservationTabId = (typeof RESERVATION_TAB_IDS)[number];

export const DEFAULT_RESERVATION_TAB: ReservationTabId = "timeline";

export function parseReservationTab(value: string | undefined): ReservationTabId {
  return RESERVATION_TAB_IDS.find((id) => id === value) ?? DEFAULT_RESERVATION_TAB;
}

export type ReservationSettingType = {
  emergencyStop: boolean;
  acceptingReservations: boolean;
  requireDeposit: boolean;
  depositAmount: number;
  maxPartySize: number;
  minPartySize: number;
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  slotDurationMinutes: number;
  autoConfirm: boolean;
  autoReleaseMinutes: number;
  notifyEmail: boolean;
  notifySms: boolean;
  reminderHours: number;
  showOnlineWidget: boolean;
  cancellationHours: number;
  allowTableCombination: boolean;
  priorityReservations: boolean;
  priorityReservationAmount: number;
};

export const DEFAULT_RESERVATION_SETTINGS: ReservationSettingType = {
  emergencyStop: true,
  acceptingReservations: false,
  requireDeposit: true,
  depositAmount: 10,
  maxPartySize: 12,
  minPartySize: 1,
  leadTimeMinutes: 60,
  maxAdvanceDays: 60,
  slotDurationMinutes: 120,
  autoConfirm: false,
  autoReleaseMinutes: 30,
  notifyEmail: false,
  notifySms: false,
  reminderHours: 24,
  showOnlineWidget: false,
  cancellationHours: 24,
  allowTableCombination: false,
  priorityReservations: false,
  priorityReservationAmount: 0,
};
