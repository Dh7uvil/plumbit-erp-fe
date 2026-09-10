"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["Number", "Carton", "Status"] as const;
const ALL = "all";

export function PackagesScreen() {
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
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

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
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/packages/new">
                <Plus className="size-3.5" />
                New package
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search packages…"
        />
        <FilterSelect
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
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header} className="font-medium">
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {packagesQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : packagesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(packagesQuery.error)}
                  onRetry={() => packagesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No packages"
                  message={emptyListMessage(canCreate, "Create a package to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = packageDisplayNumber(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/packages/${row.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell>{row.package_number ?? "—"}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={row.status}
                      labels={PACKAGE_STATUS_LABELS}
                      variants={PACKAGE_STATUS_VARIANTS}
                    />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "package"}
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
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
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
