"use client";

import { Skeleton } from "@/shared/components/ui/skeleton";

export function CommMessageSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex justify-start">
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-56 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-64 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-40 rounded-2xl" />
      </div>
    </div>
  );
}
