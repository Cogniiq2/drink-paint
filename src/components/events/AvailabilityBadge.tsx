import type { Availability } from "@/lib/inventory/availability";

/** Dot + label. The dot is the only colour signal; text is always present. */
export function AvailabilityBadge({ availability, className = "" }: { availability: Availability; className?: string }) {
  const tone =
    availability.state === "sold_out" || availability.state === "closed" || availability.state === "past"
      ? "bg-current opacity-40"
      : availability.state === "few"
        ? "bg-wine"
        : availability.state === "coming_soon"
          ? "bg-current opacity-30"
          : "bg-current";
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone}`} />
      <span className="tabular">{availability.label}</span>
    </span>
  );
}
