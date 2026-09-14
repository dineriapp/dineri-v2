"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FeatureNotAvailable from "@/components/shared/feature-not-available";
import { OrderStatus } from "@/drizzle/schema";
import { Order, OrderWithItems } from "@/drizzle/types";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { hasFeature } from "@/lib/stripe/checkers";
import {
  useBulkUpdateOrderStatus,
  useOrdersBoard,
  useOrdersExportCount,
  useOrdersSummary,
  useOrdersListPage,
  useUpdateOrderPaymentStatus,
  useUpdateOrderStatus,
} from "@/lib/tanstack-react-query/hooks/orders";
import {
  setOrdersAutoRefresh,
  setOrdersTimeline,
  setOrdersView,
  useOrdersUIStore,
} from "@/stores/order-ui-settings";
import { useSelectedRestaurant } from "@/stores/restaurant-store";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Wallet,
  Download,
  Filter,
  Hash,
  LayoutGrid,
  List,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashSelect, makePoints, OrderKpi, Range, rangeDays, timeAgo } from "../../_components";
import TopBar from "../../_components/top-bar";
import { downloadOrdersExportPdf } from "@/lib/pdf/orders-export-pdf";
import { canTransitionOrderStatus } from "@/lib/services/order-status";
import { getOrdersForExport, OrderExportFilters, OrdersListFilters, OrdersSortBy } from "./actions";
import type { BulkOrderStatusSkip } from "./_components/actions";
import { EmptyOrders } from "./_components/empty-order";
import OperationalSettings, { restaurantStatusOptions } from "./_components/operational_settings";
import { OrdersBoard } from "./_components/order-board";
import { OrderDetailDrawer } from "./_components/order-detail-drawer";
import {
  channelIcon,
  fmtMoney,
  isCardOrder,
  isPaymentStatusEditable,
  OrderChannel,
  paymentMethodLabel,
  paymentStatusStyles,
  statusMeta,
} from "./_components/utils";
import { getCurrencySymbol } from "@/lib/stripe/types";
import { cn, formatOrderNumber } from "@/lib/utils";
import Link from "next/link";

const PAGE_SIZE = 25;

const summariseSkips = (skipped: BulkOrderStatusSkip[]): string => {
  if (skipped.length === 0) return "";

  if (skipped.length === 1) {
    const [only] = skipped;
    return `Order ${formatOrderNumber(only.orderNumber)} was skipped because it was ${only.clause}.`;
  }

  const counts = new Map<string, number>();
  for (const s of skipped) {
    counts.set(s.clause, (counts.get(s.clause) ?? 0) + 1);
  }

  const groups = [...counts.entries()];
  if (groups.length === 1) {
    const [clause, count] = groups[0];
    return `${count} order${count === 1 ? " was" : "s were"} skipped because ${count === 1 ? "it was" : "they were"} ${clause}.`;
  }

  const detail = groups.map(([clause, count]) => `${count} ${clause}`).join(", ");
  return `${skipped.length} orders were skipped: ${detail}.`;
};

