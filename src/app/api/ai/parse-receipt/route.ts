import { NextResponse } from "next/server";
import { getReceiptParser } from "@/lib/ai";

export async function POST() {
  const parser = getReceiptParser();
  const result = await parser({
    fileBuffer: Buffer.from(""),
    mimeType: "application/octet-stream",
    scanMode: "fast",
    categoryHints: []
  });

  return NextResponse.json({
    data: result,
    next: "Fetch the owned source document from private storage before parsing."
  });
}
