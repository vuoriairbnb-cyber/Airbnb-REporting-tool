import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: [], next: "Connect Supabase property queries." });
}

export async function POST() {
  return NextResponse.json(
    { error: "Property creation is not implemented yet." },
    { status: 501 }
  );
}
