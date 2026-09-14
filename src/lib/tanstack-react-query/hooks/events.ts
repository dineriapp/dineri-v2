import { createEvent, deleteEvent, getEvents, toggleEventActive, updateEvent } from "@/app/(dashboard)/dashboard/(with-sidebar)/events/actions";
import { EventType } from "@/drizzle/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EventSchemaType } from "./event.schema";

const QUERY_KEY_EVENTS = "restaurant-events";

export function useEvents() {
    return useQuery<EventType[]>({
        queryKey: [QUERY_KEY_EVENTS],
        queryFn: async () => {
            const result = await getEvents();
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: EventSchemaType) => {
            const result = await createEvent(input);
            if (!result.success) throw new Error(result.error);
            return { id: result.data.id, input };
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_EVENTS] });
        },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: EventSchemaType }) => {
            const result = await updateEvent(id, data);
            if (!result.success) throw new Error(result.error);
            return { id, data };
        },

        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_EVENTS] });

            const previous = queryClient.getQueryData<EventType[]>([QUERY_KEY_EVENTS]);

            queryClient.setQueryData<EventType[]>([QUERY_KEY_EVENTS], (old = []) =>
                old.map((event) =>
                    event.id === id
                        ? {
                            ...event,
                            ...data,
                            updatedAt: new Date(),
                        }
                        : event
                )
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_EVENTS], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_EVENTS] });
        },
    });
}

export function useToggleEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
            const result = await toggleEventActive(id, active);
            if (!result.success) throw new Error(result.error);
            return { id, active };
        },

        onMutate: async ({ id, active }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_EVENTS] });

            const previous = queryClient.getQueryData<EventType[]>([QUERY_KEY_EVENTS]);

            queryClient.setQueryData<EventType[]>([QUERY_KEY_EVENTS], (old = []) =>
                old.map((event) =>
                    event.id === id ? { ...event, active } : event
                )
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_EVENTS], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_EVENTS] });
        },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteEvent(id);
            if (!result.success) throw new Error(result.error);
            return { id };
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_EVENTS] });

            const previous = queryClient.getQueryData<EventType[]>([QUERY_KEY_EVENTS]);

            queryClient.setQueryData<EventType[]>([QUERY_KEY_EVENTS], (old = []) =>
                old.filter((event) => event.id !== id)
            );

            return { previous };
        },

        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData([QUERY_KEY_EVENTS], context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_EVENTS] });
        },
    });
}
