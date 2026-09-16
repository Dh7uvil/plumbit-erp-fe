"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { contactColumnDefs } from "@/modules/crm/contacts/components/contact-columns";
import { ContactFormDialog } from "@/modules/crm/contacts/components/contact-form-dialog";
import { useDeleteContact } from "@/modules/crm/contacts/mutations";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import { useContacts } from "@/modules/crm/contacts/queries";
import type { Contact } from "@/modules/crm/contacts/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useNestedTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "is_primary", label: "Primary" },
  { value: "is_active", label: "Status" },
] as const;
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

export function ContactsPanel({ customerId }: { customerId: string }) {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(contactPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const contactsQuery = useContacts(
    {
      customer_id: customerId,
      page,
      page_size,
      search,
      sort_by,
      sort_order,
      is_primary: parseBoolFilter(filters.is_primary),
      is_active: parseBoolFilter(filters.is_active),
    },
    canRead,
  );
  const deleteContact = useDeleteContact();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const userNameById = useUserNameMap();
  const rows = contactsQuery.data?.data ?? [];
  const meta = contactsQuery.data?.meta;
  const columnDefs = useMemo(
    () =>
      contactColumnDefs({
        userNameById,
        omit: ["company"],
        actions: showActions
          ? (contact) => (
              <DataTableRowActions
                entityName={contact.name}
                viewHref={canRead ? `/contacts/${contact.id}` : undefined}
                editHref={canUpdate ? `/contacts/${contact.id}/edit` : undefined}
                onDelete={canDelete ? () => setDeleting(contact) : undefined}
              />
            )
          : undefined,
      }),
    [canDelete, canRead, canUpdate, setDeleting, showActions, userNameById],
  );
  const { columns, columnsDialog, colSpan } = useTableColumns("crm.contacts", columnDefs);
  const hasQuery = Boolean(search || filters.is_active || filters.is_primary || sort_by);

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
          <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-3.5" />
            New Contact
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DataTableToolbar>
          <ListSearch
            value={search ?? ""}
            onChange={(value) => setParams({ search: value || null })}
            placeholder="Search name, email, phone…"
          />
          <FilterSelect
            label="Status"
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
          <FilterSelect
            label="Primary"
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
          <SortDialog
            fields={[...SORT_FIELDS]}
            sortBy={sort_by}
            sortOrder={sort_order}
            onApply={setParams}
          />
          {columnsDialog}
          {hasQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setParams({
                  search: null,
                  sort_by: null,
                  sort_order: null,
                  filters: { is_active: null, is_primary: null },
                })
              }
            >
              Clear
            </Button>
          ) : null}
        </DataTableToolbar>
        <DataTable
          variant="embedded"
          footer={
            meta ? (
              <DataTablePagination
                meta={meta}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            ) : null
          }
        >
          <TableHeader>
            <TableRow>
              <DataTableColumnHeads
                columns={columns}
                sortBy={sort_by}
                sortOrder={sort_order}
                onSort={setParams}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : contactsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableError
                    message={getErrorMessage(contactsQuery.error)}
                    onRetry={() => contactsQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty
                    title="No contacts"
                    message={emptyListMessage(canCreate, "Add a contact for this company.")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((contact) => (
                <TableRow key={contact.id}>
                  <DataTableCells columns={columns} row={contact} />
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
