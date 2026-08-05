"use server";

import { auth } from "@clerk/nextjs/server";
import { getInsForgeServer } from "@/lib/insforge/client";
import { revalidatePath } from "next/cache";

/**
 * Updates global app settings in InsForge.
 */
export async function updateAppSettings(formData: FormData) {
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.publicMetadata?.role === "admin";
  
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const feeEnabled = formData.get("feeEnabled") === "on";
  const feeAmount = parseFloat(formData.get("feeAmount") as string);

  if (isNaN(feeAmount) || feeAmount < 0) {
        throw new Error("Invalid fee amount");
   }
  const insforge = await getInsForgeServer();

  const { error } = await insforge
    .from("app_settings")
    .upsert({
      id: "global", // Single record for global settings
      wayfinding_fee_enabled: feeEnabled,
      wayfinding_fee_amount: feeAmount,
    });

  if (error) {
    console.error("InsForge settings update error:", error);
    throw new Error("Failed to update settings");
  }

  revalidatePath("/settings");
}
