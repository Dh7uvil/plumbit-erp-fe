import {
  SHIPMENT_STATUS_LABELS,
  TRACKING_STEPS,
  type Shipment,
  type ShipmentStatus,
} from "@/modules/inventory-management/shipments/schemas";
import { cn } from "@/shared/lib/cn";

export function ShipmentTrackingStrip({ shipment }: { shipment: Shipment }) {
  if (shipment.status === "CANCELLED") {
    return (
      <p className="text-muted-foreground text-sm">
        This shipment is cancelled. Tracking states do not apply.
      </p>
    );
  }

  const currentIndex = TRACKING_STEPS.indexOf(shipment.status as (typeof TRACKING_STEPS)[number]);

  return (
    <ol className="flex flex-wrap gap-2" aria-label="Shipment tracking progress">
      {TRACKING_STEPS.map((step, index) => {
        const reached = currentIndex >= 0 && index <= currentIndex;
        const current = step === shipment.status;
        return (
          <li
            key={step}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              current
                ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                : reached
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "text-muted-foreground bg-muted/40",
            )}
            aria-current={current ? "step" : undefined}
          >
            {SHIPMENT_STATUS_LABELS[step as ShipmentStatus]}
          </li>
        );
      })}
    </ol>
  );
}
