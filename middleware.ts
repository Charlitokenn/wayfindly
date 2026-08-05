import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, orgId, redirectToSignIn } = await auth();
  const { pathname } = req.nextUrl;

  const isPublicRoute = 
    pathname === "/" || 
    pathname === "/events" || 
    pathname.startsWith("/events/") || 
    pathname === "/api/payments/webhook";

  const isOnboardingRoute = pathname.startsWith("/onboarding");

  // Handle users who are not logged in
  if (!userId && !isPublicRoute) {
    return redirectToSignIn();
  }

  // Redirect to onboarding if not complete
  if (userId && !isPublicRoute) {
    const onboardingComplete = sessionClaims?.publicMetadata?.onboardingComplete;
    if (!onboardingComplete && !isOnboardingRoute) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }


  // Handle booth organization routing
  if (orgId && pathname === "/") {
    return NextResponse.redirect(new URL("/organization-profile", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
