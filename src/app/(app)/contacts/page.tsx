import { ContactsScreen } from "@/modules/crm/contacts/components/contacts-screen";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function ContactsPage() {
  return (
    <PermissionGate permission={contactPermissions.read}>
      <ContactsScreen />
    </PermissionGate>
  );
}
