import { getInsForgeServer } from "@/lib/insforge/client";
import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Map as MapIcon, ChevronLeft } from "lucide-react";
import Link from "next/link";
import MapViewerWrapper from "@/components/map/MapViewerWrapper";

interface EventMapPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventMapPage({ params }: EventMapPageProps) {
  const { eventId } = await params;
  const insforge = await getInsForgeServer();

  const { data: event, error } = await insforge
    .database
    .from("events")
    .select("*, venues(name,mappedin_venue_slug), booths(*)")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    notFound();
  }

  const booths = event.booths || [];
  const mappedin_map_id = event.venues.mappedin_venue_slug

  // Ensure we have a map ID
  if (!mappedin_map_id) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-bg p-6 text-center">
        <MapIcon className="h-16 w-16 text-text-subtle mb-4" />
        <h1 className="text-2xl font-bold text-text">No Map Configured</h1>
        <p className="mt-2 text-text-subtle max-w-md">
          This event hasn't been assigned a Mappedin map ID yet. 
          Please contact the event administrator.
        </p>
        <Link 
          href="/events"
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <Link 
            href="/events" 
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-bg transition-colors"
            title="Back to Events"
          >
            <ChevronLeft className="h-6 w-6 text-text" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-text leading-tight truncate max-w-[200px] md:max-w-md">
              {event.name}
            </h1>
            <p className="text-xs text-text-subtle truncate">
              {event.venues?.name || "Unknown Venue"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <UserButton />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <MapViewerWrapper mapId={mappedin_map_id} booths={booths} eventId={eventId} />
      </main>
    </div>
  );
}
