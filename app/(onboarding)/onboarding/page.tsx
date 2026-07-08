import { currentUser } from "@clerk/nextjs/server";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-subtle p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text">Welcome!</h1>
          <p className="mt-2 text-text-subtle">
            Let&apos;s get your profile ready for the event.
          </p>
        </div>

        <form action={completeOnboarding} className="mt-8 space-y-6">
          <input type="hidden" name="email" value={user.emailAddresses[0].emailAddress} />
          
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-text">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              defaultValue={user.fullName || ""}
              required
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-text focus:border-primary focus:ring-primary transition-all outline-none"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="mt-1 block w-full rounded-lg border border-border px-4 py-3 text-text focus:border-primary focus:ring-primary transition-all outline-none"
              placeholder="e.g. +255 700 000 000"
            />
            <p className="mt-1 text-xs text-text-subtle">
              We&apos;ll use this to contact you if you win a prize!
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-hover transition-all"
            >
              Start Discovering
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
