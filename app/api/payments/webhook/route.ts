import { NextRequest, NextResponse } from "next/server";
import { getInsForgeServer } from "@/lib/insforge/client";
import { createClerkClient } from "@clerk/nextjs/server";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const signature = req.headers.get("x-clickpesa-signature");
  
  // 1. Verify webhook signature (Conceptual - ClickPesa specific)
  // In a real app, we would use CLICKPESA_WEBHOOK_SECRET to verify the HMAC signature
  if (!process.env.CLICKPESA_WEBHOOK_SECRET) {
    console.warn("CLICKPESA_WEBHOOK_SECRET is missing");
  }

  const { reference, status, external_id: userId } = body as {
    reference: string;
    status: string;
    external_id: string;
  };

  if (!reference || !status || !userId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const insforge = await getInsForgeServer();

  // 2. Update payment status in InsForge
  const { error: paymentError } = await insforge.database
    .from("clickpesa_payments")
    .update({ status })
    .eq("provider_reference", reference);

  if (paymentError) {
    console.error("Webhook payment update error:", paymentError);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }

  // 3. If completed, update user profile and Clerk metadata
  if (status === "completed") {
    // Update user profile in InsForge
    const { error: profileError } = await insforge.database
      .from("user_profiles")
      .update({ onboarding_complete: true })
      .eq("id", userId);

    if (profileError) {
      console.error("Webhook profile update error:", profileError);
    }

    // Update Clerk metadata
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          onboardingComplete: true,
        },
      });
    } catch (clerkError) {
      console.error("Webhook Clerk update error:", clerkError);
    }
  }

  return NextResponse.json({ received: true });
}
