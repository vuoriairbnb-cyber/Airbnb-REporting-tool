import { NextResponse } from "next/server";
import { apiError } from "@/server/reporting/api";
import { getCurrentUserId, getReceipt } from "@/server/reporting/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const { id } = await params;
  const receipt = await getReceipt(id);

  if (!receipt) return apiError("Receipt not found.", 404);

  return NextResponse.json({ data: receipt });
}
