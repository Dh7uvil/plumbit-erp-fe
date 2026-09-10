import { z } from "zod";

import { CreditNoteDetailScreen } from "@/modules/erp/credit-notes/components/credit-note-detail-screen";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function CreditNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={creditNotePermissions.read}>
      {parsed.success ? (
        <CreditNoteDetailScreen noteId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Credit note not found.</p>
      )}
    </PermissionGate>
  );
}
