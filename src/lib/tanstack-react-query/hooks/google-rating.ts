import {
    connectGooglePlaceId,
    disconnectGooglePlaceId,
    getActiveRestaurantGoogleRating,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/settings/integrations/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY_GOOGLE_RATING = "restaurant-google-rating" as const;

export function useGoogleRating() {
    return useQuery({
        queryKey: [QUERY_KEY_GOOGLE_RATING],
        queryFn: async () => {
            const result = await getActiveRestaurantGoogleRating();

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
    });
}

export function useConnectGooglePlaceId() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (placeId: string) => {
            const result = await connectGooglePlaceId(placeId);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData([QUERY_KEY_GOOGLE_RATING], data);
        },
    });
}

export function useDisconnectGooglePlaceId() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const result = await disconnectGooglePlaceId();

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
        onSuccess: () => {
            queryClient.setQueryData([QUERY_KEY_GOOGLE_RATING], null);
        },
    });
}
