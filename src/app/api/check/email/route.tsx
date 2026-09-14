import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { limitApi } from "@/lib/rate-limit/guard";
import { RATE_LIMIT_MESSAGE, rateLimitHeaders } from "@/lib/rate-limit/http";
import { ApiResponse } from "@/lib/types";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(req: NextRequest) {
  const limit = await limitApi("check-email", "emailCheck", req.headers);
  if (!limit.allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: RATE_LIMIT_MESSAGE },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  try {
    const body = await req.json();

    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Invalid email address",
        },
        { status: 400, headers: rateLimitHeaders(limit) },
      );
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, parsed.data.email),
      columns: {
        id: true,
      },
    });

    return NextResponse.json<ApiResponse<{ exists: boolean }>>(
      {
        success: true,
        data: {
          exists: !!existingUser,
        },
      },
      { headers: rateLimitHeaders(limit) },
    );
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Something went wrong",
      },
      { status: 500, headers: rateLimitHeaders(limit) },
    );
  }
}
