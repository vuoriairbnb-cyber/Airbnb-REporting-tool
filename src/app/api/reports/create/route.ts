import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Report generation is not implemented yet." },
    { status: 501 }
  );
}
