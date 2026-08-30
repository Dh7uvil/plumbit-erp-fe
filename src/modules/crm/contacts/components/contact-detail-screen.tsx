"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ContactForm } from "@/modules/crm/contacts/components/contact-form";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useContact } from "@/modules/crm/contacts/queries";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ContactDetailScreen({
  contactId,
  mode,
}: {
  contactId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(contactPermissions);
  const contactQuery = useContact(contactId);
  const contact = contactQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/contacts/${contactId}`;

  if (contactQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (contactQuery.isError || !contact) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={contactQuery.error ? getErrorMessage(contactQuery.error) : "Contact not found"}
          onRetry={() => contactQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/contacts">Back to contacts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={contact.name}
        listHref="/contacts"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit contact" : "Contact"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            contact={contact}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {isEdit ? null : (
        <EntityAttachmentsPanel entityType="CONTACT" entityId={contact.id} />
      )}
    </div>
  );
}
