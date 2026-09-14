"use client"

import { authClient } from "@/lib/auth/client"
import { BetterAuthActionButton } from "./better-auth-action-button"
import { SUPPORTED_OAUTH_PROVIDER_DETAILS, SUPPORTED_OAUTH_PROVIDERS } from "./o-auth-providers"
import { cn } from "@/lib/utils"

export function SocialAuthButtons({ className, redirect }: { className?: string, redirect: string | null }) {
    return SUPPORTED_OAUTH_PROVIDERS.map(provider => {
        const Icon = SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].Icon

        return (
            <BetterAuthActionButton
                variant="secondary"
                key={provider}
                className={cn(className)}
                action={() => {
                    return authClient.signIn.social({
                        provider,
                        callbackURL: redirect ?? "/",
                    })
                }}
            >
                <Icon />
                {SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].name}
            </BetterAuthActionButton>
        )
    })
}