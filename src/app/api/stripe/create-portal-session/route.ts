import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Stripe Customer Portal is not implemented yet." },
    { status: 501 }
  );
}
