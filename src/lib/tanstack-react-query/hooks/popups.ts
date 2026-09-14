import {
    createPopup,
    deletePopup,
    getRestaurantPopups,
    togglePopupStatus,
    trackPopupClick,
    trackPopupImpression,
    updatePopup,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/popups/actions";
import { PopupType } from "@/drizzle/types";
import { PopupSchemaType } from "@/lib/validators/zod/popup.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_POPUPS = "restaurant-popups" as const;

export function useRestaurantPopups() {
    return useQuery({
        queryKey: [QUERY_KEY_POPUPS],
        queryFn: async () => {
            const result = await getRestaurantPopups();

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
    });
}

export function useCreatePopup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: PopupSchemaType) => {
            const result = await createPopup(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return { id: result.data.id, input };
        },

        onMutate: async (newPopup) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_POPUPS] });

            const previousPopups = queryClient.getQueryData<PopupType[]>([QUERY_KEY_POPUPS]);

            const optimisticPopup: PopupType = {
                id: crypto.randomUUID(),
                restaurantId: "",
                badge: newPopup.badge || null,
                title: newPopup.title,
                body: newPopup.body,
                cta: newPopup.cta,
                ctaUrl: newPopup.ctaUrl,
                footerNote: newPopup.footerNote || null,
                onPage: newPopup.onPage,
                trigger_after_seconds: newPopup.trigger_after_seconds,
                status: newPopup.status,
                impressions: 0,
                clicks: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            queryClient.setQueryData<PopupType[]>([QUERY_KEY_POPUPS], (old = []) => [
                optimisticPopup,
                ...old,
            ]);

            return { previousPopups };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousPopups) {
                queryClient.setQueryData([QUERY_KEY_POPUPS], context.previousPopups);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_POPUPS] });
        },
    });
}

type UpdateInput = {
    id: string;
    data: PopupSchemaType;
};

export function useUpdatePopup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: UpdateInput) => {
            const result = await updatePopup(id, data);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_POPUPS] });

            const previousPopups = queryClient.getQueryData<PopupType[]>([QUERY_KEY_POPUPS]);

            queryClient.setQueryData<PopupType[]>([QUERY_KEY_POPUPS], (old = []) =>
                old.map((popup) =>
                    popup.id === id
                        ? {
                            ...popup,
                            badge: data.badge || null,
                            title: data.title,
                            body: data.body,
                            cta: data.cta,
                            ctaUrl: data.ctaUrl,
                            footerNote: data.footerNote || null,
                            onPage: data.onPage,
                            trigger_after_seconds: data.trigger_after_seconds,
                            status: data.status,
                        }
                        : popup,
                ),
            );

            return { previousPopups };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousPopups) {
                queryClient.setQueryData([QUERY_KEY_POPUPS], context.previousPopups);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_POPUPS] });
        },
    });
}

type ToggleInput = {
    id: string;
    status: "live" | "paused";
};

export function useTogglePopupStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: ToggleInput) => {
            const result = await togglePopupStatus(id, status);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_POPUPS] });

            const previousPopups = queryClient.getQueryData<PopupType[]>([QUERY_KEY_POPUPS]);

            queryClient.setQueryData<PopupType[]>([QUERY_KEY_POPUPS], (old = []) =>
                old.map((popup) => (popup.id === id ? { ...popup, status } : popup)),
            );

            return { previousPopups };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousPopups) {
                queryClient.setQueryData([QUERY_KEY_POPUPS], context.previousPopups);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_POPUPS] });
        },
    });
}

// Public-page analytics. These run for anonymous visitors, so they never touch
// the dashboard cache - the merchant sees fresh numbers on their next fetch.
export function useTrackPopupImpression() {
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await trackPopupImpression(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        retry: 1,
    });
}

export function useTrackPopupClick() {
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await trackPopupClick(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
    });
}

export function useDeletePopup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deletePopup(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_POPUPS] });

            const previousPopups = queryClient.getQueryData<PopupType[]>([QUERY_KEY_POPUPS]);

            queryClient.setQueryData<PopupType[]>([QUERY_KEY_POPUPS], (old = []) =>
                old.filter((popup) => popup.id !== id),
            );

            return { previousPopups };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousPopups) {
                queryClient.setQueryData([QUERY_KEY_POPUPS], context.previousPopups);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_POPUPS] });
        },
    });
}
