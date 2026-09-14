import { OrderStatus } from "@/drizzle/schema";
import { Order } from "@/drizzle/types";
import { isTerminalOrderStatus, nextOrderStatus } from "@/lib/services/order-status";
import {
  CheckCircle2,
  CircleCheckBig,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";

export type OrderChannel = "pickup" | "delivery";

export const channelIcon: Record<OrderChannel, React.ElementType> = {
  pickup: ShoppingBag,
  delivery: Truck,
};

export const statusMeta: Record<
  OrderStatus,
  {
    label: string;
    cls: string;
    icon: React.ElementType;
  }
> = {
  new: {
    label: "New",
    cls: "bg-white/15 text-white border-white/30",
    icon: Sparkles,
  },

  confirmed: {
    label: "Confirmed",
    cls: "bg-blue/15 text-blue border-blue/30",
    icon: CircleCheckBig,
  },

  preparing: {
    label: "Preparing",
    cls: "bg-warning/15 text-warning border-warning/30",
    icon: Package,
  },

  ready: {
    label: "Ready",
    cls: "bg-info/15 text-info border-info/30",
    icon: CheckCircle2,
  },

  delivered: {
    label: "Delivered",
    cls: "bg-success/15 text-success border-success/30",
    icon: Truck,
  },

  cancelled: {
    label: "Cancelled",
    cls: "bg-danger/15 text-danger border-danger/30",
    icon: XCircle,
  },
};

export const nextStatusFor = nextOrderStatus;

export const isOrderStatusEditable = (status: OrderStatus) => !isTerminalOrderStatus(status);

export const lightStatusStyles: Record<OrderStatus, string> = {
  new: "bg-zinc-100 text-zinc-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  preparing: "bg-amber-50 text-amber-700",
  ready: "bg-sky-50 text-sky-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export const paymentStatusStyles: Record<Order["paymentStatus"], string> = {
  paid: "bg-green-500/15 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  refunded: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export const isCardOrder = (order: Pick<Order, "paymentReference">) =>
  !!order.paymentReference?.startsWith("cs_");

export const isPaymentStatusEditable = (order: Pick<Order, "paymentReference" | "paymentStatus">) =>
  !isCardOrder(order) && order.paymentStatus === "pending";

export const paymentMethodLabel = (order: Pick<Order, "paymentReference">): "Card" | "Cash" =>
  order.paymentReference ? "Card" : "Cash";

export { fmtMoney } from "@/lib/stripe/types";
