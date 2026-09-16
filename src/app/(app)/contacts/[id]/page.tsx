import { ContactDetailScreen } from "@/modules/crm/contacts/components/contact-detail-screen";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={contactPermissions.read}
      notFoundMessage="Contact not found."
    >
      {(id) => <ContactDetailScreen contactId={id} mode="view" />}
    </DetailPageRoute>
  );
}
