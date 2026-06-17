import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Receipt lookup is not implemented yet." }, { status: 501 });
}
