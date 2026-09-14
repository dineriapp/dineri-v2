import { authClient } from "../client";

export const useAuth = () => {
    const {
        data: session,
        isPending,
        error,
        isRefetching,
        refetch,
    } = authClient.useSession();

    const user = session?.user ?? null;

    return {
        // core
        session,
        user,

        // state
        isLoading: isPending,
        isPending,
        isRefetching,
        isAuthenticated: !!user,
        isGuest: !user && !isPending,

        // error handling
        error,
        hasError: !!error,

        // actions
        refetchSession: refetch,
    };
};