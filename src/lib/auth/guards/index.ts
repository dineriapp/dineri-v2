import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../server";

type AuthSession = NonNullable<
    Awaited<ReturnType<typeof auth.api.getSession>>
>;
type LeanAuthSession = NonNullable<Awaited<ReturnType<typeof getLeanSession>>>;

type AuthGuardResult =
    | {
        session: AuthSession;
        response: null;
        json: null
    }
    | {
        session: null;
        response: NextResponse;
        json: {
            success: false;
            error: string;
        };
    };

type LeanAuthGuardResult =
    | { session: LeanAuthSession; response: null; json: null }
    | { session: null; response: NextResponse; json: { success: false; error: string } };

export async function ensureAdminAccess(): Promise<AuthGuardResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== "admin") {
        return {
            session: null,
            response: NextResponse.json(
                {
                    success: false,
                    error: "Admin access required."
                },
                { status: 403 }
            ),
            json: {
                success: false,
                error: "Admin access required."
            }
        };
    }

    return { session, response: null, json: null };
}

export async function ensureAuthenticatedUser(): Promise<AuthGuardResult> {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        return {
            session: null,
            response: NextResponse.json(
                {
                    success: false,
                    error: "Login required."
                },
                { status: 401 }
            ),
            json: {
                success: false,
                error: "Login required."
            }
        };
    }

    return { session, response: null, json: null };
}

export async function getLeanSession() {
    const requestHeaders = await headers();
    const modifiedHeaders = new Headers(requestHeaders);
    modifiedHeaders.set("x-skip-enrichment", "true");
    const result = await auth.api.getSession({
        headers: modifiedHeaders
    });
    if (!result) return null;

    // Cast to a type that excludes the enriched fields
    return result as Omit<typeof result, 'user'> & {
        user: Omit<typeof result.user, 'restaurants' | 'subscription'>;
    };
}

export async function ensureAuthenticatedUserLean(): Promise<LeanAuthGuardResult> {
    const session = await getLeanSession();

    if (!session) {
        return {
            session: null,
            response: NextResponse.json(
                { success: false, error: "Login required." },
                { status: 401 }
            ),
            json: { success: false, error: "Login required." }
        };
    }

    return { session, response: null, json: null };
}