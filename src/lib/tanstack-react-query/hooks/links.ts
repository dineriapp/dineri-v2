
import { createRestaurantLink, deleteRestaurantLink, getRestaurantLinks, reorderRestaurantLinks, toggleRestaurantLinkActive, trackLinkClick, updateRestaurantLink } from "@/app/(dashboard)/dashboard/(with-sidebar)/links/actions";
import { LinkType } from "@/drizzle/types";
import { LinkSchemaType } from "@/lib/validators/zod/link.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_LINK = "restaurant-links" as const

export function useRestaurantLinks() {
    return useQuery({
        queryKey: [QUERY_KEY_LINK],
        queryFn: async () => {
            const result = await getRestaurantLinks();

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
    });
}

// Public-page analytics. Runs for anonymous visitors, so it never touches the
// dashboard cache - the merchant sees fresh numbers on their next fetch.
export function useTrackLinkClick() {
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await trackLinkClick(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        retry: 1,
    });
}

export function useCreateRestaurantLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: LinkSchemaType) => {
            const result = await createRestaurantLink(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return {
                id: result.data.id,
                input,
            };
        },

        onMutate: async (newLink) => {
            await queryClient.cancelQueries({
                queryKey: [QUERY_KEY_LINK],
            });

            const previousLinks =
                queryClient.getQueryData<LinkType[]>(
                    [QUERY_KEY_LINK]
                );

            const optimisticLink: LinkType = {
                id: crypto.randomUUID(),
                restaurantId: "",
                title: newLink.title,
                url: newLink.url,
                icon_key: newLink.icon_key,
                active: newLink.active,
                sort_order:
                    (previousLinks?.reduce(
                        (max, link) =>
                            Math.max(max, link.sort_order),
                        -1
                    ) ?? -1) + 1,
                clicks: 0,
                description: "",
                created_at: new Date(),
                updated_at: new Date(),
            };

            queryClient.setQueryData<LinkType[]>(
                [QUERY_KEY_LINK],
                (old = []) => [
                    ...old,
                    optimisticLink,
                ]
            );

            return { previousLinks };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousLinks) {
                queryClient.setQueryData(
                    [QUERY_KEY_LINK],
                    context.previousLinks
                );
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEY_LINK],
            });
        },
    });
}

type UpdateInput = {
    id: string;
    data: LinkSchemaType;
};

export function useUpdateRestaurantLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: UpdateInput) => {
            const result =
                await updateRestaurantLink(
                    id,
                    data
                );

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async ({
            id,
            data,
        }) => {
            await queryClient.cancelQueries({
                queryKey: [QUERY_KEY_LINK],
            });

            const previousLinks =
                queryClient.getQueryData<
                    LinkType[]
                >([QUERY_KEY_LINK]);

            queryClient.setQueryData<
                LinkType[]
            >(
                [QUERY_KEY_LINK],
                (old = []) =>
                    old.map((link) =>
                        link.id === id
                            ? {
                                ...link,
                                title:
                                    data.title,
                                url: data.url,
                                icon_key:
                                    data.icon_key,
                                active:
                                    data.active,
                            }
                            : link
                    )
            );

            return {
                previousLinks,
            };
        },

        onError: (
            _error,
            _variables,
            context
        ) => {
            if (
                context?.previousLinks
            ) {
                queryClient.setQueryData(
                    [QUERY_KEY_LINK],
                    context.previousLinks
                );
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEY_LINK],
            });
        },
    });
}

type ToggleInput = {
    id: string;
    active: boolean;
};

export function useToggleRestaurantLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            active,
        }: ToggleInput) => {
            const result =
                await toggleRestaurantLinkActive(
                    id,
                    active
                );

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async ({
            id,
            active,
        }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_LINK], });

            const previousLinks =
                queryClient.getQueryData<
                    LinkType[]
                >([QUERY_KEY_LINK]);

            queryClient.setQueryData<
                LinkType[]
            >(
                [QUERY_KEY_LINK],
                (old = []) =>
                    old.map((link) =>
                        link.id === id
                            ? {
                                ...link,
                                active,
                            }
                            : link
                    )
            );

            return {
                previousLinks,
            };
        },

        onError: (
            _error,
            _variables,
            context
        ) => {
            if (
                context?.previousLinks
            ) {
                queryClient.setQueryData(
                    [QUERY_KEY_LINK],
                    context.previousLinks
                );
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEY_LINK],
            });
        },
    });
}

export function useReorderRestaurantLinks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            links: {
                id: string;
                sort_order: number;
            }[]
        ) => {
            const result =
                await reorderRestaurantLinks(links);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEY_LINK],
            });
        },
    });
}

export function useDeleteRestaurantLink() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result =
                await deleteRestaurantLink(id);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({
                queryKey: [QUERY_KEY_LINK],
            });

            const previousLinks =
                queryClient.getQueryData<LinkType[]>(
                    [QUERY_KEY_LINK]
                );

            queryClient.setQueryData<LinkType[]>(
                [QUERY_KEY_LINK],
                (old = []) =>
                    old.filter(
                        (link) => link.id !== id
                    )
            );

            return {
                previousLinks,
            };
        },



        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEY_LINK],
            });
        },
    });
}