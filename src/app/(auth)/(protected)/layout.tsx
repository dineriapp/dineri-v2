"use client";
import Loader from "@/components/ui/loader";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { session, isPending } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect");

    useEffect(() => {
        if (!isPending && session?.user) {
            // Only allow same-origin relative paths.
            // Rejects: https://attacker.com, //attacker.com, etc.
            const isSafeRedirect = redirect && /^\/(?!\/)/.test(redirect);
            if (isSafeRedirect) {
                router.replace(redirect);
            } else if (session.user.role === "admin") {
                router.replace("/admin");
            } else {
                router.replace("/dashboard");
            }
        }
    }, [session, isPending, redirect, router]);

    if (isPending || session?.user) {
        return <Loader className="" />;
    }

    return (
        <>
            {children}
        </>
    );
}