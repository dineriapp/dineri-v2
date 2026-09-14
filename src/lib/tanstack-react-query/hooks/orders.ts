import {
  bulkUpdateOrderStatus,
  updateOrderPaymentStatus,
  updateOrderStatus,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/orders/_components/actions";
import {
  getOrdersBoard,
  getOrdersExportCount,
  getOrdersSummary,
  getRestaurantOrdersPage,
  OrderExportFilters,
  OrdersBoardData,
  OrdersListFilters,
  OrdersPage,
  TimelineRange,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/orders/actions";
import { OrderStatus, PaymentStatus } from "@/drizzle/schema";
import { OrderWithItems } from "@/drizzle/types";
import { canTransitionOrderStatus } from "@/lib/services/order-status";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_ORDERS = "restaurant-orders" as const;

const STALE_TIME = 15_000;

export function useOrdersSummary(range: TimelineRange = "today") {
  return useQuery({
    queryKey: [QUERY_KEY_ORDERS, "summary", range],
    queryFn: async () => {
      const result = await getOrdersSummary(range);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: STALE_TIME,
  });
}

export function useOrdersBoard(range: TimelineRange, enabled: boolean) {
  return useQuery({
    queryKey: [QUERY_KEY_ORDERS, "board", range],
    queryFn: async () => {
      const result = await getOrdersBoard(range);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useOrdersListPage(filters: OrdersListFilters, cursor: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY_ORDERS, "list", filters, cursor],
    queryFn: async () => {
      const result = await getRestaurantOrdersPage(filters, cursor);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useOrdersExportCount(filters: OrderExportFilters, enabled: boolean) {
  return useQuery({
    queryKey: [QUERY_KEY_ORDERS, "export-count", filters],
    queryFn: async () => {
      const result = await getOrdersExportCount(filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data.count;
    },
    enabled,
  });
}

type ListPageCache = OrdersPage;

function patchListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  matches: (o: OrderWithItems) => boolean,
  patch: (o: OrderWithItems) => OrderWithItems,
) {
  queryClient.setQueriesData<ListPageCache>({ queryKey: [QUERY_KEY_ORDERS, "list"] }, (old) => {
    if (!old) return old;
    return { ...old, orders: old.orders.map((o) => (matches(o) ? patch(o) : o)) };
  });
}

function patchBoardCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  matches: (o: OrderWithItems) => boolean,
  patch: (o: OrderWithItems) => OrderWithItems,
) {
  queryClient.setQueriesData<OrdersBoardData>({ queryKey: [QUERY_KEY_ORDERS, "board"] }, (old) => {
    if (!old) return old;
    const found: OrderWithItems[] = [];
    const withoutMoved = Object.fromEntries(
      Object.entries(old).map(([status, list]) => {
        const remaining = list.filter((o) => {
          if (matches(o)) {
            found.push(o);
            return false;
          }
          return true;
        });
        return [status, remaining];
      }),
    ) as OrdersBoardData;

    if (!found.length) return old;

    const next: OrdersBoardData = { ...withoutMoved };
    for (const original of found) {
      const updated = patch(original);
      next[updated.status] = [updated, ...next[updated.status]];
    }
    return next;
  });
}

function useOrdersCacheSync() {
  const queryClient = useQueryClient();

  const snapshotAndPatch = async (
    matches: (o: OrderWithItems) => boolean,
    patch: (o: OrderWithItems) => OrderWithItems,
  ) => {
    await queryClient.cancelQueries({ queryKey: [QUERY_KEY_ORDERS] });

    const previousLists = queryClient.getQueriesData<ListPageCache>({
      queryKey: [QUERY_KEY_ORDERS, "list"],
    });
    const previousBoards = queryClient.getQueriesData<OrdersBoardData>({
      queryKey: [QUERY_KEY_ORDERS, "board"],
    });

    patchListCaches(queryClient, matches, patch);
    patchBoardCaches(queryClient, matches, patch);

    return { previousLists, previousBoards };
  };

  const rollback = (context?: {
    previousLists: [readonly unknown[], ListPageCache | undefined][];
    previousBoards: [readonly unknown[], OrdersBoardData | undefined][];
  }) => {
    context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
    context?.previousBoards.forEach(([key, data]) => queryClient.setQueryData(key, data));
  };

  const resync = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ORDERS] });
  };

  return { snapshotAndPatch, rollback, resync };
}

export function useUpdateOrderStatus() {
  const { snapshotAndPatch, rollback, resync } = useOrdersCacheSync();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const result = await updateOrderStatus(orderId, status);
      if (!result.success) {
        throw new Error(result.error || "Failed to update order status");
      }
      return result.data;
    },
    onMutate: ({ orderId, status }) =>
      snapshotAndPatch(
        (o) => o.id === orderId && canTransitionOrderStatus(o.status, status),
        (o) => ({ ...o, status }),
      ),
    onError: (_err, _vars, context) => rollback(context),
    onSettled: () => resync(),
  });
}

export function useBulkUpdateOrderStatus() {
  const { snapshotAndPatch, rollback, resync } = useOrdersCacheSync();

  return useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: string[]; status: OrderStatus }) => {
      const result = await bulkUpdateOrderStatus(orderIds, status);
      if (!result.success) {
        throw new Error(result.error || "Failed to update orders");
      }
      return result.data;
    },
    onMutate: ({ orderIds, status }) =>
      snapshotAndPatch(
        (o) => orderIds.includes(o.id) && canTransitionOrderStatus(o.status, status),
        (o) => ({ ...o, status }),
      ),
    onError: (_err, _vars, context) => rollback(context),
    onSettled: () => resync(),
  });
}

export function useUpdateOrderPaymentStatus() {
  const { snapshotAndPatch, rollback, resync } = useOrdersCacheSync();

  return useMutation({
    mutationFn: async ({
      orderId,
      paymentStatus,
    }: {
      orderId: string;
      paymentStatus: PaymentStatus;
    }) => {
      const result = await updateOrderPaymentStatus(orderId, paymentStatus);
      if (!result.success) {
        throw new Error(result.error || "Failed to update payment status");
      }
      return result.data;
    },
    onMutate: ({ orderId, paymentStatus }) =>
      snapshotAndPatch(
        (o) => o.id === orderId,
        (o) => ({ ...o, paymentStatus }),
      ),
    onError: (_err, _vars, context) => rollback(context),
    onSettled: () => resync(),
  });
}
