import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Expense lookup is not implemented yet." },
    { status: 501 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Expense update is not implemented yet." },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Expense deletion is not implemented yet." },
    { status: 501 }
  );
}
