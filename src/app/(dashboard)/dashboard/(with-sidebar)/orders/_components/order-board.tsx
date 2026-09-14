"use client";
import { OrderStatus } from "@/drizzle/schema";
import { OrderWithItems } from "@/drizzle/types";
import { formatOrderNumber } from "@/lib/utils";
import { timeAgo } from "../../../_components";
import { OrdersBoardData } from "../actions";
import { channelIcon, fmtMoney, nextStatusFor, statusMeta } from "./utils";

const COLUMNS: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"];

export const OrdersBoard = ({
  board,
  statusCounts,
  onSelect,
  onUpdateStatus,
  onViewAll,
}: {
  board: OrdersBoardData;
  statusCounts: Record<OrderStatus, number>;
  onSelect: (o: OrderWithItems) => void;
  onUpdateStatus: (id: string, s: OrderStatus) => void;
  onViewAll: (status: OrderStatus) => void;
}) => {
  return (
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-6">
      {COLUMNS.map((col) => {
        const items = board[col] ?? [];
        const totalInColumn = statusCounts[col] ?? items.length;
        const hasMore = totalInColumn > items.length;
        const Sicon = statusMeta[col].icon;
        return (
          <div
            key={col}
            className="dash-card flex flex-col rounded-2xl border border-white/5 bg-surface-1 p-3"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-md border ${statusMeta[col].cls}`}
                >
                  <Sicon className="h-3 w-3" />
                </span>
                <span className="text-sm font-semibold">{statusMeta[col].label}</span>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                {totalInColumn}
              </span>
            </div>
            <div className="mt-2 flex-1 space-y-2">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[11px] text-muted-foreground">
                  No orders
                </div>
              ) : (
                items.map((o) => {
                  const Cicon = channelIcon[o.fulfillment];
                  const next = nextStatusFor(o.status);
                  return (
                    <div
                      key={o.id}
                      onClick={() => onSelect(o)}
                      className="cursor-pointer rounded-xl border border-white/5 bg-background p-3 transition hover:border-white/15"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {formatOrderNumber(o.orderNumber)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{o.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold tabular-nums">
                            {fmtMoney(Number(o.total), o.currency)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {timeAgo(String(o.createdAt))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 capitalize">
                          <Cicon className="h-3 w-3" /> {o.fulfillment}
                        </span>
                        <span>
                          {o.items.length} item{o.items.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      {next && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(o.id, next);
                          }}
                          className="mt-3 w-full rounded-lg border border-white/10 py-1.5 text-[11px] hover:border-white/40 hover:text-white"
                        >
                          → {statusMeta[next].label}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              {hasMore && (
                <button
                  onClick={() => onViewAll(col)}
                  className="w-full rounded-lg border border-dashed border-white/10 py-2 text-[11px] text-muted-foreground hover:border-white/20 hover:text-foreground"
                >
                  +{totalInColumn - items.length} more - view all in list
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
