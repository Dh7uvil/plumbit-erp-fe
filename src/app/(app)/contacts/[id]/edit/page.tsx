import { z } from "zod";

import { ContactDetailScreen } from "@/modules/crm/contacts/components/contact-detail-screen";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function ContactDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={contactPermissions.update}>
      {parsed.success ? (
        <ContactDetailScreen contactId={parsed.data} mode="edit" />
      ) : (
        <p className="text-muted-foreground text-sm">Contact not found.</p>
      )}
    </PermissionGate>
  );
}
