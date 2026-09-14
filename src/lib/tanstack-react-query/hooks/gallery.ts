import { createGalleryItem, deleteGalleryItem, getRestaurantGalleryItems, reorderGalleryItems, toggleGalleryItemActive, updateGalleryItem } from "@/app/(dashboard)/dashboard/(with-sidebar)/gallery/actions";
import { GalleryType } from "@/drizzle/types";
import { GallerySchemaType } from "@/lib/validators/zod/gallery.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_GALLERY = "restaurant-gallery" as const;

export function useRestaurantGalleryItems() {
    return useQuery<GalleryType[]>({
        queryKey: [QUERY_KEY_GALLERY],
        queryFn: async () => {
            const result = await getRestaurantGalleryItems();
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

// Create hook
export function useCreateGalleryItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: GallerySchemaType) => {
            const result = await createGalleryItem(input);
            if (!result.success) throw new Error(result.error);
            return { id: result.data.id, input };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_GALLERY] });
        },
    });
}

// Update hook
export function useUpdateGalleryItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: GallerySchemaType }) => {
            const result = await updateGalleryItem(id, data);
            if (!result.success) throw new Error(result.error);
            return { id, data };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_GALLERY] });
        },
    });
}

// Delete hook
export function useDeleteGalleryItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteGalleryItem(id);
            if (!result.success) throw new Error(result.error);
            return { id };
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_GALLERY] });
            const previous = queryClient.getQueryData<GalleryType[]>([QUERY_KEY_GALLERY]);
            queryClient.setQueryData<GalleryType[]>([QUERY_KEY_GALLERY], (old = []) =>
                old.filter((item) => item.id !== id)
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData([QUERY_KEY_GALLERY], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_GALLERY] });
        },
    });
}

// Toggle active hook
export function useToggleGalleryItemActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
            const result = await toggleGalleryItemActive(id, active);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onMutate: async ({ id, active }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_GALLERY] });
            const previous = queryClient.getQueryData<GalleryType[]>([QUERY_KEY_GALLERY]);
            queryClient.setQueryData<GalleryType[]>([QUERY_KEY_GALLERY], (old = []) =>
                old.map((item) => (item.id === id ? { ...item, active } : item))
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) queryClient.setQueryData([QUERY_KEY_GALLERY], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_GALLERY] });
        },
    });
}

// Reorder hook
export function useReorderGalleryItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (items: { id: string; sort_order: number }[]) => {
            const result = await reorderGalleryItems(items);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_GALLERY] });
        },
    });
}