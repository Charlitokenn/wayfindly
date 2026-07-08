import {SignInButton, UserButton, Show} from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center justify-between p-4 border-b border-border bg-white shadow-sm">
        <h1 className="text-xl font-bold text-primary">boothfinder</h1>
        <div>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out" >
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-text sm:text-6xl">
          Find Your Way. <br />
          <span className="text-primary">Discover Every Booth.</span>
        </h2>
        <p className="mt-6 text-lg leading-8 text-text-subtle max-w-2xl">
          The ultimate companion for event attendees. Navigate complex venues, 
          track your visits, and never miss a promotion.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/events"
            className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all"
          >
            Browse Events
          </a>
          <Show when="signed-in">
            <a href="/onboarding" className="text-lg font-semibold leading-6 text-text">
              Complete Profile <span aria-hidden="true">→</span>
            </a>
          </Show>
        </div>
      </main>

      <footer className="p-6 text-center border-t border-border text-text-subtle text-sm">
        &copy; 2026 boothfinder. Built for seamless event experiences.
      </footer>
    </div>
  );
}
