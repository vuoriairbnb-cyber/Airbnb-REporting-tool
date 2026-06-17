import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Property lookup is not implemented yet." },
    { status: 501 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Property update is not implemented yet." },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Property deletion is not implemented yet." },
    { status: 501 }
  );
}
