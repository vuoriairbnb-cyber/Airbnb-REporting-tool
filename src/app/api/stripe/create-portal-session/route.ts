import { NextResponse } from "next/server";
import { getEntitlements } from "@/lib/stripe/entitlements";
import { createBillingPortalSession } from "@/lib/stripe/portal";
import { getCurrentUserId } from "@/server/reporting/queries";
import { apiError } from "@/server/reporting/api";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Could not open Stripe billing portal.";
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return apiError("Authentication required.", 401);
  }

  const entitlements = await getEntitlements(userId);

  if (!entitlements.isStripePortalConfigured) {
    return apiError("Stripe billing portal is not configured yet.", 400);
  }

  if (!entitlements.stripeCustomerId) {
    return apiError("No Stripe customer was found for this account yet.", 400);
  }

  try {
    const session = await createBillingPortalSession({
      customerId: entitlements.stripeCustomerId,
      origin: new URL(request.url).origin
    });

    return NextResponse.json({
      data: {
        url: session.url
      }
    });
  } catch (error) {
    return apiError(getErrorMessage(error), 400);
  }
}
