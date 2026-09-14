import {
    getReservationsPage,
    getReservationsSummary,
    ReservationsFilters,
    ReservationsListFilters,
    ReservationsPage,
    updateReservationStatusAction,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/_components/dashboard/actions";
import { reservationGroupOf } from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/_components/dashboard/groups";
import {
    getAreaDayReservations,
    getServiceDayOverview,
    getUnseatedDayReservations,
    moveReservationAction,
    MoveReservationInput,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/_components/service/actions";
import { ReservationPaymentStatus, ReservationStatus } from "@/drizzle/schemas/reservation-schema";
import { ReservationWithArea } from "@/drizzle/types";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_SERVICE_OVERVIEW = "service-day-overview" as const;
const QUERY_KEY_AREA_RESERVATIONS = "area-day-reservations" as const;
const QUERY_KEY_UNSEATED_RESERVATIONS = "unseated-day-reservations" as const;
const QUERY_KEY_RESERVATIONS_SUMMARY = "reservations-summary" as const;
const QUERY_KEY_RESERVATIONS_PAGE = "reservations-page" as const;


const RESERVATION_STALE_TIME = 60_000;

export function useServiceDayOverview(date: string) {
    return useQuery({
        queryKey: [QUERY_KEY_SERVICE_OVERVIEW, date],
        queryFn: async () => {
            const result = await getServiceDayOverview(date);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        staleTime: RESERVATION_STALE_TIME,
        placeholderData: keepPreviousData,
    });
}

export function useAreaDayReservations(date: string, areaId: string, enabled: boolean) {
    return useQuery({
        queryKey: [QUERY_KEY_AREA_RESERVATIONS, date, areaId],
        queryFn: async () => {
            const result = await getAreaDayReservations(date, areaId);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled,
        staleTime: RESERVATION_STALE_TIME,
    });
}


export function useUnseatedDayReservations(date: string, enabled: boolean) {
    return useQuery({
        queryKey: [QUERY_KEY_UNSEATED_RESERVATIONS, date],
        queryFn: async () => {
            const result = await getUnseatedDayReservations(date);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        enabled,
        staleTime: RESERVATION_STALE_TIME,
    });
}


export function useReservationsSummary(filters: ReservationsFilters) {
    return useQuery({
        queryKey: [QUERY_KEY_RESERVATIONS_SUMMARY, filters],
        queryFn: async () => {
            const result = await getReservationsSummary(filters);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        staleTime: RESERVATION_STALE_TIME,
        placeholderData: keepPreviousData,
    });
}

export function useReservationsPage(filters: ReservationsListFilters, cursor: string | null) {
    return useQuery({
        queryKey: [QUERY_KEY_RESERVATIONS_PAGE, filters, cursor],
        queryFn: async () => {
            const result = await getReservationsPage(filters, cursor);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        staleTime: RESERVATION_STALE_TIME,
        placeholderData: keepPreviousData,
    });
}


export function useMoveReservation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: MoveReservationInput) => {
            const result = await moveReservationAction(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_AREA_RESERVATIONS] });

            const previousAreas = queryClient.getQueriesData<ReservationWithArea[]>({
                queryKey: [QUERY_KEY_AREA_RESERVATIONS],
            });

            queryClient.setQueriesData<ReservationWithArea[]>(
                { queryKey: [QUERY_KEY_AREA_RESERVATIONS] },
                (old) =>
                    old?.map((r) =>
                        r.id === input.id
                            ? {
                                ...r,
                                time: `${input.time}:00`,

                                assignedTables: r.assignedTables.map((t, i) =>
                                    i === 0 ? { ...t, id: input.tableId } : t,
                                ),
                            }
                            : r,
                    ),
            );

            return { previousAreas };
        },

        onSuccess: (data) => {
            queryClient.setQueriesData<ReservationWithArea[]>(
                { queryKey: [QUERY_KEY_AREA_RESERVATIONS] },
                (old) =>
                    old?.map((r) =>
                        r.id === data.id
                            ? { ...r, time: `${data.time}:00`, areaId: data.areaId, assignedTables: data.assignedTables }
                            : r,
                    ),
            );

            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_AREA_RESERVATIONS] });
        },

        onError: (_error, _input, context) => {
            context?.previousAreas.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SERVICE_OVERVIEW] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_RESERVATIONS_PAGE] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_RESERVATIONS_SUMMARY] });
        },
    });
}

type UpdateReservationInput = {
    id: string;
    status: ReservationStatus;
    paymentStatus: ReservationPaymentStatus;
};

export function useUpdateReservationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateReservationInput) => {
            const result = await updateReservationStatusAction(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async (input) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: [QUERY_KEY_AREA_RESERVATIONS] }),
                queryClient.cancelQueries({ queryKey: [QUERY_KEY_UNSEATED_RESERVATIONS] }),
                queryClient.cancelQueries({ queryKey: [QUERY_KEY_RESERVATIONS_PAGE] }),
            ]);

            const previousAreas = queryClient.getQueriesData<ReservationWithArea[]>({
                queryKey: [QUERY_KEY_AREA_RESERVATIONS],
            });
            const previousUnseated = queryClient.getQueriesData<ReservationWithArea[]>({
                queryKey: [QUERY_KEY_UNSEATED_RESERVATIONS],
            });
            const previousPages = queryClient.getQueriesData<ReservationsPage>({
                queryKey: [QUERY_KEY_RESERVATIONS_PAGE],
            });

            const patch = (r: ReservationWithArea) =>
                r.id === input.id
                    ? { ...r, status: input.status, paymentStatus: input.paymentStatus }
                    : r;

            queryClient.setQueriesData<ReservationWithArea[]>(
                { queryKey: [QUERY_KEY_AREA_RESERVATIONS] },
                (old) => old?.map(patch),
            );

            queryClient.setQueriesData<ReservationWithArea[]>(
                { queryKey: [QUERY_KEY_UNSEATED_RESERVATIONS] },
                (old) => old?.map(patch),
            );

            const nextGroup = reservationGroupOf(input);

            for (const [queryKey, page] of previousPages) {
                if (!page) continue;

                const group = (queryKey[1] as ReservationsListFilters | undefined)?.group;
                const stillBelongs = group === nextGroup;

                queryClient.setQueryData<ReservationsPage>(queryKey, {
                    ...page,
                    reservations: stillBelongs
                        ? page.reservations.map(patch)
                        : page.reservations.filter((r) => r.id !== input.id),
                });
            }

            return { previousAreas, previousUnseated, previousPages };
        },

        onError: (_error, _input, context) => {
            context?.previousAreas.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            context?.previousUnseated.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            context?.previousPages.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SERVICE_OVERVIEW] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_RESERVATIONS_SUMMARY] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_RESERVATIONS_PAGE] });
        },
    });
}
