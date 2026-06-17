import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Accurate receipt reparse is not implemented yet." },
    { status: 501 }
  );
}
