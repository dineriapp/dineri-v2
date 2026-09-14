import {
  createFaq,
  createFaqCategory,
  deleteFaq,
  deleteFaqCategory,
  getFaqCategoryWithItems,
  reorderFaqCategories,
  reorderFaqs,
  toggleFaqActive,
  toggleFaqCategoryActive,
  updateFaq,
  updateFaqCategory,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/faq/actions";
import { FaqCategoryWithItems } from "@/drizzle/types";
import { FaqCategorySchemaType, FaqSchemaType } from "@/lib/validators/zod/faq.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_FAQS = "restaurant-faqs" as const;

export function useFaqCategoryWithItems() {
  return useQuery<FaqCategoryWithItems[]>({
    queryKey: [QUERY_KEY_FAQS],
    queryFn: async () => {
      const result = await getFaqCategoryWithItems();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useCreateFaqCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FaqCategorySchemaType) => {
      const result = await createFaqCategory(input);
      if (!result.success) throw new Error(result.error);
      return { id: result.data.id, input };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useUpdateFaqCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FaqCategorySchemaType }) => {
      const result = await updateFaqCategory(id, data);
      if (!result.success) throw new Error(result.error);
      return { id, data };
    },

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY_FAQS] });

      const previous = queryClient.getQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS]);

      queryClient.setQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS], (old = []) =>
        old.map((category) =>
          category.id === id
            ? {
                ...category,
                name: data.name,
                active: data.active,
                sort_order: data.sort_order,
              }
            : category,
        ),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY_FAQS], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useDeleteFaqCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFaqCategory(id);
      if (!result.success) throw new Error(result.error);
      return { id };
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY_FAQS] });

      const previous = queryClient.getQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS]);

      queryClient.setQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS], (old = []) =>
        old.filter((category) => category.id !== id),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY_FAQS], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useReorderFaqCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: { id: string; sort_order: number }[]) => {
      const result = await reorderFaqCategories(categories);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useToggleFaqCategoryActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const result = await toggleFaqCategoryActive(id, active);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY_FAQS] });
      const previous = queryClient.getQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS]);
      queryClient.setQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS], (old = []) =>
        old.map((cat) => (cat.id === id ? { ...cat, active } : cat)),
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) queryClient.setQueryData([QUERY_KEY_FAQS], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FaqSchemaType) => {
      const result = await createFaq(input);
      if (!result.success) throw new Error(result.error);
      return { id: result.data.id, input };
    },

    onMutate: async (newFaq) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY_FAQS] });

      const previous = queryClient.getQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS]);

      queryClient.setQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS], (old = []) =>
        old.map((category) =>
          category.id === newFaq.categoryId
            ? {
                ...category,
                items: [
                  ...category.items,
                  {
                    id: crypto.randomUUID(), // temporary until the server answers
                    categoryId: newFaq.categoryId,
                    question: newFaq.question,
                    answer: newFaq.answer,
                    active: newFaq.active,
                    sort_order: newFaq.sort_order,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ].sort((a, b) => a.sort_order - b.sort_order),
              }
            : category,
        ),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY_FAQS], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FaqSchemaType }) => {
      const result = await updateFaq(id, data);
      if (!result.success) throw new Error(result.error);
      return { id, data };
    },

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY_FAQS] });

      const previous = queryClient.getQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS]);

      queryClient.setQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS], (old = []) =>
        old.map((category) => {
          let items = category.items.filter((item) => item.id !== id);

          if (category.id === data.categoryId) {
            items = [
              ...items,
              {
                id,
                categoryId: data.categoryId,
                question: data.question,
                answer: data.answer,
                active: data.active,
                sort_order: data.sort_order,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];
          }

          return { ...category, items: items.sort((a, b) => a.sort_order - b.sort_order) };
        }),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY_FAQS], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useToggleFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const result = await toggleFaqActive(id, active);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },

    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY_FAQS] });

      const previous = queryClient.getQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS]);

      queryClient.setQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS], (old = []) =>
        old.map((category) => ({
          ...category,
          items: category.items.map((item) => (item.id === id ? { ...item, active } : item)),
        })),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY_FAQS], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFaq(id);
      if (!result.success) throw new Error(result.error);
      return { id };
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY_FAQS] });

      const previous = queryClient.getQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS]);

      queryClient.setQueryData<FaqCategoryWithItems[]>([QUERY_KEY_FAQS], (old = []) =>
        old.map((category) => ({
          ...category,
          items: category.items.filter((item) => item.id !== id),
        })),
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY_FAQS], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}

export function useReorderFaqs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const result = await reorderFaqs(items);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FAQS] });
    },
  });
}
