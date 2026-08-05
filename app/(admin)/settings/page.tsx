import { auth } from "@clerk/nextjs/server";
import { getInsForgeServer } from "@/lib/insforge/client";
import { updateAppSettings } from "./actions";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.publicMetadata?.role === "admin";

  if (!isAdmin) {
    redirect("/");
  }

  const insforge = await getInsForgeServer();
  const { data: settings } = await insforge.database
    .from("app_settings")
    .select("*")
    .eq("id", "global")
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-bg-subtle p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-text">Admin Settings</h1>
        <p className="mt-2 text-text-subtle">
          Configure global application behavior and monetization.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm border border-border">
          <form action={updateAppSettings} className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text">Wayfinding Fee</h3>
                <p className="text-sm text-text-subtle">
                  Enable or disable the mobile money payment requirement during onboarding.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="feeEnabled"
                  defaultChecked={settings?.wayfinding_fee_enabled}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white focus:outline-none"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="feeAmount" className="block text-sm font-medium text-text">
                  Fee Amount (TZS)
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-text-subtle sm:text-sm">TZS</span>
                  </div>
                  <input
                    type="number"
                    id="feeAmount"
                    name="feeAmount"
                    defaultValue={settings?.wayfinding_fee_amount || 1000}
                    className="block w-full rounded-lg border border-border py-3 pl-12 pr-4 text-text focus:border-primary focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-6">
              <button
                type="submit"
                className="rounded-xl bg-primary px-8 py-3 font-semibold text-white shadow-lg hover:bg-primary-hover transition-all"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-2xl bg-info-subtle p-6 border border-info">
          <h4 className="font-semibold text-text">Pro-tip: System Access</h4>
          <p className="mt-1 text-sm text-text-subtle leading-relaxed">
            Changes to the Wayfinding Fee will take effect immediately for new attendees 
            who haven&apos;t completed onboarding. Existing users will not be affected.
          </p>
        </div>
      </div>
    </div>
  );
}
