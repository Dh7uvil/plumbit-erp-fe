import { z } from "zod";

import { DeliveryNoteDetailScreen } from "@/modules/inventory-management/delivery-notes/components/delivery-note-detail-screen";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function DeliveryNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={deliveryNotePermissions.read}>
      {parsed.success ? (
        <DeliveryNoteDetailScreen noteId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Delivery note not found.</p>
      )}
    </PermissionGate>
  );
}
