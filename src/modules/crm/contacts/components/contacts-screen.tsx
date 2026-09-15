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
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

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

export function ContactsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(contactPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraPrimary = filters.is_primary ?? ALL;
  const extraCount = extraPrimary !== ALL ? 1 : 0;
  const [draftPrimary, setDraftPrimary] = useState(ALL);
  const contactsQuery = useContacts({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    customer_id: filters.customer_id,
    is_primary: parseBoolFilter(filters.is_primary),
    is_active: parseBoolFilter(filters.is_active),
  });
  const companiesQuery = useCompanyOptions();
  const deleteContact = useDeleteContact();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = contactsQuery.data?.data ?? [];
  const meta = contactsQuery.data?.meta;
  const companyById = useMemo(() => {
    const map = new Map<string, { name: string; href: string }>();
    for (const company of companiesQuery.companies) {
      map.set(company.id, { name: company.name, href: company.href });
    }
    return map;
  }, [companiesQuery.companies]);
  const companies = companiesQuery.companies;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Contact>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (contact) => (
          <RecordLink href={`/contacts/${contact.id}`}>{contact.name}</RecordLink>
        ),
      },
      {
        id: "company",
        header: "Company",
        cell: (contact) => {
          const company = companyById.get(contact.customer_id);
          return company ? <RecordLink href={company.href}>{company.name}</RecordLink> : "—";
        },
      },
      {
        id: "email",
        header: "Email",
        sortableField: "email",
        cell: (contact) => contact.email || "—",
      },
      {
        id: "phone",
        header: "Phone",
        cell: (contact) => contact.phone || "—",
      },
      {
        id: "is_primary",
        header: "Primary",
        sortableField: "is_primary",
        cell: (contact) => (contact.is_primary ? <Badge variant="info">Primary</Badge> : "—"),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "is_active",
        cell: (contact) => <ActiveBadge active={contact.is_active} />,
      },
      ...auditTimestampColumns<Contact>(),
      ...auditActorColumns<Contact>(userNameById),
      ...actionsColumn<Contact>(showActions, (contact) => (
        <DataTableRowActions
          entityName={contact.name}
          viewHref={canRead ? `/contacts/${contact.id}` : undefined}
          editHref={canUpdate ? `/contacts/${contact.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(contact) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, companyById, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("crm.contacts", columnDefs);

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
          placeholder="Search name, email, phone, company…"
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
          label="Company"
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
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={draftPrimary !== ALL ? 1 : 0}
          description="Filter by primary contact."
          onOpen={() => setDraftPrimary(extraPrimary)}
          onApply={() =>
            setParams({ filters: { is_primary: draftPrimary === ALL ? null : draftPrimary } })
          }
          onClearDraft={() => setDraftPrimary(ALL)}
        >
          <FilterField label="Primary" htmlFor="contact-filter-primary">
            <FilterSelect
              id="contact-filter-primary"
              className="w-full"
              placeholder="Primary"
              value={draftPrimary}
              onValueChange={setDraftPrimary}
              options={[
                { value: ALL, label: "All" },
                { value: "true", label: "Primary" },
                { value: "false", label: "Other" },
              ]}
            />
          </FilterField>
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.is_active || filters.customer_id || extraCount > 0 || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null, customer_id: null, is_primary: null },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable
        tableClassName="min-w-[1100px]"
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
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
            Array.from({ length: 5 }).map((_, index) => (
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
                <DataTableCells columns={columns} row={contact} />
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
