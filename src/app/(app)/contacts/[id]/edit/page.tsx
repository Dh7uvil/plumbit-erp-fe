import { ContactDetailScreen } from "@/modules/crm/contacts/components/contact-detail-screen";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function ContactDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={contactPermissions.update}
      notFoundMessage="Contact not found."
    >
      {(id) => <ContactDetailScreen contactId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
