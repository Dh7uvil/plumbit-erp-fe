"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useDeletePackage } from "@/modules/inventory-management/packages/mutations";
import { packagePermissions } from "@/modules/inventory-management/packages/permissions";
import { usePackages } from "@/modules/inventory-management/packages/queries";
import {
  PACKAGE_STATUS_LABELS,
  PACKAGE_STATUS_VARIANTS,
  PACKAGE_STATUSES,
  packageDisplayNumber,
  parsePackageStatus,
  type Package,
} from "@/modules/inventory-management/packages/schemas";
import { PACKAGE_ACTION_REGISTRY } from "@/modules/inventory-management/packages/workflow";
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
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ImexToolbar } from "@/shared/components/imex/imex-toolbar";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";

export function PackagesScreen() {
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(packagePermissions);
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const packagesQuery = usePackages({
    page,
    page_size,
    search,
    status: parsePackageStatus(filters.status),
  });
  const deletePackage = useDeletePackage();
  const [deleting, setDeleting] = useState<Package | null>(null);
  const rows = packagesQuery.data?.data ?? [];
  const meta = packagesQuery.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Package>> => {
    return [
      {
        id: "document_number",
        header: "Number",
        className: "font-mono text-sm",
        cell: (row) => (
          <RecordLink href={`/packages/${row.id}`}>{packageDisplayNumber(row) ?? "—"}</RecordLink>
        ),
      },
      {
        id: "carton",
        header: "Carton",
        cell: (row) => row.package_number ?? "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <DocumentStatusBadge
            status={row.status}
            labels={PACKAGE_STATUS_LABELS}
            variants={PACKAGE_STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "length",
        header: "Length",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (row) => row.length || "—",
      },
      {
        id: "width",
        header: "Width",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (row) => row.width || "—",
      },
      {
        id: "height",
        header: "Height",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (row) => row.height || "—",
      },
      {
        id: "gross_weight",
        header: "Gross weight",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (row) => row.gross_weight || "—",
      },
      {
        id: "net_weight",
        header: "Net weight",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (row) => row.net_weight || "—",
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "max-w-xs truncate",
        cell: (row) => row.notes || "—",
      },
      ...auditTimestampColumns<Package>(),
      ...auditActorColumns<Package>(userNameById),
      ...actionsColumn<Package>(showActions, (row) => {
        const number = packageDisplayNumber(row);
        return (
          <DataTableRowActions
            entityName={number}
            viewHref={canRead ? `/packages/${row.id}` : undefined}
            editHref={
              canUpdate && row.status === "DRAFT" ? `/packages/${row.id}/edit` : undefined
            }
            onDelete={
              row.available_actions.includes("delete") && canDelete
                ? () => setDeleting(row)
                : undefined
            }
          />
        );
      }),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.packages", columnDefs);

  async function onDelete() {
    if (!deleting) return;
    try {
      await deletePackage.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Package deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Packages"
        subtitle="Optional carton packing for a sales order"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImexToolbar
              resource="packages"
              title="packages"
              canImport={can(packagePermissions.import) || canCreate}
              canExport={can(packagePermissions.export) || canRead}
              exportParams={{ search, status: filters.status }}
              onImported={() => {
                void packagesQuery.refetch();
              }}
            />
            {canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/packages/new">
                <Plus className="size-3.5" />
                New package
              </Link>
            </Button>
            ) : null}
          </div>
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search number, order, marks…"
        />
        <FilterSelect
          label="Status"
          className="w-40"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...PACKAGE_STATUSES.map((status) => ({
              value: status,
              label: PACKAGE_STATUS_LABELS[status],
            })),
          ]}
        />
        {columnsDialog}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads columns={columns} onSort={setParams} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {packagesQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : packagesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(packagesQuery.error)}
                  onRetry={() => packagesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No packages"
                  message={emptyListMessage(canCreate, "Create a package to get started.")}
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
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={`Delete package ${deleting ? (packageDisplayNumber(deleting) ?? "package") : ""}`}
        description={
          deleting
            ? (getDocumentAction(PACKAGE_ACTION_REGISTRY, "delete").confirmCopy?.(
                packageDisplayNumber(deleting) ?? "package",
              ) ?? "")
            : ""
        }
        confirmLabel="Delete"
        pending={deletePackage.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={() => void onDelete()}
      />
    </ListPage>
  );
}
