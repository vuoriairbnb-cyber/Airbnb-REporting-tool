import { NextResponse } from "next/server";
import { constructStripeEvent, handleStripeWebhookEvent } from "@/lib/stripe/webhook";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Stripe webhook handling failed.";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 }
    );
  }

  const payload = await request.text();

  try {
    const event = constructStripeEvent(payload, signature);
    await handleStripeWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
