import {
    createReservationTable,
    deleteReservationTable,
    toggleReservationTableActive,
    updateReservationTable,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/reservations/_components/tables/actions";
import { ReservationAreaWithTables, ReservationTableType } from "@/drizzle/types";
import { ReservationTableSchemaType } from "@/lib/validators/zod/reservation-table.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY_RESERVATION_AREAS } from "./reservation-areas";

function mapAreas(
    old: ReservationAreaWithTables[] = [],
    mutate: (tables: ReservationTableType[], areaId: string) => ReservationTableType[],
) {
    return old.map((area) => ({ ...area, tables: mutate(area.tables, area.id) }));
}

export function useCreateReservationTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: ReservationTableSchemaType) => {
            const result = await createReservationTable(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async (newTable) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });

            const previousAreas = queryClient.getQueryData<ReservationAreaWithTables[]>([
                QUERY_KEY_RESERVATION_AREAS,
            ]);

            const optimisticTable: ReservationTableType = {
                id: crypto.randomUUID(),
                areaId: newTable.areaId,
                label: newTable.label,
                seats: newTable.seats,
                active: newTable.active,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            queryClient.setQueryData<ReservationAreaWithTables[]>(
                [QUERY_KEY_RESERVATION_AREAS],
                (old = []) =>
                    mapAreas(old, (tables, areaId) =>
                        areaId === newTable.areaId ? [...tables, optimisticTable] : tables,
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

type UpdateTableInput = {
    id: string;
    data: ReservationTableSchemaType;
};

export function useUpdateReservationTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: UpdateTableInput) => {
            const result = await updateReservationTable(id, data);

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
                (old = []) => {
                    // Remove from every area first, then re-insert into the (possibly new) target area.
                    const withoutTable = mapAreas(old, (tables) =>
                        tables.filter((t) => t.id !== id),
                    );
                    const existing = old.flatMap((a) => a.tables).find((t) => t.id === id);
                    if (!existing) return withoutTable;

                    const updated: ReservationTableType = {
                        ...existing,
                        areaId: data.areaId,
                        label: data.label,
                        seats: data.seats,
                        active: data.active,
                    };

                    return mapAreas(withoutTable, (tables, areaId) =>
                        areaId === data.areaId ? [...tables, updated] : tables,
                    );
                },
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

type ToggleTableInput = {
    id: string;
    active: boolean;
};

export function useToggleReservationTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, active }: ToggleTableInput) => {
            const result = await toggleReservationTableActive(id, active);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async ({ id, active }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_RESERVATION_AREAS] });

            const previousAreas = queryClient.getQueryData<ReservationAreaWithTables[]>([
                QUERY_KEY_RESERVATION_AREAS,
            ]);

            queryClient.setQueryData<ReservationAreaWithTables[]>(
                [QUERY_KEY_RESERVATION_AREAS],
                (old = []) =>
                    mapAreas(old, (tables) =>
                        tables.map((t) => (t.id === id ? { ...t, active } : t)),
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

export function useDeleteReservationTable() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteReservationTable(id);

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
                (old = []) => mapAreas(old, (tables) => tables.filter((t) => t.id !== id)),
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
