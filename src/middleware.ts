import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

type OnboardingStatus = {
  userId: string | null;
  hasProfile: boolean;
  approvedAt: string | null;
  disclaimerAcceptedAt: string | null;
  propertyCount: number;
};

function canUseLocalAuthFallback(request: NextRequest) {
  return (
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "localhost", "::1"].includes(request.nextUrl.hostname)
  );
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")
    );
}

function canBypassNetworkAuthInLocalDev(request: NextRequest) {
  return canUseLocalAuthFallback(request) && hasSupabaseAuthCookie(request);
}

function isOnboardingComplete(status: OnboardingStatus) {
  return Boolean(
    status.userId &&
    status.hasProfile &&
    status.approvedAt &&
    status.disclaimerAcceptedAt &&
    status.propertyCount > 0
  );
}

function redirectWithCookies(url: URL, responseWithCookies: NextResponse) {
  const response = NextResponse.redirect(url);

  responseWithCookies.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

export async function middleware(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  let supabaseResponse = NextResponse.next({
    request
  });
  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      }
    }
  });
  let userId: string | null = null;

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    userId = user?.id ?? null;
  } catch (error) {
    if (canBypassNetworkAuthInLocalDev(request)) {
      console.warn(
        "Supabase auth check failed in local dev middleware; continuing with existing auth cookie.",
        error
      );

      return supabaseResponse;
    }

    return redirectWithCookies(loginUrl, supabaseResponse);
  }

  if (!userId) return redirectWithCookies(loginUrl, supabaseResponse);

  let profileResult;
  let propertiesResult;

  try {
    [profileResult, propertiesResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,approved_at,disclaimer_accepted_at")
        .eq("id", userId)
        .single(),
      supabase.from("properties").select("id").eq("user_id", userId)
    ]);
  } catch (error) {
    if (canBypassNetworkAuthInLocalDev(request)) {
      console.warn(
        "Supabase onboarding check failed in local dev middleware; continuing with existing auth cookie.",
        error
      );

      return supabaseResponse;
    }

    if (request.nextUrl.pathname === "/app/onboarding") {
      return supabaseResponse;
    }

    return redirectWithCookies(new URL("/app/onboarding", request.url), supabaseResponse);
  }

  const profile = profileResult.data as {
    id: string;
    approved_at: string | null;
    disclaimer_accepted_at: string | null;
  } | null;
  const status: OnboardingStatus = {
    userId,
    hasProfile: Boolean(profile && !profileResult.error),
    approvedAt: profile?.approved_at ?? null,
    disclaimerAcceptedAt: profile?.disclaimer_accepted_at ?? null,
    propertyCount: Array.isArray(propertiesResult.data) ? propertiesResult.data.length : 0
  };
  const complete = isOnboardingComplete(status);
  const pathname = request.nextUrl.pathname;

  if (!status.approvedAt) {
    return redirectWithCookies(
      new URL("/pending-approval", request.url),
      supabaseResponse
    );
  }

  if (pathname === "/app/onboarding") {
    if (complete) {
      return redirectWithCookies(
        new URL("/app/dashboard", request.url),
        supabaseResponse
      );
    }

    return supabaseResponse;
  }

  if (!complete) {
    return redirectWithCookies(new URL("/app/onboarding", request.url), supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/app/:path*"]
};
