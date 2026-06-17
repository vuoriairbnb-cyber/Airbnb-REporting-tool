import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Income lookup is not implemented yet." }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Income update is not implemented yet." }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Income deletion is not implemented yet." }, { status: 501 });
}
