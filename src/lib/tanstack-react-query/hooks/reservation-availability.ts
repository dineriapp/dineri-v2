import { checkReservationAvailabilityAction } from "@/app/(preview)/r/[slug]/reserve/actions";
import { useQuery } from "@tanstack/react-query";

const QUERY_KEY_RESERVATION_AVAILABILITY = "reservation-availability" as const;

export type ReservationAvailabilityQueryInput = {
    slug: string;
    date: string;
    time: string;
    partySize: number;
    areaId?: string;
    isPriority?: boolean;
};

export function useReservationAvailability(input: ReservationAvailabilityQueryInput | null) {
    return useQuery({
        queryKey: [QUERY_KEY_RESERVATION_AVAILABILITY, input],
        queryFn: async () => {
            const result = await checkReservationAvailabilityAction(input!);

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
