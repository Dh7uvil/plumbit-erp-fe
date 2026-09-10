"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AccountFormDialog } from "@/modules/erp/accounting/accounts/components/account-form-dialog";
import { SystemAccountsCard } from "@/modules/erp/accounting/accounts/components/system-accounts-card";
import { useDeleteAccount } from "@/modules/erp/accounting/accounts/mutations";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { useAccountTree, useAccounts } from "@/modules/erp/accounting/accounts/queries";
import {
  ACCOUNT_SUBTYPE_LABELS,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  flattenAccountTree,
  type Account,
  type AccountTreeNode,
  type AccountType,
} from "@/modules/erp/accounting/accounts/schemas";
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
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { TreeView, type TreeViewNode } from "@/shared/components/ui/tree-view";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useRouter } from "next/navigation";

const COLUMN_HEADERS = ["Code", "Name", "Type", "Subtype", "Kind", "Status"] as const;
const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
  { value: "account_type", label: "Type" },
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Code: "code",
  Name: "name",
  Type: "account_type",
};
const ALL = "all";
const VIEW_TREE = "tree";
const VIEW_LIST = "list";

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

function toTreeNodes(nodes: AccountTreeNode[]): TreeViewNode<Account>[] {
  return nodes.map((node) => ({
    id: node.id,
    data: node,
    label: (
      <span className="flex min-w-0 items-center gap-2">
        <span className="font-mono text-xs">{node.code}</span>
        <span className="truncate">{node.name}</span>
        {node.is_group ? <Badge variant="secondary">Group</Badge> : null}
      </span>
    ),
    children: node.children.length > 0 ? toTreeNodes(node.children) : undefined,
  }));
}

export function AccountsScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(accountPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const view = filters.view === VIEW_LIST ? VIEW_LIST : VIEW_TREE;
  const accountType =
    filters.account_type && ACCOUNT_TYPES.includes(filters.account_type as AccountType)
      ? (filters.account_type as AccountType)
      : undefined;
  const accountsQuery = useAccounts({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    account_type: accountType,
    is_group: parseBoolFilter(filters.is_group),
    is_active: parseBoolFilter(filters.is_active),
  });
  const treeQuery = useAccountTree(view === VIEW_TREE);
  const deleteAccount = useDeleteAccount();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);
  const rows = accountsQuery.data?.data ?? [];
  const meta = accountsQuery.data?.meta;
  const treeNodes = useMemo(() => toTreeNodes(treeQuery.data ?? []), [treeQuery.data]);
  const treeCount = useMemo(
    () => flattenAccountTree(treeQuery.data ?? []).length,
    [treeQuery.data],
  );

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteAccount.mutateAsync(deleting.id);
      toast.success("Account deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Chart of accounts"
        subtitle="Postable accounts and groups used by the ledger"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New account
            </Button>
          ) : undefined
        }
      />
      <Tabs
        value={view}
        onValueChange={(value) => setParams({ filters: { view: value === VIEW_LIST ? VIEW_LIST : null } })}
      >
        <DataTableToolbar>
          <TabsList>
            <TabsTrigger value={VIEW_TREE}>Tree</TabsTrigger>
            <TabsTrigger value={VIEW_LIST}>List</TabsTrigger>
          </TabsList>
          {view === VIEW_LIST ? (
            <>
              <ListSearch
                value={search ?? ""}
                onChange={(value) => setParams({ search: value || null })}
                placeholder="Search accounts…"
              />
              <FilterSelect
                className="w-40"
                placeholder="Type"
                aria-label="Filter by type"
                value={filters.account_type ?? ALL}
                onValueChange={(value) =>
                  setParams({ filters: { account_type: value === ALL ? null : value } })
                }
                options={[
                  { value: ALL, label: "All types" },
                  ...ACCOUNT_TYPES.map((type) => ({
                    value: type,
                    label: ACCOUNT_TYPE_LABELS[type],
                  })),
                ]}
              />
              <FilterSelect
                className="w-36"
                placeholder="Status"
                aria-label="Filter by status"
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
            </>
          ) : null}
        </DataTableToolbar>
        <TabsContent value={VIEW_TREE}>
          {treeQuery.isLoading ? <Skeleton className="h-64 w-full" /> : null}
          {treeQuery.isError ? (
            <DataTableError
              message={getErrorMessage(treeQuery.error)}
              onRetry={() => treeQuery.refetch()}
            />
          ) : null}
          {!treeQuery.isLoading && !treeQuery.isError && treeCount === 0 ? (
            <DataTableEmpty
              title="No accounts"
              message={emptyListMessage(canCreate, "Seeded accounts appear here after go-live.")}
            />
          ) : null}
          {treeCount > 0 ? (
            <Card>
              <CardContent className="pt-4">
                <TreeView
                  nodes={treeNodes}
                  onSelect={(node) => router.push(`/accounts/${node.id}`)}
                />
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
        <TabsContent value={VIEW_LIST}>
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
              {accountsQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={headers.length}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : accountsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={headers.length}>
                    <DataTableError
                      message={getErrorMessage(accountsQuery.error)}
                      onRetry={() => accountsQuery.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length}>
                    <DataTableEmpty
                      title="No accounts"
                      message={emptyListMessage(canCreate, "Create an account to get started.")}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">
                      <RecordLink href={`/accounts/${row.id}`}>{row.code}</RecordLink>
                    </TableCell>
                    <TableCell>
                      <RecordLink href={`/accounts/${row.id}`}>{row.name}</RecordLink>
                    </TableCell>
                    <TableCell>{ACCOUNT_TYPE_LABELS[row.account_type]}</TableCell>
                    <TableCell>{ACCOUNT_SUBTYPE_LABELS[row.account_subtype]}</TableCell>
                    <TableCell>
                      {row.is_group ? <Badge variant="secondary">Group</Badge> : "Postable"}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={row.is_active} />
                    </TableCell>
                    {showActions ? (
                      <TableCell>
                        <DataTableRowActions
                          entityName={row.code}
                          viewHref={canRead ? `/accounts/${row.id}` : undefined}
                          editHref={canUpdate ? `/accounts/${row.id}/edit` : undefined}
                          onDelete={
                            canDelete && !row.is_system ? () => setDeleting(row) : undefined
                          }
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </TabsContent>
      </Tabs>
      <SystemAccountsCard />
      <AccountFormDialog open={formOpen} account={null} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete account"
        description={`Delete ${deleting ? `"${deleting.code} ${deleting.name}"` : "this account"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteAccount.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
