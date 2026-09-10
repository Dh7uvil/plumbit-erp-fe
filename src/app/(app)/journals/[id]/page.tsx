import { z } from "zod";

import { JournalDetailScreen } from "@/modules/erp/accounting/journals/components/journal-detail-screen";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={journalPermissions.read}>
      {parsed.success ? (
        <JournalDetailScreen journalId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Journal not found.</p>
      )}
    </PermissionGate>
  );
}
