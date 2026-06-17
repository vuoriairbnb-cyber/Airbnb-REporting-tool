import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: [], next: "Connect Supabase expense queries." });
}

export async function POST() {
  return NextResponse.json(
    { error: "Expense creation is not implemented yet." },
    { status: 501 }
  );
}