const Page = () => {
  const { view, timeline, autoRefresh } = useOrdersUIStore();
  const { session } = useAuth();
  const selectedRestaurant = useSelectedRestaurant();

  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<OrderChannel | "all">("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortBy, setSortBy] = useState<OrdersSortBy>("recent");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const listFilters = useMemo<OrdersListFilters>(
    () => ({
      range: timeline,
      status: filter,
      channel: channelFilter,
      search: debouncedQuery,
      sortBy,
    }),
    [timeline, filter, channelFilter, debouncedQuery, sortBy],
  );

  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const pageIndex = cursorStack.length - 1;
  const currentCursor = cursorStack[pageIndex];

  useEffect(() => {
    setCursorStack([null]);
  }, [timeline, filter, channelFilter, debouncedQuery, sortBy]);

  const {
    data: summary,
    isPending: summaryPending,
    refetch: refetchSummary,
  } = useOrdersSummary(timeline);
  const {
    data: listPage,
    isFetching: isListFetching,
    isPlaceholderData: isListStale,
    refetch: refetchList,
  } = useOrdersListPage(listFilters, currentCursor);

  const {
    data: board,
    isFetching: isBoardFetching,
    refetch: refetchBoard,
  } = useOrdersBoard(timeline, view === "board");

  const orders = listPage?.orders ?? [];

  const [knownTotal, setKnownTotal] = useState<number | null>(null);
  useEffect(() => {
    if (listPage?.totalMatching != null) setKnownTotal(listPage.totalMatching);
  }, [listPage?.totalMatching]);
  useEffect(() => {
    setKnownTotal(null);
  }, [timeline, filter, channelFilter, debouncedQuery, sortBy]);

  const isRefetching = isListFetching || isBoardFetching;

  const updatePaymentStatusMutation = useUpdateOrderPaymentStatus();

  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [range] = useState<Range>("7D");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [timeline, filter, channelFilter, debouncedQuery, sortBy, currentCursor]);

  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const ALL_EXPORT_COLUMNS: {
    key:
      | "orderNumber"
      | "name"
      | "phone"
      | "fulfillment"
      | "status"
      | "total"
      | "paymentReference"
      | "createdAt";
    label: string;
  }[] = [
    { key: "orderNumber", label: "Code" },
    { key: "name", label: "Customer" },
    { key: "phone", label: "Phone" },
    { key: "fulfillment", label: "Channel" },
    { key: "status", label: "Status" },
    { key: "total", label: "Total" },
    { key: "paymentReference", label: "Payment Method" },
    { key: "createdAt", label: "Placed at" },
  ];

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportRange, setExportRange] = useState<"today" | "7D" | "30D" | "90D" | "all">("7D");
  const [exportCols, setExportCols] = useState<string[]>(
    ALL_EXPORT_COLUMNS.map((c) => c.key as string),
  );
  const [isExporting, setIsExporting] = useState(false);
  const updateOrderMutation = useUpdateOrderStatus();
  const bulkUpdateMutation = useBulkUpdateOrderStatus();

  const exportFilters = useMemo<OrderExportFilters>(
    () => ({ range: exportRange, status: filter, channel: channelFilter, search: debouncedQuery }),
    [exportRange, filter, channelFilter, debouncedQuery],
  );
  const { data: exportCount } = useOrdersExportCount(exportFilters, exportOpen);

  const refreshNow = () => {
    setLastRefreshed(new Date());
    refetchList();
    refetchSummary();
    refetchBoard();
    toast("Refreshed", { description: "Order list is up to date." });
  };

  const patchSelected = (id: string, patch: Partial<OrderWithItems>) => {
    setSelectedOrder((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const updatePaymentStatus = (id: string, paymentStatus: Order["paymentStatus"]) => {
    patchSelected(id, { paymentStatus });
    updatePaymentStatusMutation.mutate(
      { orderId: id, paymentStatus },
      {
        onSuccess: () => {
          toast.success("Payment status updated", {
            description: `Marked as ${paymentStatus}.`,
          });
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update payment status");
        },
      },
    );
  };

  const currencySymbol = getCurrencySymbol(selectedRestaurant?.stripe?.currency ?? null);

  const currentStatus = restaurantStatusOptions.find(
    (s) => s.key === selectedRestaurant?.orderSettings.status,
  )!;
  const timelineLabels: Record<typeof timeline, string> = {
    today: "Today",
    "7D": "Last 7 days",
    "30D": "Last 30 days",
    "90D": "Last 90 days",
  };

  const counts = useMemo(() => {
    const sc = summary?.statusCounts;
    return {
      all: summary?.total ?? 0,
      new: sc?.new ?? 0,
      confirmed: sc?.confirmed ?? 0,
      preparing: sc?.preparing ?? 0,
      ready: sc?.ready ?? 0,
      delivered: sc?.delivered ?? 0,
      cancelled: sc?.cancelled ?? 0,
    };
  }, [summary]);

  const kpis = useMemo(
    () => ({
      revenue: summary?.revenue ?? 0,
      count: summary ? summary.total - summary.statusCounts.cancelled : 0,
      avg: summary?.avgOrderValue ?? 0,
      pending: summary?.pending ?? 0,
      cancelRate: summary?.cancelRate ?? 0,
    }),
    [summary],
  );

  const updateStatus = (id: string, status: OrderStatus) => {
    patchSelected(id, { status });
    updateOrderMutation.mutate(
      { orderId: id, status },
      {
        onSuccess: () => {
          toast.success("Order updated", {
            description: `Marked as ${statusMeta[status].label.toLowerCase()}.`,
          });
        },
        onError: (err) => {
          toast.error(err.message ?? "Failed to update order status");
        },
      },
    );
  };

  const bulkUpdate = (status: OrderStatus) => {
    if (selectedIds.length === 0) return;

    const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
    selectedOrders
      .filter((o) => canTransitionOrderStatus(o.status, status))
      .forEach((o) => patchSelected(o.id, { status }));

    bulkUpdateMutation.mutate(
      { orderIds: selectedIds, status },
      {
        onSuccess: ({ updated, skipped }) => {
          const description = summariseSkips(skipped);

          if (updated === 0) {
            toast.warning("No orders updated", { description });
            return;
          }

          toast.success(`${updated} order${updated === 1 ? "" : "s"} updated`, {
            description: [`Marked as ${statusMeta[status].label.toLowerCase()}.`, description]
              .filter(Boolean)
              .join(" "),
          });
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update orders");
        },
      },
    );
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === orders.length ? [] : orders.map((o) => o.id)));
  };

  const goToNextPage = () => {
    if (!listPage?.nextCursor) return;
    setCursorStack((prev) => [...prev, listPage.nextCursor]);
  };
  const goToPreviousPage = () => {
    setCursorStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const viewAllForStatus = (status: OrderStatus) => {
    setFilter(status);
    setOrdersView("table");
  };

  const runExport = async () => {
    if (exportCols.length === 0) {
      toast.error("Pick at least one column", { description: "Select columns to include." });
      return;
    }

    setIsExporting(true);
    try {
      const result = await getOrdersForExport(exportFilters);
      if (!result.success) {
        toast.error(result.error || "Failed to export orders");
        return;
      }
      const { rows, truncated } = result.data;

      const cols = ALL_EXPORT_COLUMNS.filter((c) => exportCols.includes(c.key));
      const headerLabels = cols.map((c) => c.label);
      const dataRows = rows.map((o) =>
        cols.map((c) => {
          if (c.key === "total") return fmtMoney(Number(o.total), o.currency);
          if (c.key === "createdAt") return new Date(o.createdAt).toLocaleDateString();
          if (c.key === "paymentReference") return `${paymentMethodLabel(o)} payment`;
          if (c.key === "orderNumber") return formatOrderNumber(o.orderNumber);
          return String(o[c.key] ?? "");
        }),
      );

      if (exportFormat === "csv") {
        const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
        const csv = [headerLabels, ...dataRows]
          .map((r) => r.map((v) => escape(String(v))).join(","))
          .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${exportRange}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // A real PDF, not a print dialog: the button says export, so it should
        // put a file on disk the same way the CSV branch does.
        await downloadOrdersExportPdf({
          headers: headerLabels,
          rows: dataRows,
          rangeLabel: exportRange,
          truncated,
        });
      }

      toast.success("Export ready", {
        description: truncated
          ? `First ${rows.length.toLocaleString()} orders exported as ${exportFormat.toUpperCase()} (more matched - narrow the range or filters to get the rest).`
          : `${rows.length} orders exported as ${exportFormat.toUpperCase()}.`,
      });
      setExportOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExportCol = (key: string) => {
    setExportCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const clearFilters = () => {
    setFilter("all");
    setChannelFilter("all");
    setQuery("");
  };
  const hasFilters = filter !== "all" || channelFilter !== "all" || !!query;

  const filterTabs: { key: OrderStatus | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "confirmed", label: "Confirmed" },
    { key: "preparing", label: "Preparing" },
    { key: "ready", label: "Ready" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    if (autoRefresh === "off") return;
    const ms =
      autoRefresh === "30s"
        ? 30_000
        : autoRefresh === "1m"
          ? 60_000
          : autoRefresh === "2m"
            ? 120_000
            : 300_000;

    const id = setInterval(() => {
      setLastRefreshed(new Date());
      refetchList();
      refetchSummary();
      refetchBoard();
    }, ms);

    return () => clearInterval(id);
  }, [autoRefresh, refetchList, refetchSummary, refetchBoard]);

  const revenueTrend = useMemo(() => makePoints(rangeDays[range], 1800, 600, 4), [range]);

  const pageStart = orders.length ? pageIndex * PAGE_SIZE + 1 : 0;
  const pageEnd = pageIndex * PAGE_SIZE + orders.length;

  if (!hasFeature(session?.user.subscription.plan ?? "starter", "orderSystem")) {
    return (
      <FeatureNotAvailable
        featureName="Online ordering"
        showBackButton={false}
        description="Take pickup and delivery orders from your page, with zero commission."
        requiredPlan="growth"
      />
    );
  }

  return (
    <>
      <TopBar page="Orders" />
      <div className="p-4 sm:p-6">
        <div className="animate-fade-in space-y-4 sm:space-y-6">
          {/* Header - refined hero card with subtle ambient glow */}
          <div className="dash-card relative overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-2 text-white">
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </div>
                  <h1 className="font-inter-tight text-2xl font-semibold tracking-tight lg:text-[1.75rem]">
                    Orders
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${currentStatus.tone}`}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      {selectedRestaurant?.orderSettings.status === "open" && (
                        <span
                          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${currentStatus.dot} opacity-60`}
                        />
                      )}
                      <span
                        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${currentStatus.dot}`}
                      />
                    </span>
                    {currentStatus.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage and track all your restaurant orders in real time.
                </p>

                {/* Live meta row */}
                <div className="font-jetbrains-mono uppercase mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-success" />
                    Last sync · {timeAgo(lastRefreshed.toISOString())}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {timelineLabels[timeline]}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    {summaryPending ? "…" : (summary?.total ?? 0)} total
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {/* Refresh + auto-refresh as a unified segment */}
                <button
                  onClick={refreshNow}
                  className="inline-flex h-9 items-center gap-1.5 px-3 text-xs hover:bg-white/5"
                  title="Refresh now"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />{" "}
                  Refresh
                </button>
                <div className="flex items-center pl-1 pr-1">
                  <DashSelect
                    value={autoRefresh}
                    onValueChange={(v) => setOrdersAutoRefresh(v as typeof autoRefresh)}
                    ariaLabel="Auto-refresh interval"
                    options={[
                      { value: "off", label: "Manual" },
                      { value: "30s", label: "Every 30s" },
                      { value: "1m", label: "Every 1m" },
                      { value: "2m", label: "Every 2m" },
                      { value: "5m", label: "Every 5m" },
                    ]}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-ring">
                      <Clock className="h-3.5 w-3.5" /> {timelineLabels[timeline]}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-lg border-border/60 bg-popover"
                  >
                    <DropdownMenuLabel className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Timeline
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(timelineLabels) as (keyof typeof timelineLabels)[]).map((k) => (
                      <DropdownMenuItem
                        key={k}
                        onSelect={() => setOrdersTimeline(k)}
                        className={`text-xs ${timeline === k ? "text-white" : ""}`}
                      >
                        <span className="flex-1">{timelineLabels[k]}</span>
                        {timeline === k && <Check className="h-3 w-3" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  onClick={() => setExportOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs hover:border-white/20"
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
                <Link
                  href={"/dashboard/orders/new"}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-background shadow-[0_8px_24px_-8px_rgba(255,255,255,0.6)] hover:bg-white/90"
                >
                  <Plus className="h-3.5 w-3.5" /> New order
                </Link>
              </div>
            </div>
          </div>

          {/* Operational settings */}
          <OperationalSettings />

          {/* KPI tiles */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
            <OrderKpi
              icon={Wallet}
              label={`Revenue · ${timelineLabels[timeline]}`}
              value={
                summaryPending ? "—" : fmtMoney(kpis.revenue, selectedRestaurant?.stripe?.currency)
              }
              trend="+12.4%"
              trendUp
              sparkline={revenueTrend}
            />
            <OrderKpi
              icon={Hash}
              label="Orders"
              value={summaryPending ? "—" : kpis.count.toString()}
              trend="+8 vs prev."
              trendUp
            />
            <OrderKpi
              icon={TrendingUp}
              label="Avg. order value"
              value={
                summaryPending ? "—" : fmtMoney(kpis.avg, selectedRestaurant?.stripe?.currency)
              }
              trend="+3.1%"
              trendUp
            />
            <OrderKpi
              icon={Package}
              label="Pending"
              value={summaryPending ? "—" : kpis.pending.toString()}
              trend="needs action"
              tone="white"
              pulse={kpis.pending > 0}
            />
            <OrderKpi
              icon={XCircle}
              label="Cancellation Rate"
              value={summaryPending ? "—" : `${kpis.cancelRate.toString()}%`}
              trend=""
              pulse={false}
            />
          </div>

          {/* Toolbar - refined two-row layout */}
          <div className="dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1">
            {/* Row 1 - status filter pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/5 p-3 lg:p-4">
              <span className="font-jetbrains-mono uppercase mr-1 hidden text-[10px] text-muted-foreground sm:inline">
                Status
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {filterTabs.map((t) => {
                  const active = filter === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setFilter(t.key)}
                      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                        active
                          ? "border-white/50 bg-white text-background font-semibold shadow-[0_6px_20px_-8px_rgba(255,255,255,0.6)]"
                          : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
                      }`}
                    >
                      <span>{t.label}</span>
                      <span
                        className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
                          active
                            ? "bg-background/20 text-background"
                            : "bg-white/5 text-muted-foreground group-hover:bg-white/10"
                        }`}
                      >
                        {counts[t.key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2 - search + filters + view toggle */}
            <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:p-4">
              <div className="relative flex-1 lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search code, customer or phone…"
                  className="h-10 w-full rounded-lg border border-white/10 bg-background pl-9 pr-9 text-xs placeholder:text-muted-foreground focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <DashSelect
                  value={channelFilter}
                  onValueChange={(v) => setChannelFilter(v as OrderChannel | "all")}
                  ariaLabel="Channel filter"
                  options={[
                    { value: "all", label: "All channels" },
                    { value: "pickup", label: "Pickup" },
                    { value: "delivery", label: "Delivery" },
                  ]}
                />
                <DashSelect
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as typeof sortBy)}
                  ariaLabel="Sort orders"
                  options={[
                    { value: "recent", label: "Most recent" },
                    { value: "total", label: "Highest total" },
                    { value: "customer", label: "Customer (A–Z)" },
                  ]}
                />
                <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-background p-1">
                  <button
                    onClick={() => setOrdersView("table")}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition ${
                      view === "table"
                        ? "bg-white text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label="Table view"
                  >
                    <List className="h-3 w-3" /> List
                  </button>
                  <button
                    onClick={() => setOrdersView("board")}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition ${
                      view === "board"
                        ? "bg-white text-background font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label="Board view"
                  >
                    <LayoutGrid className="h-3 w-3" /> Board
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-background/40 px-4 py-2.5 text-[11px]">
              <Filter
                className={cn("h-3 w-3", hasFilters ? "text-white" : "text-muted-foreground")}
              />
              <span className="text-muted-foreground">
                {orders.length === 0 ? (
                  "No matching orders"
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold tabular-nums text-foreground">
                      {pageStart}-{pageEnd}
                    </span>{" "}
                    {knownTotal !== null && (
                      <>
                        of <span className="tabular-nums text-foreground">{knownTotal}</span>{" "}
                      </>
                    )}
                    orders
                  </>
                )}
              </span>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-foreground hover:bg-white/5"
                >
                  <X className="h-3 w-3" /> Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk action bar */}
          {selectedIds.length > 0 && (
            <div className="sticky top-2 z-30 flex animate-fade-in items-center justify-between rounded-2xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-background">
                  {selectedIds.length}
                </span>
                <span>orders selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkUpdate("preparing")}
                  className="rounded-lg border border-white/10 bg-background px-2.5 py-1 hover:border-white/20"
                >
                  Mark preparing
                </button>
                <button
                  onClick={() => bulkUpdate("ready")}
                  className="rounded-lg border border-white/10 bg-background px-2.5 py-1 hover:border-white/20"
                >
                  Mark ready
                </button>
                <button
                  onClick={() => bulkUpdate("delivered")}
                  className="rounded-lg bg-white px-2.5 py-1 font-semibold text-background hover:bg-white/90"
                >
                  Complete
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="rounded-lg p-1 hover:bg-white/10"
                  aria-label="Clear selection"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {view === "table" ? (
            <div
              className={cn(
                "dash-card overflow-hidden rounded-2xl border border-white/5 bg-surface-1 transition-opacity",
                isListStale && "opacity-60",
              )}
            >
              {!listPage ? (
                <div className="flex min-h-40 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <EmptyOrders hasFilters={hasFilters} onClear={clearFilters} />
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <ul className="divide-y divide-white/5 lg:hidden">
                    {orders.map((o) => {
                      const Sicon = statusMeta[o.status].icon;
                      const Cicon = channelIcon[o.fulfillment];
                      const isSelected = selectedIds.includes(o.id);
                      return (
                        <li
                          key={o.id}
                          className={`flex cursor-pointer flex-col gap-2.5 px-4 py-4 transition ${isSelected ? "bg-white/4" : "hover:bg-white/2"}`}
                          onClick={() => setSelectedOrder(o)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(o.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-background accent-white"
                              aria-label={`Select ${formatOrderNumber(o.orderNumber)}`}
                            />
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background">
                              <ShoppingBag className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium">
                                {formatOrderNumber(o.orderNumber)}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {o.items.length} item{o.items.length > 1 ? "s" : ""} ·{" "}
                                {paymentMethodLabel(o)}
                              </div>
                            </div>
                          </div>
                          <div className="min-w-0 pl-12">
                            <div className="truncate text-sm">{o.name}</div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {o.email}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {o.phone}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pl-12">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Cicon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate capitalize">{o.fulfillment}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {paymentMethodLabel(o) === "Card" ? (
                                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <span className="w-3.5 shrink-0 text-center text-sm leading-none">
                                  {currencySymbol}
                                </span>
                              )}
                              <span className="truncate">{paymentMethodLabel(o)}</span>
                            </div>
                            <PaymentStatusControl
                              o={o}
                              onMarkPaid={() => updatePaymentStatus(o.id, "paid")}
                            />
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${statusMeta[o.status].cls}`}
                            >
                              <Sicon className="h-3 w-3" />
                              {statusMeta[o.status].label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pl-12">
                            <div className="text-sm font-semibold tabular-nums">
                              {fmtMoney(Number(o.total), o?.currency)}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                              <span>{timeAgo(String(o.createdAt))}</span>
                              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Desktop: real table */}
                  <Table className="hidden lg:table">
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="w-10 pl-5">
                          <input
                            type="checkbox"
                            checked={orders.length > 0 && selectedIds.length === orders.length}
                            onChange={toggleSelectAll}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-background accent-white"
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                          Order
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                          Customer
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                          Channel
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                          Payment Method
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                          Payment Status
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase text-right text-[10px] tracking-wider text-muted-foreground">
                          Total
                        </TableHead>
                        <TableHead className="font-jetbrains-mono uppercase pr-5 text-right text-[10px] tracking-wider text-muted-foreground">
                          Placed
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o) => {
                        const Sicon = statusMeta[o.status].icon;
                        const Cicon = channelIcon[o.fulfillment];
                        const isSelected = selectedIds.includes(o.id);
                        return (
                          <TableRow
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            className={cn(
                              "cursor-pointer border-white/5",
                              isSelected ? "bg-white/4 hover:bg-white/6" : "hover:bg-white/2",
                            )}
                          >
                            <TableCell className="pl-5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(o.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-3.5 w-3.5 cursor-pointer rounded border-white/20 bg-background accent-white"
                                aria-label={`Select ${formatOrderNumber(o.orderNumber)}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background">
                                  <ShoppingBag className="h-4 w-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium">
                                    {formatOrderNumber(o.orderNumber)}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {o.items.length} item{o.items.length > 1 ? "s" : ""} ·{" "}
                                    {paymentMethodLabel(o)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-0 max-w-50">
                                <div className="truncate text-sm">{o.name}</div>
                                <div className="truncate text-[11px] text-muted-foreground">
                                  {o.email}
                                </div>
                                <div className="truncate text-[11px] text-muted-foreground">
                                  {o.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Cicon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate capitalize">{o.fulfillment}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                {paymentMethodLabel(o) === "Card" ? (
                                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <span className="w-3.5 shrink-0 text-center text-sm leading-none">
                                    {currencySymbol}
                                  </span>
                                )}
                                <span className="truncate">{paymentMethodLabel(o)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <PaymentStatusControl
                                o={o}
                                onMarkPaid={() => updatePaymentStatus(o.id, "paid")}
                              />
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${statusMeta[o.status].cls}`}
                              >
                                <Sicon className="h-3 w-3" />
                                {statusMeta[o.status].label}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums">
                              {fmtMoney(Number(o.total), o?.currency)}
                            </TableCell>
                            <TableCell className="pr-5">
                              <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                                <span>{timeAgo(String(o.createdAt))}</span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          ) : (
            <div className={cn("transition-opacity", isBoardFetching && !board && "opacity-60")}>
              {board ? (
                <OrdersBoard
                  board={board}
                  statusCounts={counts}
                  onSelect={(o) => setSelectedOrder(o)}
                  onUpdateStatus={updateStatus}
                  onViewAll={viewAllForStatus}
                />
              ) : (
                <div className="dash-card flex min-h-40 items-center justify-center rounded-2xl border border-white/5 bg-surface-1">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          {/* Pagination - List view only; Board view is its own bounded per-status query */}
          {view === "table" && (orders.length > 0 || pageIndex > 0) && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={pageIndex === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="font-jetbrains-mono px-2 text-[11px] text-muted-foreground">
                Page {pageIndex + 1}
              </span>
              <button
                onClick={goToNextPage}
                disabled={!listPage?.nextCursor}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-background px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Detail drawer */}
          {selectedOrder && (
            <OrderDetailDrawer
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onUpdateStatus={(s) => updateStatus(selectedOrder.id, s)}
            />
          )}

          {/* Export modal */}
          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Export orders</DialogTitle>
                <DialogDescription>
                  Choose a date range, file format, and the columns to include.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Date range */}
                <div className="space-y-2">
                  <div className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Date range
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["today", "Today"],
                        ["7D", "Last 7 days"],
                        ["30D", "Last 30 days"],
                        ["90D", "Last 90 days"],
                        ["all", "All time"],
                      ] as const
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        onClick={() => setExportRange(k)}
                        className={`h-8 rounded-lg border px-3 text-xs transition ${
                          exportRange === k
                            ? "border-white/40 bg-white/15 text-white"
                            : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <div className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Format
                  </div>
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    {(["csv", "pdf"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setExportFormat(f)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                          exportFormat === f
                            ? "border-white/40 bg-white/10 text-foreground"
                            : "border-white/10 bg-background text-muted-foreground hover:border-white/20 hover:text-foreground"
                        }`}
                      >
                        <span className="font-medium uppercase">{f}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {f === "csv" ? "Spreadsheet" : "Printable"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Columns */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-jetbrains-mono  text-[10px] uppercase tracking-wider text-muted-foreground">
                      Columns
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setExportCols(ALL_EXPORT_COLUMNS.map((c) => c.key as string))
                        }
                        className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        All
                      </button>
                      <button
                        onClick={() => setExportCols([])}
                        className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
                    {ALL_EXPORT_COLUMNS.map((c) => {
                      const checked = exportCols.includes(c.key as string);
                      return (
                        <label
                          key={c.key as string}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                            checked
                              ? "border-white/40 bg-white/10 text-foreground"
                              : "border-white/10 bg-background text-muted-foreground hover:border-white/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleExportCol(c.key as string)}
                            className="h-3.5 w-3.5 accent-white"
                          />
                          {c.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-white/5 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground">
                  {exportCount === undefined ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Counting matching orders…
                    </span>
                  ) : (
                    <>{exportCount.toLocaleString()} order(s) match current filters and range.</>
                  )}
                </div>
              </div>

              <DialogFooter>
                <button
                  onClick={() => setExportOpen(false)}
                  className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-background px-3 text-xs hover:border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={runExport}
                  disabled={isExporting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-background shadow-[0_8px_24px_-8px_rgba(255,255,255,0.6)] hover:bg-white/90 disabled:opacity-60"
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download {exportFormat.toUpperCase()}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

const PaymentStatusControl = ({
  o,
  onMarkPaid,
}: {
  o: Order | OrderWithItems;
  onMarkPaid: () => void;
}) => {
  if (isPaymentStatusEditable(o)) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs capitalize",
              paymentStatusStyles[o.paymentStatus],
            )}
          >
            {o.paymentStatus}
            <ChevronDown className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMarkPaid();
            }}
            className="capitalize"
          >
            Mark as paid
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <span
      title={isCardOrder(o) ? "Confirmed automatically by Stripe" : "Payment status is locked"}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs capitalize",
        paymentStatusStyles[o.paymentStatus],
      )}
    >
      {o.paymentStatus}
    </span>
  );
};

export default Page;
