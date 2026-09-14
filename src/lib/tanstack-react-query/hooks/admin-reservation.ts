import {
    AdminAvailabilityInput,
    checkAdminReservationAvailabilityAction,
    createAdminReservationAction,
    CreateAdminReservationInput,
    getAdminReservationContext,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/new/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_ADMIN_RESERVATION_CONTEXT = "admin-reservation-context" as const;
const QUERY_KEY_ADMIN_AVAILABILITY = "admin-reservation-availability" as const;

export function useAdminReservationContext() {
    return useQuery({
        queryKey: [QUERY_KEY_ADMIN_RESERVATION_CONTEXT],
        queryFn: async () => {
            const result = await getAdminReservationContext();

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        staleTime: 5 * 60_000,
    });
}

export function useAdminReservationAvailability(input: AdminAvailabilityInput | null) {
    return useQuery({
        queryKey: [QUERY_KEY_ADMIN_AVAILABILITY, input],
        queryFn: async () => {
            const result = await checkAdminReservationAvailabilityAction(input!);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled: !!input,
        staleTime: 15_000,
        retry: false,
    });
}

export function useCreateAdminReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateAdminReservationInput) => {
            const result = await createAdminReservationAction(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onSuccess: () => {
            for (const key of [
                "service-day-overview",
                "area-day-reservations",
                "reservations-summary",
                "reservations-page",
                "reservation-payments-summary",
                "reservation-payments-page",
            ]) {
                queryClient.invalidateQueries({ queryKey: [key] });
            }
        },
    });
}
