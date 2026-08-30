"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ContactFormDialog } from "@/modules/crm/contacts/components/contact-form-dialog";
import { useDeleteContact } from "@/modules/crm/contacts/mutations";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useContacts } from "@/modules/crm/contacts/queries";
import type { Contact } from "@/modules/crm/contacts/schemas";
import { useCompanyOptions } from "@/modules/crm/contacts/use-company-options";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["Name", "Company", "Email", "Phone", "Primary", "Status"] as const;
const ALL = "all";

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

export function ContactsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(contactPermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const contactsQuery = useContacts({
    page,
    page_size,
    search,
    customer_id: filters.customer_id,
    is_primary: parseBoolFilter(filters.is_primary),
    is_active: parseBoolFilter(filters.is_active),
  });
  const companiesQuery = useCompanyOptions();
  const deleteContact = useDeleteContact();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = contactsQuery.data?.data ?? [];
  const meta = contactsQuery.data?.meta;
  const companyNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const company of companiesQuery.companies) {
      map.set(company.id, company.name);
    }
    return map;
  }, [companiesQuery.companies]);
  const companies = companiesQuery.companies;

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

  return (
    <ListPage>
      <PageHeader
        title="Contacts"
        subtitle="People belonging to a customer or supplier"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Contact
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search contacts…"
        />
        <FilterSelect
          className="w-48"
          placeholder="Company"
          value={filters.customer_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { customer_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All companies" },
            ...companies.map((company) => ({ value: company.id, label: company.name })),
          ]}
        />
        <FilterSelect
          className="w-36"
          placeholder="Primary"
          value={filters.is_primary ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_primary: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All" },
            { value: "true", label: "Primary" },
            { value: "false", label: "Other" },
          ]}
        />
        <FilterSelect
          className="w-36"
          placeholder="Status"
          value={filters.is_active ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_active: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contactsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
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
                  message={emptyListMessage(
                    canCreate,
                    "Create a contact for a customer or supplier to get started.",
                  )}
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
                    {companyNameById.get(contact.customer_id) ?? "—"}
                  </RecordLink>
                </TableCell>
                <TableCell>{contact.email || "—"}</TableCell>
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
      <ContactFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete contact"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this contact"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteContact.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
