import { createSuccessStory, deleteSuccessStory, getSuccessStories, reorderSuccessStories, toggleSuccessStoryActive, updateSuccessStory } from "@/app/(dashboard)/dashboard/(with-sidebar)/success/actions";
import { SuccessStoryType } from "@/drizzle/types";
import { SuccessStorySchemaType } from "@/lib/validators/zod/success-story.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_SUCCESS_STORIES = "restaurant-success-stories";

export function useSuccessStories() {
    return useQuery<SuccessStoryType[]>({
        queryKey: [QUERY_KEY_SUCCESS_STORIES],
        queryFn: async () => {
            const result = await getSuccessStories();
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function useCreateSuccessStory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: SuccessStorySchemaType) => {
            const result = await createSuccessStory(input);
            if (!result.success) throw new Error(result.error);
            return { id: result.data.id, input };
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });
        },
    });
}

export function useUpdateSuccessStory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: SuccessStorySchemaType }) => {
            const result = await updateSuccessStory(id, data);
            if (!result.success) throw new Error(result.error);
            return { id, data };
        },

        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });

            const previousStories = queryClient.getQueryData<SuccessStoryType[]>([QUERY_KEY_SUCCESS_STORIES]);

            queryClient.setQueryData<SuccessStoryType[]>([QUERY_KEY_SUCCESS_STORIES], (old = []) =>
                old.map((story) =>
                    story.id === id
                        ? {
                            ...story,
                            title: data.title,
                            body: data.body,
                            image: data.image[0],
                            active: data.active,
                            updatedAt: new Date(),
                        }
                        : story
                )
            );

            return { previousStories };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousStories) {
                queryClient.setQueryData([QUERY_KEY_SUCCESS_STORIES], context.previousStories);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });
        },
    });
}

export function useToggleSuccessStory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
            const result = await toggleSuccessStoryActive(id, active);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },

        onMutate: async ({ id, active }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });

            const previousStories = queryClient.getQueryData<SuccessStoryType[]>([QUERY_KEY_SUCCESS_STORIES]);

            queryClient.setQueryData<SuccessStoryType[]>([QUERY_KEY_SUCCESS_STORIES], (old = []) =>
                old.map((story) =>
                    story.id === id ? { ...story, active } : story
                )
            );

            return { previousStories };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousStories) {
                queryClient.setQueryData([QUERY_KEY_SUCCESS_STORIES], context.previousStories);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });
        },
    });
}

export function useDeleteSuccessStory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteSuccessStory(id);
            if (!result.success) throw new Error(result.error);
            return { id };
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });

            const previousStories = queryClient.getQueryData<SuccessStoryType[]>([QUERY_KEY_SUCCESS_STORIES]);

            queryClient.setQueryData<SuccessStoryType[]>([QUERY_KEY_SUCCESS_STORIES], (old = []) =>
                old.filter((story) => story.id !== id)
            );

            return { previousStories };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousStories) {
                queryClient.setQueryData([QUERY_KEY_SUCCESS_STORIES], context.previousStories);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });
        },
    });
}

export function useReorderSuccessStories() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (items: { id: string; sort_order: number }[]) => {
            const result = await reorderSuccessStories(items);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_SUCCESS_STORIES] });
        },
    });
}