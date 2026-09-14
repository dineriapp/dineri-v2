import { ComponentProps, ElementType } from "react"
import { GoogleIcon } from "./o-auth-icons";

export const SUPPORTED_OAUTH_PROVIDERS = ["google"] as const
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number]

export const SUPPORTED_OAUTH_PROVIDER_DETAILS: Record<
    SupportedOAuthProvider,
    { name: string; Icon: ElementType<ComponentProps<"svg">> }
> = {
    google: { name: "Continue with Google", Icon: GoogleIcon },
}