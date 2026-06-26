import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { createClient } from "@/lib/supabase/server";
import { apiError, parseJsonBody } from "@/server/reporting/api";

export const runtime = "nodejs";

const createCheckoutSessionSchema = z.object({
  plan: z.enum(["starter", "pro"])
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Could not create Stripe checkout session.";
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createCheckoutSessionSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid billing plan.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return apiError("Authentication required.", 401);
  }

  try {
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      fullName:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      origin: new URL(request.url).origin,
      plan: parsed.data.plan
    });

    if (!session.url) {
      return apiError("Stripe checkout did not return a redirect URL.", 500);
    }

    return NextResponse.json({
      data: {
        url: session.url
      }
    });
  } catch (error) {
    return apiError(getErrorMessage(error), 400);
  }
}
