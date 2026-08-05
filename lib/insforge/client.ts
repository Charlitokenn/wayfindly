import { createClient } from "@insforge/sdk";
import { auth } from "@clerk/nextjs/server";

/**
 * Creates an InsForge client for server-side use.
 * Requires edgeFunctionToken from Clerk for authenticated calls.
 */
export async function getInsForgeServer() {
  const { getToken } = await auth();
  const token = await getToken({ template: "insforge" });

  return createClient(
    {
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
      // auth: {
      //   edgeFunctionToken: token || undefined,
      // },
    }
  );
}
