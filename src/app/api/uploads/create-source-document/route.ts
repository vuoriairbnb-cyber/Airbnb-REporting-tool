import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Source document upload creation is not implemented yet." },
    { status: 501 }
  );
}
