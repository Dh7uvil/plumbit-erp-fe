import { z } from "zod";

import { DebitNoteDetailScreen } from "@/modules/erp/debit-notes/components/debit-note-detail-screen";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function DebitNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={debitNotePermissions.read}>
      {parsed.success ? (
        <DebitNoteDetailScreen noteId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Debit note not found.</p>
      )}
    </PermissionGate>
  );
}
