"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { TermsTemplateFormDialog } from "@/modules/erp/accounting/terms-templates/components/terms-template-form-dialog";
import { useDeleteTermsTemplate } from "@/modules/erp/accounting/terms-templates/mutations";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { useTermsTemplates } from "@/modules/erp/accounting/terms-templates/queries";
import type { TermsTemplate } from "@/modules/erp/accounting/terms-templates/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
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
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "is_default", label: "Default" },
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

export function TermsTemplatesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(termsTemplatePermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const termsTemplatesQuery = useTermsTemplates({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteTermsTemplate = useDeleteTermsTemplate();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<TermsTemplate | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = termsTemplatesQuery.data?.data ?? [];
  const meta = termsTemplatesQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<TermsTemplate>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (template) => (
          <RecordLink href={`/terms-templates/${template.id}`}>{template.name}</RecordLink>
        ),
      },
      {
        id: "is_default",
        header: "Default",
        sortableField: "is_default",
        cell: (template) => (
          <RecordLink href={`/terms-templates/${template.id}`}>
            {template.is_default ? <Badge variant="info">Default</Badge> : "—"}
          </RecordLink>
        ),
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (template) => <ActiveBadge active={template.is_active} />,
      },
      {
        id: "body",
        header: "Body",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (template) => template.body || "—",
      },
      ...auditTimestampColumns<TermsTemplate>(),
      ...auditActorColumns<TermsTemplate>(userNameById),
      ...actionsColumn<TermsTemplate>(showActions, (template) => (
        <DataTableRowActions
          entityName={template.name}
          viewHref={canRead ? `/terms-templates/${template.id}` : undefined}
          editHref={canUpdate ? `/terms-templates/${template.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(template) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.terms_templates", columnDefs);

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteTermsTemplate.mutateAsync(deleting.id);
      toast.success("Terms template deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Terms templates"
        subtitle="Reusable terms and conditions bodies"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Terms Template
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name…"
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
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.is_active || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null },
              })
            }
          >
            Clear
          </Button>
        ) : null}
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
          {termsTemplatesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : termsTemplatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(termsTemplatesQuery.error)}
                  onRetry={() => termsTemplatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No terms templates"
                  message={emptyListMessage(canCreate, "Create a terms template to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((template) => (
              <TableRow key={template.id}>
                <DataTableCells columns={columns} row={template} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <TermsTemplateFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete terms template"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this terms template"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteTermsTemplate.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
