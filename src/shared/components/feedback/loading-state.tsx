import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";

export function LoadingState({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function PageLoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-full max-w-xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
