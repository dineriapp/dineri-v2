import "server-only";

import { db } from "@/drizzle/db";
import { qrCodes } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function bumpQRCodeScanCount(id: string): Promise<number | null> {
    const [updated] = await db
        .update(qrCodes)
        .set({ scans: sql`${qrCodes.scans} + 1` })
        .where(eq(qrCodes.id, id))
        .returning({ scans: qrCodes.scans });

    return updated?.scans ?? null;
}
