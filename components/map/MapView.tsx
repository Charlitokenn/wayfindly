"use client";

import { MapView as MappedinMapView, useMapData, Navigation } from "@mappedin/react-sdk";
import "@mappedin/mappedin-js/lib/index.css";
import { Loader2, AlertCircle, Search, Navigation as NavIcon, Store, X, MapPin } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { recordWayfindingSession } from "@/app/(attendee)/events/actions";

interface MapViewerProps {
  mapId: string;
  booths: any[];
  eventId: string;
}

export default function MapViewer({ mapId, booths, eventId }: MapViewerProps) {
  const [selectedBooth, setSelectedBooth] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [directions, setDirections] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapView, setMapView] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerReady, setContainerReady] = useState(false);

  const { mapData, isLoading, error } = useMapData({
    key: process.env.NEXT_PUBLIC_MAPPEDIN_KEY!,
    secret: process.env.NEXT_PUBLIC_MAPPEDIN_SECRET!,
    mapId: mapId,
  });

  useEffect(() => {
    if (mapData && !mapView) {
      // In v6, we can use the mapData to initialize or let MapView handle it
    }
  }, [mapData, mapView]);

  // Observe container size and only initialize Mappedin when it has non-zero dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const check = () => {
      const ok = el.clientWidth > 0 && el.clientHeight > 0;
      if (ok) setContainerReady(true);
    };

    check();
    const ro = new ResizeObserver(() => check());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filteredBooths = useMemo(() => {
    if (!searchQuery) return booths;
    return booths.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [booths, searchQuery]);

  const handleNavigate = async () => {
    if (!mapData || !selectedBooth || !selectedBooth.mappedin_node_id) return;

    setIsNavigating(true);

    try {
      // For demo/development if no blue-dot, we use a default entrance or random node
      const origin = userLocation?.coords || mapData.getByType("space")[0];
      const destination = mapData.getById("space", selectedBooth.mappedin_node_id) || 
                          mapData.getById("node", selectedBooth.mappedin_node_id);

      if (origin && destination) {
        const directionsResult = origin.directionsTo(destination);
        setDirections(directionsResult);

        // Record session server-side
        await recordWayfindingSession({
          eventId,
          boothId: selectedBooth.id,
          boothCategory: selectedBooth.category || "General",
          distanceM: directionsResult.distance,
          originNodeId: origin.id,
          destinationNodeId: destination.id,
          boothName: selectedBooth.name,
        });
      }
    } catch (err) {
      console.error("Navigation error:", err);
    } finally {
      setIsNavigating(false);
    }
  };

  useEffect(() => {
    if (mapView) {
      mapView.BlueDot.enable();
      
      const handlePositionUpdate = (update: any) => {
        setUserLocation(update);
      };

      mapView.on("blue-dot-position-update", handlePositionUpdate);

      return () => {
        mapView.off("blue-dot-position-update", handlePositionUpdate);
      };
    }
  }, [mapView]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-subtle">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3 p-6 text-center max-w-md">
          <div className="rounded-full bg-danger/10 p-4">
            <AlertCircle className="h-10 w-10 text-danger" />
          </div>
          <h3 className="text-xl font-bold text-text">Failed to load map</h3>
          <p className="text-text-subtle">
            We encountered an error while trying to load the venue map.
            {error?.message ? (
              <span className="block mt-2 text-xs text-text-subtle">Error: {error.message}</span>
            ) : (
              <span className="block mt-2 text-xs text-text-subtle">Please try again later.</span>
            )}
          </p>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
            >
              Retry
            </button>
            <button
              onClick={() => console.info('Mappedin error detail:', error)}
              className="rounded-md bg-white border border-border px-4 py-2 text-sm font-medium text-text hover:bg-bg"
            >
              Log details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar - Search & Booth List */}
      <div className="z-10 w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-border flex flex-col h-1/2 md:h-full shadow-lg">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
            <input
              type="text"
              placeholder="Search booths or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredBooths.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredBooths.map((booth) => (
                <button
                  key={booth.id}
                  onClick={() => setSelectedBooth(booth)}
                  className={`w-full p-4 text-left hover:bg-bg-subtle transition-colors flex items-start gap-3 ${
                    selectedBooth?.id === booth.id ? "bg-primary/5 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text">{booth.name}</h4>
                    <p className="text-xs text-text-subtle">{booth.category || "General"}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-text-subtle">
              <p>No booths found matches your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div ref={containerRef} className="w-full relative flex-1 h-full" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {containerReady && mapData ? (
          <MappedinMapView 
            mapData={mapData} 
            className="h-full w-full"
            onLoad={(mv) => { setMapView(mv); console.info('Mappedin onLoad -> mapView set', mv); }}
          >
            {directions && <Navigation directions={directions} />}
          </MappedinMapView>
        ) : (
          <div className="h-full w-full" />
        )}

        {/* Floating Booth Info Card */}
        {selectedBooth && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 z-20 bg-white rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 flex items-start justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden">
                  {selectedBooth.logo_url ? (
                    <img src={selectedBooth.logo_url} alt={selectedBooth.name} className="h-full w-full object-contain" />
                  ) : (
                    <Store className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-text leading-tight">{selectedBooth.name}</h3>
                  <p className="text-xs text-text-subtle">{selectedBooth.category}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedBooth(null);
                  setDirections(null);
                }}
                className="p-1 rounded-full hover:bg-white/50"
              >
                <X className="h-5 w-5 text-text-subtle" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-text-subtle line-clamp-2 mb-4">
                {selectedBooth.description || "Discover what this booth has to offer at the event!"}
              </p>
              
              <button 
                onClick={handleNavigate}
                disabled={isNavigating || !selectedBooth.mappedin_node_id}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-md hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNavigating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <NavIcon className="h-4 w-4" />
                )}
                {isNavigating ? "Calculating..." : "Navigate Here"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
