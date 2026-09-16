import { DeliveryNoteDetailScreen } from "@/modules/inventory-management/delivery-notes/components/delivery-note-detail-screen";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function DeliveryNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={deliveryNotePermissions.read}
      notFoundMessage="Delivery note not found."
    >
      {(id) => <DeliveryNoteDetailScreen noteId={id} mode="view" />}
    </DetailPageRoute>
  );
}
