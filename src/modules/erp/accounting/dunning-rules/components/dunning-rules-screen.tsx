"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DunningRuleForm } from "@/modules/erp/accounting/dunning-rules/components/dunning-rule-form";
import { useDeleteDunningRule } from "@/modules/erp/accounting/dunning-rules/mutations";
import { dunningPermissions } from "@/modules/erp/accounting/dunning-rules/permissions";
import { useDunningRules } from "@/modules/erp/accounting/dunning-rules/queries";
import {
  DUNNING_TEMPLATE_LABELS,
  type DunningRule,
} from "@/modules/erp/accounting/dunning-rules/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
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
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "days_offset", label: "Days offset" },
  { value: "is_active", label: "Status" },
] as const;
const ALL = "all";

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function DunningRulesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions({
    ...dunningPermissions,
    create: dunningPermissions.manage,
    update: dunningPermissions.manage,
    delete: dunningPermissions.manage,
  });
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const rulesQuery = useDunningRules({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteRule = useDeleteDunningRule();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<DunningRule | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = rulesQuery.data?.data ?? [];
  const meta = rulesQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<DunningRule>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (rule) => (
          <RecordLink href={`/dunning-rules/${rule.id}`} className="block truncate">
            {rule.name}
          </RecordLink>
        ),
      },
      {
        id: "days_offset",
        header: "Days from due",
        sortableField: "days_offset",
        cell: (rule) => rule.days_offset,
      },
      {
        id: "template_key",
        header: "Template",
        cell: (rule) => DUNNING_TEMPLATE_LABELS[rule.template_key],
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (rule) => <ActiveBadge active={rule.is_active} />,
      },
      ...actionsColumn<DunningRule>(showActions, (rule) => (
        <DataTableRowActions
          entityName={rule.name}
          viewHref={canRead ? `/dunning-rules/${rule.id}` : undefined}
          editHref={canUpdate ? `/dunning-rules/${rule.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(rule) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.dunning_rules", columnDefs);

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteRule.mutateAsync(deleting.id);
      toast.success("Dunning rule deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Payment reminders"
        subtitle="Automated dunning rules for overdue sales invoices"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New rule
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name or description…"
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
        <SortDialog fields={SORT_FIELDS} sortBy={sort_by} sortOrder={sort_order} onApply={setParams} />
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
          {rulesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : rulesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(rulesQuery.error)}
                  onRetry={() => rulesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No dunning rules"
                  message={emptyListMessage(canCreate, "Create a dunning rule to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((rule) => (
              <TableRow key={rule.id}>
                <DataTableCells columns={columns} row={rule} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New dunning rule</DialogTitle>
          </DialogHeader>
          <DunningRuleForm
            rule={null}
            showCancel
            onCancel={() => setFormOpen(false)}
            onSuccess={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete dunning rule"
        description={
          deleting
            ? `Delete "${deleting.name}"? Reminder history is kept.`
            : "Delete this dunning rule?"
        }
        confirmLabel="Delete"
        pending={deleteRule.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
