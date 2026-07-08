import { auth } from "@clerk/nextjs/server";
import React from "react";

interface ShowProps {
  role?: "admin" | "booth" | "attendee";
  hasPermission?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditional rendering component based on Clerk roles and permissions.
 */
export async function Show({ role, hasPermission, fallback = null, children }: ShowProps) {
  const { userId, orgId, sessionClaims } = await auth();

  if (!userId) {
    return <>{fallback}</>;
  }

  // Admin check (using publicMetadata or a specific admin org)
  if (role === "admin") {
    const isAdmin = sessionClaims?.publicMetadata?.role === "admin";
    if (isAdmin) return <>{children}</>;
    return <>{fallback}</>;
  }

  // Booth check (must be in an organization)
  if (role === "booth") {
    if (orgId) return <>{children}</>;
    return <>{fallback}</>;
  }

  // Attendee check (default for logged in users not in an admin/booth role)
  if (role === "attendee") {
    if (!orgId) return <>{children}</>;
    return <>{fallback}</>;
  }

  // Permission-based check
  if (hasPermission) {
    // This assumes permissions are mapped in session claims or org metadata
    const permissions = (sessionClaims?.publicMetadata?.permissions as string[]) || [];
    if (permissions.includes(hasPermission)) return <>{children}</>;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
