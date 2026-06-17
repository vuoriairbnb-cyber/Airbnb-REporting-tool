import { NextResponse } from "next/server";
import { apiError } from "@/server/reporting/api";
import { getCurrentUserId, getReceipts } from "@/server/reporting/queries";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const data = await getReceipts();

  return NextResponse.json({ data });
}
