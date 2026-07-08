"use server";

import { getInsForgeServer } from "@/lib/insforge/client";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Completes the onboarding process for a user.
 * 1. Creates/Updates user profile in InsForge.
 * 2. Updates Clerk public metadata.
 */
export async function completeOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;

  const insforge = await getInsForgeServer();

  // 1. Create/Update profile in InsForge
  const { error } = await insforge
    .from("user_profiles")
    .upsert({
      id: userId,
      full_name: fullName,
      phone: phone,
      email: email,
      onboarding_complete: true,
    });

  if (error) {
    console.error("InsForge profile update error:", error);
    throw new Error("Failed to save profile");
  }

  // 2. Update Clerk public metadata
  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      onboardingComplete: true,
    },
  });

  revalidatePath("/");
  redirect("/");
}
