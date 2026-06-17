import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Receipt review is not implemented yet." },
    { status: 501 }
  );
}
