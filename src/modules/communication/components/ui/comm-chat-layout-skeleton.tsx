import { Skeleton } from "@/shared/components/ui/skeleton";

export function CommChatLayoutSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid h-full min-h-0 flex-1 grid-rows-1 md:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="border-border hidden border-r p-4 md:block">
          <Skeleton className="mb-4 h-8 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <Skeleton className="h-14 w-full shrink-0" />
          <Skeleton className="flex-1" />
          <Skeleton className="h-16 w-full shrink-0" />
        </div>
        <div className="border-border hidden border-l p-4 lg:block">
          <Skeleton className="mb-4 h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
