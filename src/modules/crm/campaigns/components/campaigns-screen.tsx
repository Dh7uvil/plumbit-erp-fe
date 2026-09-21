"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CampaignFormDialog } from "@/modules/crm/campaigns/components/campaign-form-dialog";
import { CampaignStatusBadge } from "@/modules/crm/campaigns/components/campaign-status-badge";
import { useDeleteCampaign } from "@/modules/crm/campaigns/mutations";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import { useCampaigns } from "@/modules/crm/campaigns/queries";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPES,
  CAMPAIGN_TYPE_LABELS,
  type Campaign,
  type CampaignStatus,
  type CampaignType,
} from "@/modules/crm/campaigns/schemas";
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
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "campaign_type", label: "Type" },
  { value: "start_date", label: "Start" },
  { value: "created_at", label: "Created" },
] as const;
const ALL = "all";

export function CampaignsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(campaignPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const statusFilter = CAMPAIGN_STATUSES.includes(filters.status as CampaignStatus)
    ? (filters.status as CampaignStatus)
    : undefined;
  const typeFilter = CAMPAIGN_TYPES.includes(filters.campaign_type as CampaignType)
    ? (filters.campaign_type as CampaignType)
    : undefined;
  const campaignsQuery = useCampaigns({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: statusFilter,
    campaign_type: typeFilter,
  });
  const deleteCampaign = useDeleteCampaign();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const rows = campaignsQuery.data?.data ?? [];
  const meta = campaignsQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Campaign>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (campaign) => (
          <RecordLink href={`/campaigns/${campaign.id}`} className="block truncate">
            {campaign.name}
          </RecordLink>
        ),
      },
      {
        id: "campaign_type",
        header: "Type",
        sortableField: "campaign_type",
        cell: (campaign) => CAMPAIGN_TYPE_LABELS[campaign.campaign_type],
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (campaign) => <CampaignStatusBadge status={campaign.status} />,
      },
      {
        id: "start_date",
        header: "Start",
        sortableField: "start_date",
        cell: (campaign) => formatDate(campaign.start_date),
      },
      {
        id: "actual_cost",
        header: "Actual cost",
        className: "text-right tabular-nums",
        cell: (campaign) => formatDecimal(campaign.actual_cost),
      },
      ...auditTimestampColumns<Campaign>(),
      ...auditActorColumns<Campaign>(userNameById),
      ...actionsColumn<Campaign>(showActions, (campaign) => (
        <DataTableRowActions
          entityName={campaign.name}
          viewHref={canRead ? `/campaigns/${campaign.id}` : undefined}
          editHref={canUpdate ? `/campaigns/${campaign.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(campaign) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("crm.campaigns", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteCampaign.mutateAsync(deleting.id);
      toast.success("Campaign deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Campaigns"
        subtitle="Attribute leads and opportunities to marketing campaigns"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New Campaign
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search campaigns…"
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
            ...CAMPAIGN_STATUSES.map((status) => ({
              value: status,
              label: CAMPAIGN_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
          label="Type"
          className="w-44"
          placeholder="Type"
          value={filters.campaign_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { campaign_type: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All types" },
            ...CAMPAIGN_TYPES.map((type) => ({
              value: type,
              label: CAMPAIGN_TYPE_LABELS[type],
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
        {search || filters.status || filters.campaign_type || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { status: null, campaign_type: null },
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
          {campaignsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : campaignsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(campaignsQuery.error)}
                  onRetry={() => campaignsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No campaigns"
                  message={emptyListMessage(canCreate, "Create a campaign to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((campaign) => (
              <TableRow key={campaign.id}>
                <DataTableCells columns={columns} row={campaign} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <CampaignFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete campaign"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this campaign"}? Leads and opportunities that still attribute this campaign must be unlinked first.`}
        confirmLabel="Delete"
        pending={deleteCampaign.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
