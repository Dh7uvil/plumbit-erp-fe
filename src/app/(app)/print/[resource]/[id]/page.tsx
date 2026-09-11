import { Suspense } from "react";
import { z } from "zod";

import { PrintDocumentScreen } from "@/shared/components/document/print-document-screen";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { isPrintableResource } from "@/shared/lib/print";

const IdSchema = z.string().uuid();

export default async function PrintPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const parsed = IdSchema.safeParse(id);

  if (!parsed.success || !isPrintableResource(resource)) {
    return <p className="text-muted-foreground p-6 text-sm">Print document not found.</p>;
  }

  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 w-auto" />}>
      <PrintDocumentScreen resource={resource} id={parsed.data} />
    </Suspense>
  );
}
