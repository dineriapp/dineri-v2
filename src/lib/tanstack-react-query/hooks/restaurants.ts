import { getUserRestaurants, UserRestaurant } from "@/server/actions/get-user-restaurants.action";
import { useQuery } from "@tanstack/react-query";

const QUERY_KEY_USER_RESTAURANTS = "user-restaurants" as const;

export function useUserRestaurants() {
    return useQuery<UserRestaurant[]>({
        queryKey: [QUERY_KEY_USER_RESTAURANTS],
        queryFn: async () => {
            const result = await getUserRestaurants();
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}
