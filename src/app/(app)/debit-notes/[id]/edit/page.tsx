import { z } from "zod";

import { DebitNoteDetailScreen } from "@/modules/erp/debit-notes/components/debit-note-detail-screen";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function DebitNoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={debitNotePermissions.update}>
      {parsed.success ? (
        <DebitNoteDetailScreen noteId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Debit note not found.</p>
      )}
    </PermissionGate>
  );
}
