import { Suspense } from "react";
import { z } from "zod";

import { EntityHistoryScreen } from "@/modules/users-management/activity/components/entity-history-screen";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { isHistoryResource } from "@/shared/lib/history";

const IdSchema = z.string().uuid();

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const parsed = IdSchema.safeParse(id);

  if (!parsed.success || !isHistoryResource(resource)) {
    return (
      <p className="text-muted-foreground p-6 text-sm">History is not available for this record.</p>
    );
  }

  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 w-auto" />}>
      <EntityHistoryScreen resource={resource} id={parsed.data} />
    </Suspense>
  );
}
