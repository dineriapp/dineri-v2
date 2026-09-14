import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createQRCode,
    deleteQRCode,
    getRestaurantQRCodes,
    updateQRCode,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/qr/actions";
import { QRCodeSchemaType } from "@/lib/validators/zod/qr-code.schema";
import { QRCodeType } from "@/drizzle/types";

const QUERY_KEY_QR_CODES = "restaurant-qr-codes" as const;

export function useRestaurantQRCodes() {
    return useQuery({
        queryKey: [QUERY_KEY_QR_CODES],
        queryFn: async () => {
            const result = await getRestaurantQRCodes();
            if (!result.success) {
                throw new Error(result.error || "Failed to fetch QR codes");
            }
            return result.data;
        },
    });
}

export function useCreateQRCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: QRCodeSchemaType) => {
            const result = await createQRCode(input);
            if (!result.success) {
                throw new Error(result.error || "Failed to create QR code");
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_QR_CODES] });
        },

    });
}

export function useUpdateQRCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ qrId, input }: { qrId: string; input: QRCodeSchemaType }) => {
            const result = await updateQRCode(qrId, input);
            if (!result.success) {
                throw new Error(result.error || "Failed to update QR code");
            }
            return result.data;
        },
        onMutate: async ({ qrId, input }) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_QR_CODES] });

            const previousQRCodes = queryClient.getQueryData<QRCodeType[]>([QUERY_KEY_QR_CODES]);

            if (previousQRCodes) {
                const updated = previousQRCodes.map((qr) =>
                    qr.id === qrId
                        ? {
                            ...qr,
                            label: input.label,
                            targetUrl: input.targetUrl,
                            foregroundColor: input.foregroundColor,
                            backgroundColor: input.backgroundColor,
                            shape: input.shape,
                        }
                        : qr
                );
                queryClient.setQueryData([QUERY_KEY_QR_CODES], updated);
            }

            return { previousQRCodes };
        },
        onError: (error: Error, variables, context) => {
            if (context?.previousQRCodes) {
                queryClient.setQueryData([QUERY_KEY_QR_CODES], context.previousQRCodes);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_QR_CODES] });
        },
    });
}

export function useDeleteQRCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (qrId: string) => {
            const result = await deleteQRCode(qrId);
            if (!result.success) {
                throw new Error(result.error || "Failed to delete QR code");
            }
            return result.data;
        },
        onMutate: async (qrId) => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEY_QR_CODES] });

            const previousQRCodes = queryClient.getQueryData<QRCodeType[]>([QUERY_KEY_QR_CODES]);

            if (previousQRCodes) {
                const filtered = previousQRCodes.filter((qr) => qr.id !== qrId);
                queryClient.setQueryData([QUERY_KEY_QR_CODES], filtered);
            }

            return { previousQRCodes };
        },
        onError: (error: Error, variables, context) => {
            if (context?.previousQRCodes) {
                queryClient.setQueryData([QUERY_KEY_QR_CODES], context.previousQRCodes);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_QR_CODES] });
        },
    });
}