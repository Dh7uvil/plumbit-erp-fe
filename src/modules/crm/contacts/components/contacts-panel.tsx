"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ContactFormDialog } from "@/modules/crm/contacts/components/contact-form-dialog";
import { useDeleteContact } from "@/modules/crm/contacts/mutations";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useContacts } from "@/modules/crm/contacts/queries";
import type { Contact } from "@/modules/crm/contacts/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const COLUMN_HEADERS = ["Name", "Email", "Phone", "Primary", "Status"] as const;

export function ContactsPanel({ customerId }: { customerId: string }) {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(contactPermissions);
  const [page, setPage] = useState(1);
  const contactsQuery = useContacts({ customer_id: customerId, page }, canRead);
  const deleteContact = useDeleteContact();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = contactsQuery.data?.data ?? [];
  const meta = contactsQuery.data?.meta;

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteContact.mutateAsync(deleting.id);
      toast.success("Contact deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!canRead) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Contacts</CardTitle>
        {canCreate ? (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            New Contact
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DataTable
          footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
        >
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={headers.length}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : contactsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  <DataTableError
                    message={getErrorMessage(contactsQuery.error)}
                    onRetry={() => contactsQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  <DataTableEmpty
                    title="No contacts"
                    message={emptyListMessage(canCreate, "Add a contact for this company.")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <RecordLink href={`/contacts/${contact.id}`}>{contact.name}</RecordLink>
                  </TableCell>
                  <TableCell>
                    <RecordLink href={`/contacts/${contact.id}`}>
                      {contact.email || "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{contact.phone || "—"}</TableCell>
                  <TableCell>
                    {contact.is_primary ? <Badge variant="info">Primary</Badge> : "—"}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={contact.is_active} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={contact.name}
                        viewHref={canRead ? `/contacts/${contact.id}` : undefined}
                        editHref={canUpdate ? `/contacts/${contact.id}/edit` : undefined}
                        onDelete={canDelete ? () => setDeleting(contact) : undefined}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </CardContent>
      <ContactFormDialog
        open={formOpen}
        defaultCustomerId={customerId}
        lockCustomer
        onOpenChange={setFormOpen}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete contact"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this contact"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteContact.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
