import { z } from "zod";

import { DocumentSequenceDetailScreen } from "@/modules/erp/accounting/document-sequences/components/document-sequence-detail-screen";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function DocumentSequenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={documentSequencePermissions.read}>
      {parsed.success ? (
        <DocumentSequenceDetailScreen sequenceId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Document sequence not found.</p>
      )}
    </PermissionGate>
  );
}
