import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

interface EventCardProps {
  id: string;
  name: string;
  venueName: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "ended";
}

export function EventCard({
  id,
  name,
  venueName,
  startDate,
  endDate,
  status,
}: EventCardProps) {
  const formattedStart = new Date(startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  const formattedEnd = new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isActive = status === "active";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md">
      <div className="absolute top-4 right-4 z-10">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isActive
              ? "bg-success/10 text-success"
              : status === "upcoming"
              ? "bg-primary/10 text-primary"
              : "bg-text-subtle/10 text-text-subtle"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-text-subtle">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            {venueName}
          </div>
          <div className="flex items-center text-sm text-text-subtle">
            <Calendar className="mr-2 h-4 w-4 text-primary" />
            {formattedStart === formattedEnd 
              ? formattedStart 
              : `${formattedStart} - ${formattedEnd}`}
          </div>
        </div>

        <div className="mt-8">
          <Link
            href={`/events/${id}`}
            className={`inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-all ${
              isActive
                ? "bg-primary text-white hover:bg-primary-hover shadow-sm"
                : "bg-bg text-text hover:bg-border"
            }`}
          >
            {isActive ? "Enter Map" : "View Details"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
