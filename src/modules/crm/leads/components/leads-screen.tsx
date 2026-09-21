"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LeadFormDialog } from "@/modules/crm/leads/components/lead-form-dialog";
import { LeadStatusBadge } from "@/modules/crm/leads/components/lead-status-badge";
import { useDeleteLead } from "@/modules/crm/leads/mutations";
import { leadPermissions } from "@/modules/crm/leads/permissions";
import { useLeads } from "@/modules/crm/leads/queries";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  leadDisplayName,
  type Lead,
  type LeadStatus,
} from "@/modules/crm/leads/schemas";
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
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "lead_number", label: "Number" },
  { value: "company_name", label: "Company" },
  { value: "status", label: "Status" },
  { value: "created_at", label: "Created" },
] as const;
const ALL = "all";

export function LeadsScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(leadPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const statusFilter = filters.status;
  const leadsQuery = useLeads({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status:
      statusFilter && statusFilter !== ALL ? (statusFilter as LeadStatus) : undefined,
  });
  const deleteLead = useDeleteLead();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const userNameById = useUserNameMap();

  const rows = leadsQuery.data?.data ?? [];
  const meta = leadsQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<Lead>> => {
    return [
      {
        id: "lead_number",
        header: "Number",
        sortableField: "lead_number",
        className: "font-mono text-xs",
        cell: (row) => (
          <RecordLink href={`/leads/${row.id}`} className="block truncate">
            {row.lead_number}
          </RecordLink>
        ),
      },
      {
        id: "name",
        header: "Lead",
        sortableField: "company_name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (row) => (
          <RecordLink href={`/leads/${row.id}`} className="block truncate">
            {leadDisplayName(row)}
          </RecordLink>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (row) => <LeadStatusBadge status={row.status} />,
      },
      {
        id: "email",
        header: "Email",
        className: "text-muted-foreground max-w-xs truncate",
        cell: (row) => row.email ?? "—",
      },
      {
        id: "owner_id",
        header: "Owner",
        cell: (row) => (row.owner_id ? (userNameById.get(row.owner_id) ?? "—") : "—"),
      },
      ...auditTimestampColumns<Lead>(),
      ...auditActorColumns<Lead>(userNameById),
      ...actionsColumn<Lead>(showActions, (row) => (
        <DataTableRowActions
          entityName={leadDisplayName(row)}
          viewHref={canRead ? `/leads/${row.id}` : undefined}
          editHref={canUpdate ? `/leads/${row.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("crm.leads", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteLead.mutateAsync(deleting.id);
      toast.success("Lead deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Leads"
        subtitle="Track prospects before they become customers"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New lead
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name, email, number…"
        />
        <FilterSelect
          label="Status"
          className="w-40"
          placeholder="Status"
          value={statusFilter ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...LEAD_STATUSES.map((status) => ({
              value: status,
              label: LEAD_STATUS_LABELS[status],
            })),
          ]}
        />
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
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
          {leadsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : leadsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(leadsQuery.error)}
                  onRetry={() => leadsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No leads"
                  message={emptyListMessage(canCreate, "Create a lead to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <DataTableCells columns={columns} row={row} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={(entity) => router.push(`/leads/${entity.id}`)}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete lead"
        description={
          deleting ? `Delete ${leadDisplayName(deleting)}? This cannot be undone.` : undefined
        }
        confirmLabel="Delete"
        pending={deleteLead.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
