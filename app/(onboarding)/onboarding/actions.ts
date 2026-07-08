"use server";

import { getInsForgeServer } from "@/lib/insforge/client";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clickpesa } from "@/lib/clickpesa";

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

  // 1. Fetch app settings to check if fee is enabled
  const { data: settings } = await insforge.database
    .from("app_settings")
    .select("wayfinding_fee_enabled, wayfinding_fee_amount")
    .eq("id", "global")
    .single();

  const feeEnabled = settings?.wayfinding_fee_enabled ?? false;
  const feeAmount = settings?.wayfinding_fee_amount ?? 0;

  // 2. Create/Update profile in InsForge (incomplete status if fee enabled)
  const { error: profileError } = await insforge.database
    .from("user_profiles")
    .insert({
      id: userId,
      full_name: fullName,
      phone: phone,
      email: email,
      onboarding_complete: !feeEnabled,
    });

  if (profileError) {
    console.error("InsForge profile update error:", profileError);
    throw new Error("Failed to save profile");
  }

  // 3. Handle Payment if enabled
  if (feeEnabled && feeAmount > 0) {
    // Format phone for ClickPesa: 255XXXXXXXXX
    const formattedPhone = phone.replace(/\D/g, "").replace(/^0/, "255").replace(/^\+/, "");
    
    const charge = await clickpesa.charge({
      phoneNumber: formattedPhone,
      amount: Number(feeAmount),
      description: "Wayfinding Access Fee",
      externalId: userId,
    });

    if (charge.status === "failed") {
      throw new Error(charge.error || "Payment initiation failed");
    }

    // Record pending payment in InsForge
    await insforge.database.from("clickpesa_payments").insert([{
      user_id: userId,
      amount: feeAmount,
      status: "pending",
      provider_reference: charge.reference,
    }]);

    // Redirect to a payment status polling page
    redirect(`/onboarding/payment?ref=${charge.reference}`);
  }

  // 4. Update Clerk public metadata (only if no fee or fee handled synchronously - though usually fee is async)
  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      onboardingComplete: true,
    },
  });

  revalidatePath("/");
  redirect("/");
}

export async function checkPaymentStatus(reference: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const insforge = await getInsForgeServer();
  
  const { data: payment, error } = await insforge.database
    .from("clickpesa_payments")
    .select("status, user_id")
    .eq("provider_reference", reference)
    .single();

  if (error || !payment) return { status: "not_found" };
  if (payment.user_id !== userId) throw new Error("Unauthorized access to payment");

  if (payment.status === "completed") {
    // Ensure Clerk is updated
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: true,
      },
    });
    return { status: "completed" };
  }

  // Optionally verify with ClickPesa API if still pending in our DB
  if (payment.status === "pending") {
    const freshStatus = await clickpesa.verify(reference);
    if (freshStatus === "completed") {
      await insforge.database
        .from("clickpesa_payments")
        .update({ status: "completed" })
        .eq("provider_reference", reference);

      await insforge.database
        .from("user_profiles")
        .update({ onboarding_complete: true })
        .eq("id", userId);

      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          onboardingComplete: true,
        },
      });
      return { status: "completed" };
    }
    return { status: freshStatus };
  }

  return { status: payment.status };
}
