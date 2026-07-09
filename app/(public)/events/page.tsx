import { getInsForgeServer } from "@/lib/insforge/client";
import { EventCard } from "@/components/events/EventCard";
import {UserButton, Show, OrganizationSwitcher} from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const insforge = await getInsForgeServer();
  
  // Fetch active and upcoming events joined with venue data
  const { data: events, error } = await insforge
    .database
    .from("events")
    .select(`
      *,
      venues (
        name
      )
    `)
    .neq("is_active", false)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching events:", error);
  }

  // Determine status dynamically if not stored in DB correctly
  const now = new Date();
  const processedEvents = (events || []).map((event: any) => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    
    let status: "active" | "upcoming" | "ended" = "upcoming";
    if (now >= start && now <= end) {
      status = "active";
    } else if (now > end) {
      status = "ended";
    }
    
    return {
      ...event,
      displayStatus: status,
      venueName: event.venues?.name || "Unknown Venue"
    };
  });

  const activeEvents = processedEvents.filter(e => e.displayStatus === "active");
  const upcomingEvents = processedEvents.filter(e => e.displayStatus === "upcoming");

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <header className="flex items-center justify-between p-4 border-b border-border bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <a href="/" className="text-xl font-bold text-primary">boothfinder</a>
        </div>
        <div>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <a
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors"
            >
              Sign In
            </a >
          </Show>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold text-text">Browse Events</h1>
            <p className="mt-2 text-text-subtle">
              Select an active event to view the map and discover booths.
            </p>
          </div>

          {activeEvents.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-success flex items-center mb-4">
                <span className="mr-2 h-2 w-2 rounded-full bg-success animate-pulse" />
                Live Now
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    name={event.name}
                    venueName={event.venueName}
                    startDate={event.start_date}
                    endDate={event.end_date}
                    status="active"
                  />
                ))}
              </div>
            </section>
          )}

          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-text mb-4">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    name={event.name}
                    venueName={event.venueName}
                    startDate={event.start_date}
                    endDate={event.end_date}
                    status="upcoming"
                  />
                ))}
              </div>
            </section>
          )}

          {processedEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-bg p-6 mb-4">
                <Calendar className="h-12 w-12 text-text-subtle" />
              </div>
              <h3 className="text-xl font-bold text-text">No events found</h3>
              <p className="text-text-subtle mt-2">
                There are currently no active or upcoming events scheduled.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}
