"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ContactForm } from "@/modules/crm/contacts/components/contact-form";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useContact } from "@/modules/crm/contacts/queries";
import { useCompanyOptions } from "@/modules/crm/contacts/use-company-options";
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
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { historyHref } from "@/shared/lib/history";
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
  const companiesQuery = useCompanyOptions();
  const contact = contactQuery.data;
  const company = companiesQuery.companies.find((option) => option.id === contact?.customer_id);
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
        subtitle={company?.name}
        listHref="/contacts"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
        extraActions={
          company ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={company.href}>View company</Link>
            </Button>
          ) : null
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{isEdit ? "Edit contact" : "Contact"}</CardTitle>
          {mode === "view" ? (
            <HistoryHeaderButton href={historyHref("contacts", contact.id, contact.name)} />
          ) : null}
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
        <>
          <EntityAttachmentsPanel entityType="CONTACT" entityId={contact.id} />
        </>
      )}
    </div>
  );
}
