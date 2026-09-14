import {
    createReservationArea,
    deleteReservationArea,
    getReservationAreas,
    updateReservationArea,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/_components/areas/actions";
import { ReservationAreaWithTables } from "@/drizzle/types";
import { ReservationAreaSchemaType } from "@/lib/validators/zod/reservation-area.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const QUERY_KEY_RESERVATION_AREAS = "reservation-areas" as const;

export function useReservationAreas() {
    return useQuery({
        queryKey: [QUERY_KEY_RESERVATION_AREAS],
        queryFn: async () => {
            const result = await getReservationAreas();

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        staleTime: 5 * 60_000,
    });
}

export function useCreateReservationArea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: ReservationAreaSchemaType) => {
            const result = await createReservationArea(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async (newArea) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });

            const previousAreas = queryClient.getQueryData<ReservationAreaWithTables[]>([
                QUERY_KEY_RESERVATION_AREAS,
            ]);

            const optimisticArea: ReservationAreaWithTables = {
                id: crypto.randomUUID(),
                restaurantId: "",
                name: newArea.name,
                description: newArea.description ?? null,
                color: newArea.color,
                createdAt: new Date(),
                updatedAt: new Date(),
                tables: [],
            };

            queryClient.setQueryData<ReservationAreaWithTables[]>(
                [QUERY_KEY_RESERVATION_AREAS],
                (old = []) => [...old, optimisticArea],
            );

            return { previousAreas };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousAreas) {
                queryClient.setQueryData([QUERY_KEY_RESERVATION_AREAS], context.previousAreas);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });
        },
    });
}

type UpdateAreaInput = {
    id: string;
    data: ReservationAreaSchemaType;
};

export function useUpdateReservationArea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: UpdateAreaInput) => {
            const result = await updateReservationArea(id, data);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });

            const previousAreas = queryClient.getQueryData<ReservationAreaWithTables[]>([
                QUERY_KEY_RESERVATION_AREAS,
            ]);

            queryClient.setQueryData<ReservationAreaWithTables[]>(
                [QUERY_KEY_RESERVATION_AREAS],
                (old = []) =>
                    old.map((area) =>
                        area.id === id
                            ? {
                                ...area,
                                name: data.name,
                                description: data.description ?? null,
                                color: data.color,
                            }
                            : area,
                    ),
            );

            return { previousAreas };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousAreas) {
                queryClient.setQueryData([QUERY_KEY_RESERVATION_AREAS], context.previousAreas);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });
        },
    });
}

export function useDeleteReservationArea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteReservationArea(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });

            const previousAreas = queryClient.getQueryData<ReservationAreaWithTables[]>([
                QUERY_KEY_RESERVATION_AREAS,
            ]);

            queryClient.setQueryData<ReservationAreaWithTables[]>(
                [QUERY_KEY_RESERVATION_AREAS],
                (old = []) => old.filter((area) => area.id !== id),
            );

            return { previousAreas };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousAreas) {
                queryClient.setQueryData([QUERY_KEY_RESERVATION_AREAS], context.previousAreas);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });
        },
    });
}
