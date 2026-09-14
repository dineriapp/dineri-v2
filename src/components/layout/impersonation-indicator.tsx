"use client"

import { UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/client"
import { useAuth } from "@/lib/auth/hooks/use-auth"
import { Button } from "../ui/button"

export function ImpersonationIndicator() {
    const router = useRouter()
    const { session, refetchSession: refetch } = useAuth()

    if (session?.session.impersonatedBy == null) return null

    return (
        <div className="fixed bottom-4 right-4 z-50000">
            <Button
                onClick={() =>
                    authClient.admin.stopImpersonating(undefined, {
                        onSuccess: () => {
                            router.push("/admin")
                            refetch()
                        },
                    })
                }
                variant="destructive"
                size="sm"
            >
                <UserX className="size-4" />
            </Button>
        </div>
    )
}