import { stripeClient } from "@better-auth/stripe/client";
import { customSessionClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./server";
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    plugins: [
        inferAdditionalFields<typeof auth>(),
        customSessionClient<typeof auth>(),
        stripeClient({
            subscription: true
        }),
        adminClient()

    ],
    fetchOptions: {
        credentials: "include",
    },
    sessionOptions: {
        refetchOnWindowFocus: false
    }
});