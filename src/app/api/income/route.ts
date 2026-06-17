import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: [], next: "Connect Supabase income queries." });
}

export async function POST() {
  return NextResponse.json(
    { error: "Income creation is not implemented yet." },
    { status: 501 }
  );
}
