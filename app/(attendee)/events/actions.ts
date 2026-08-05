"use server";

import { getInsForgeServer } from "@/lib/insforge/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface WayfindingData {
  eventId: string;
  boothId: string;
  boothCategory: string;
  distanceM: number;
  originNodeId: string;
  destinationNodeId: string;
  boothName: string;
}

export async function recordWayfindingSession(data: WayfindingData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const insforge = await getInsForgeServer();

  // 1. Record the visit in user_visits
  const { error: visitError } = await insforge.database
    .from("user_visits")
    .insert([{
      user_id: userId,
      event_id: data.eventId,
      booth_category: data.boothCategory,
      distance_walked: Math.round(data.distanceM),
      visited_at: new Date().toISOString(),
    }]);

  if (visitError) {
    console.error("Error recording visit:", visitError);
    return { success: false, error: "Failed to record visit" };
  }

     // 2. Atomically increment total_distance_walked_m and fetch profile data
         const { data: profile, error: profileError } = await insforge.database
       .rpc("increment_and_get_profile", {
             p_user_id: userId,
             p_amount: Math.round(data.distanceM),
           });

         if (profileError) {
           console.error("Error updating profile:", profileError);
           return { success: false, error: "Failed to update profile" };
         }

        if (profile) {
        const { error: updateError } = await insforge.database
      .from("user_profiles")
      .update({
        total_distance_walked_m: (profile.total_distance_walked_m || 0) + Math.round(data.distanceM)
      })
      .eq("id", userId);

        if (updateError) {
             console.error("Error updating profile:", updateError);
        }
      
    // 3. Create a lead for the booth
    const { error: leadError } = await insforge.database
      .from("leads")
      .insert([{
        booth_id: data.boothId,
        attendee_id: userId,
        name: profile.full_name,
        phone: profile.phone,
        origin_node: data.originNodeId,
        destination_node: data.destinationNodeId,
        captured_at: new Date().toISOString(),
      }]);

    if (leadError) {
      console.error("Error creating lead:", leadError);
        return { success: false, error: "Failed to create lead" };
    }
  }

  return { success: true };
}
