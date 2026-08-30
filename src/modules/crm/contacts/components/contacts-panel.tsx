"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ContactFormDialog } from "@/modules/crm/contacts/components/contact-form-dialog";
import { useDeleteContact } from "@/modules/crm/contacts/mutations";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useContacts } from "@/modules/crm/contacts/queries";
import type { Contact } from "@/modules/crm/contacts/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
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
import { useCan } from "@/shared/providers/session-provider";

const HEADERS = ["Name", "Email", "Phone", "Primary", "Status", "Actions"] as const;

export function ContactsPanel({ customerId }: { customerId: string }) {
  const can = useCan();
  const canRead = can(contactPermissions.read);
  const [page, setPage] = useState(1);
  const contactsQuery = useContacts({ customer_id: customerId, page }, canRead);
  const deleteContact = useDeleteContact();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const rows = contactsQuery.data?.data ?? [];
  const meta = contactsQuery.data?.meta;

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
        {can(contactPermissions.create) ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
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
              {HEADERS.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={HEADERS.length}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : contactsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={HEADERS.length}>
                  <DataTableError
                    message={getErrorMessage(contactsQuery.error)}
                    onRetry={() => contactsQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={HEADERS.length}>
                  <DataTableEmpty title="No contacts" message="Add a contact for this company." />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email || "—"}</TableCell>
                  <TableCell>{contact.phone || "—"}</TableCell>
                  <TableCell>
                    {contact.is_primary ? <Badge variant="info">Primary</Badge> : "—"}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={contact.is_active} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {can(contactPermissions.update) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={`Edit ${contact.name}`}
                          onClick={() => {
                            setEditing(contact);
                            setFormOpen(true);
                          }}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                      ) : null}
                      {can(contactPermissions.delete) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-7"
                          aria-label={`Delete ${contact.name}`}
                          onClick={() => setDeleting(contact)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </CardContent>
      <ContactFormDialog
        open={formOpen}
        contact={editing}
        defaultCustomerId={customerId}
        lockCustomer
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
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
