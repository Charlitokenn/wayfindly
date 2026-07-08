"use client"

import dynamic from "next/dynamic";

const MapViewerImpl = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-2">
        <div className="h-10 w-10 animate-pulse rounded-full bg-border" />
        <p className="text-sm font-medium text-text-subtle">Initializing map engine...</p>
      </div>
    </div>
  ),
});

interface MapViewerWrapperProps {
  mapId: string;
  booths: any[];
  eventId: string;
}

export default function MapViewerWrapper({ mapId, booths, eventId }: MapViewerWrapperProps) {
  return <MapViewerImpl mapId={mapId} booths={booths} eventId={eventId} />;
}
