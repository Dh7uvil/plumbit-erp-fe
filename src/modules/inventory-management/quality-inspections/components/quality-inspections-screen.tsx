"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import { goodsReceiptDisplayNumber } from "@/modules/inventory-management/goods-receipts/schemas";
import { useDeleteQualityInspection } from "@/modules/inventory-management/quality-inspections/mutations";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { useQualityInspections } from "@/modules/inventory-management/quality-inspections/queries";
import {
  QUALITY_INSPECTION_STATUS_LABELS,
  QUALITY_INSPECTION_STATUS_VARIANTS,
  QUALITY_INSPECTION_STATUSES,
  parseQualityInspectionStatus,
  qualityInspectionDisplayNumber,
  type QualityInspection,
} from "@/modules/inventory-management/quality-inspections/schemas";
import { QUALITY_INSPECTION_ACTION_REGISTRY } from "@/modules/inventory-management/quality-inspections/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Date", "Goods receipt", "Status"] as const;
const ALL = "all";
const EMPTY_EXTRA = {
  inspectionDateFrom: "",
  inspectionDateTo: "",
};

function extraFromFilters(filters: Record<string, string | undefined>) {
  return {
    inspectionDateFrom: filters.inspection_date_from ?? "",
    inspectionDateTo: filters.inspection_date_to ?? "",
  };
}

function extraCountOf(extra: typeof EMPTY_EXTRA) {
  return [extra.inspectionDateFrom !== "", extra.inspectionDateTo !== ""].filter(Boolean).length;
}

const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "inspection_date", label: "Date" },
  { value: "status", label: "Status" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "inspection_date",
  Status: "status",
};

export function QualityInspectionsScreen() {
  const { canCreate, canRead, canUpdate } = useCrudPermissions(qualityInspectionPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = extraFromFilters(filters);
  const extraCount = extraCountOf(extraFilters);
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const inspectionsQuery = useQualityInspections({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseQualityInspectionStatus(filters.status),
    goods_receipt_id: filters.goods_receipt_id,
    inspection_date_from: filters.inspection_date_from,
    inspection_date_to: filters.inspection_date_to,
  });
  const receiptsQuery = useGoodsReceipts({ page_size: 100 });
  const deleteInspection = useDeleteQualityInspection();
  const [deleting, setDeleting] = useState<QualityInspection | null>(null);
  const rows = inspectionsQuery.data?.data ?? [];
  const meta = inspectionsQuery.data?.meta;
  const receipts = receiptsQuery.data?.data ?? [];
  const receiptLabelById = new Map(
    receipts.map((row) => [row.id, goodsReceiptDisplayNumber(row) ?? row.id]),
  );
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canUpdate);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteInspection.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Quality inspection deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Quality inspections"
        subtitle="Release, scrap, or return inbound stock on hold"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/quality-inspections/new">
                <Plus className="size-3.5" />
                New inspection
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search inspections…"
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
            ...QUALITY_INSPECTION_STATUSES.map((status) => ({
              value: status,
              label: QUALITY_INSPECTION_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
          className="w-48"
          placeholder="Goods receipt"
          value={filters.goods_receipt_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { goods_receipt_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All receipts" },
            ...receipts.map((row) => ({
              value: row.id,
              label: goodsReceiptDisplayNumber(row) ?? row.id,
            })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={extraCountOf(draftExtra)}
          description="Filter by inspection date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                inspection_date_from:
                  draftExtra.inspectionDateFrom === "" ? null : draftExtra.inspectionDateFrom,
                inspection_date_to:
                  draftExtra.inspectionDateTo === "" ? null : draftExtra.inspectionDateTo,
              },
            })
          }
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <FilterField label="From date" htmlFor="qi-filter-from">
            <Input
              id="qi-filter-from"
              type="date"
              value={draftExtra.inspectionDateFrom}
              onChange={(event) =>
                setDraftExtra((current) => ({
                  ...current,
                  inspectionDateFrom: event.target.value,
                }))
              }
            />
          </FilterField>
          <FilterField label="To date" htmlFor="qi-filter-to">
            <Input
              id="qi-filter-to"
              type="date"
              value={draftExtra.inspectionDateTo}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, inspectionDateTo: event.target.value }))
              }
            />
          </FilterField>
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {search || filters.status || filters.goods_receipt_id || extraCount > 0 || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: {
                  status: null,
                  goods_receipt_id: null,
                  inspection_date_from: null,
                  inspection_date_to: null,
                },
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
            <SortableHeads
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspectionsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : inspectionsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(inspectionsQuery.error)}
                  onRetry={() => inspectionsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No quality inspections"
                  message={emptyListMessage(canCreate, "Create an inspection to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = qualityInspectionDisplayNumber(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/quality-inspections/${row.id}`}>
                      {number ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(row.inspection_date)}</TableCell>
                  <TableCell>
                    <RecordLink href={`/goods-receipts/${row.goods_receipt_id}`}>
                      {receiptLabelById.get(row.goods_receipt_id) ?? "Goods receipt"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={row.status}
                      labels={QUALITY_INSPECTION_STATUS_LABELS}
                      variants={QUALITY_INSPECTION_STATUS_VARIANTS}
                    />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "inspection"}
                        viewHref={canRead ? `/quality-inspections/${row.id}` : undefined}
                        editHref={
                          canUpdate && row.status === "DRAFT"
                            ? `/quality-inspections/${row.id}/edit`
                            : undefined
                        }
                        onDelete={
                          row.available_actions.includes("delete") && canUpdate
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
        title={`${getDocumentAction(QUALITY_INSPECTION_ACTION_REGISTRY, "delete").label} quality inspection ${deleting ? (qualityInspectionDisplayNumber(deleting) ?? "inspection") : "inspection"}`}
        description={
          deleting
            ? (getDocumentAction(QUALITY_INSPECTION_ACTION_REGISTRY, "delete").confirmCopy?.(
                qualityInspectionDisplayNumber(deleting) ?? "inspection",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(QUALITY_INSPECTION_ACTION_REGISTRY, "delete").label}
        pending={deleteInspection.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onConfirm={() => void onDelete()}
      />
    </ListPage>
  );
}
