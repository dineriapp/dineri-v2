import {
  getReservationPaymentsPage,
  getReservationPaymentsSummary,
  PaymentsFilters,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/_components/payments/actions";
import {
  refundReservationAction,
  RefundReservationInput,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/_components/refund-actions";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_PAYMENTS_SUMMARY = "reservation-payments-summary" as const;
const QUERY_KEY_PAYMENTS_PAGE = "reservation-payments-page" as const;

const PAYMENTS_STALE_TIME = 60_000;

export function useReservationPaymentsSummary(filters: PaymentsFilters) {
  return useQuery({
    queryKey: [QUERY_KEY_PAYMENTS_SUMMARY, filters],
    queryFn: async () => {
      const result = await getReservationPaymentsSummary(filters);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: PAYMENTS_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useReservationPaymentsPage(filters: PaymentsFilters, cursor: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY_PAYMENTS_PAGE, filters, cursor],
    queryFn: async () => {
      const result = await getReservationPaymentsPage(filters, cursor);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: PAYMENTS_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useRefundReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RefundReservationInput) => {
      const result = await refundReservationAction(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAYMENTS_SUMMARY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_PAYMENTS_PAGE] });
      queryClient.invalidateQueries({ queryKey: ["reservations-page"] });
      queryClient.invalidateQueries({ queryKey: ["area-day-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["unseated-day-reservations"] });
    },
  });
}
