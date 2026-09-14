import { OrderStatus } from "@/drizzle/schema";

export const ORDER_STATUS_SEQUENCE = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
] as const;

const TERMINAL: readonly OrderStatus[] = ["delivered", "cancelled"];

const WORD: Record<OrderStatus, string> = {
  new: "new",
  confirmed: "confirmed",
  preparing: "preparing",
  ready: "ready",
  delivered: "delivered",
  cancelled: "cancelled",
};

function stage(status: OrderStatus): number {
  return (ORDER_STATUS_SEQUENCE as readonly OrderStatus[]).indexOf(status);
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL.includes(status);
}

export type OrderTransitionRefusal = {
  code: "terminal" | "backward";
  message: string;
  clause: string;
};

export function refuseOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): OrderTransitionRefusal | null {
  if (isTerminalOrderStatus(from)) {
    return {
      code: "terminal",
      clause: `already ${WORD[from]}`,
      message:
        from === "delivered"
          ? "This order has already been delivered and can no longer be changed."
          : "This order was cancelled and can no longer be changed.",
    };
  }

  if (to === "cancelled" || from === to) {
    return null;
  }

  if (stage(to) < stage(from)) {
    return {
      code: "backward",
      clause: `already past ${WORD[to]}`,
      message: `This order is already ${WORD[from]}; orders can't move back to ${WORD[to]}.`,
    };
  }

  return null;
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return refuseOrderTransition(from, to) === null;
}

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const current = stage(status);
  if (current < 0 || current >= ORDER_STATUS_SEQUENCE.length - 1) return null;
  return ORDER_STATUS_SEQUENCE[current + 1];
}
