import "@clerk/nextjs/server";

declare global {
  interface CustomJwtSessionClaims {
    publicMetadata: {
      onboardingComplete?: boolean;
      role?: "admin" | "booth" | "attendee";
      permissions?: string[];
    };
  }
}
