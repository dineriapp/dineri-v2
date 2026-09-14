"use server";

import { ensureAuthenticatedUserLean } from "@/lib/auth/guards";
import { auth } from "@/lib/auth/server";
import { ApiResponse } from "@/lib/types";
import { headers } from "next/headers";

const CREDENTIAL_PROVIDER = "credential";

export type PasswordAccountStatus = {
  hasPassword: boolean;
  socialProviders: string[];
};

export async function getPasswordAccountStatus(): Promise<ApiResponse<PasswordAccountStatus>> {
  try {
    const guard = await ensureAuthenticatedUserLean();
    if (!guard.session) {
      return guard.json;
    }

    const accounts = await auth.api.listUserAccounts({ headers: await headers() });

    return {
      success: true,
      data: {
        hasPassword: accounts.some((account) => account.providerId === CREDENTIAL_PROVIDER),
        socialProviders: accounts
          .filter((account) => account.providerId !== CREDENTIAL_PROVIDER)
          .map((account) => account.providerId),
      },
    };
  } catch (error) {
    console.error("Failed to read password account status:", error);
    return { success: false, error: "Failed to check how you sign in" };
  }
}
