"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AccountFormDialog } from "@/modules/erp/accounting/accounts/components/account-form-dialog";
import { SystemAccountsCard } from "@/modules/erp/accounting/accounts/components/system-accounts-card";
import { useDeleteAccount } from "@/modules/erp/accounting/accounts/mutations";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import {
  useAccountTree,
  useAccounts,
  useAllAccounts,
} from "@/modules/erp/accounting/accounts/queries";
import {
  ACCOUNT_SUBTYPE_LABELS,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  flattenAccountTree,
  type Account,
  type AccountTreeNode,
  type AccountType,
} from "@/modules/erp/accounting/accounts/schemas";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
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
import { ListPage, ListPageContent } from "@/shared/components/layout/list-page";
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

const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
  { value: "account_type", label: "Type" },
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
] as const;
const ALL = "all";
const VIEW_TREE = "tree";
const VIEW_LIST = "list";
const VIEW_SYSTEM = "system";

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
    textLabel: `${node.code} ${node.name}`,
    children: node.children.length > 0 ? toTreeNodes(node.children) : undefined,
  }));
}

export function AccountsScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(accountPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const view =
    filters.view === VIEW_LIST ? VIEW_LIST : filters.view === VIEW_SYSTEM ? VIEW_SYSTEM : VIEW_TREE;
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
  const allAccountsQuery = useAllAccounts({}, view === VIEW_LIST);
  const currenciesQuery = useAllCurrencies(view === VIEW_LIST);
  const deleteAccount = useDeleteAccount();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const rows = accountsQuery.data?.data ?? [];
  const meta = accountsQuery.data?.meta;
  const treeNodes = useMemo(() => toTreeNodes(treeQuery.data ?? []), [treeQuery.data]);
  const treeCount = useMemo(
    () => flattenAccountTree(treeQuery.data ?? []).length,
    [treeQuery.data],
  );
  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of allAccountsQuery.data ?? []) {
      map.set(account.id, account.name);
    }
    return map;
  }, [allAccountsQuery.data]);
  const currencyCodeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const currency of currenciesQuery.data ?? []) {
      map.set(currency.id, currency.code);
    }
    return map;
  }, [currenciesQuery.data]);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Account>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        className: "font-mono text-sm",
        cell: (row) => <RecordLink href={`/accounts/${row.id}`}>{row.code}</RecordLink>,
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        cell: (row) => <RecordLink href={`/accounts/${row.id}`}>{row.name}</RecordLink>,
      },
      {
        id: "account_type",
        header: "Type",
        sortableField: "account_type",
        cell: (row) => ACCOUNT_TYPE_LABELS[row.account_type],
      },
      {
        id: "subtype",
        header: "Subtype",
        cell: (row) => ACCOUNT_SUBTYPE_LABELS[row.account_subtype],
      },
      {
        id: "kind",
        header: "Kind",
        cell: (row) => (row.is_group ? <Badge variant="secondary">Group</Badge> : "Postable"),
      },
      {
        id: "is_active",
        header: "Status",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      {
        id: "description",
        header: "Description",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (row) => row.description || "—",
      },
      {
        id: "parent",
        header: "Parent",
        defaultVisible: false,
        cell: (row) => (row.parent_id ? (parentNameById.get(row.parent_id) ?? "—") : "—"),
      },
      {
        id: "currency",
        header: "Currency",
        defaultVisible: false,
        cell: (row) => (row.currency_id ? (currencyCodeById.get(row.currency_id) ?? "—") : "—"),
      },
      {
        id: "is_system",
        header: "System",
        defaultVisible: false,
        cell: (row) => (row.is_system ? "Yes" : "No"),
      },
      ...auditTimestampColumns<Account>(),
      ...auditActorColumns<Account>(userNameById),
      ...actionsColumn<Account>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.code}
          viewHref={canRead ? `/accounts/${row.id}` : undefined}
          editHref={canUpdate ? `/accounts/${row.id}/edit` : undefined}
          onDelete={canDelete && !row.is_system ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, currencyCodeById, parentNameById, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.accounts", columnDefs);

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
      <ListPageContent>
        <Tabs
          value={view}
          className="flex w-full flex-col gap-5"
          onValueChange={(value) =>
            setParams({
              filters: {
                view: value === VIEW_LIST || value === VIEW_SYSTEM ? value : null,
              },
            })
          }
        >
          <DataTableToolbar className="shrink-0">
            <TabsList>
              <TabsTrigger value={VIEW_TREE}>Tree</TabsTrigger>
              <TabsTrigger value={VIEW_LIST}>List</TabsTrigger>
              <TabsTrigger value={VIEW_SYSTEM}>System accounts</TabsTrigger>
            </TabsList>
            {view === VIEW_LIST ? (
              <>
                <ListSearch
                value={search ?? ""}
                onChange={(value) => setParams({ search: value || null })}
                placeholder="Search code, name, description…"
              />
              <FilterSelect
                label="Type"
                className="w-40"
                placeholder="Type"
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
              </>
            ) : null}
          </DataTableToolbar>
          <TabsContent value={VIEW_TREE} className="mt-0">
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
          <TabsContent value={VIEW_LIST} className="mt-0">
            <DataTable
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
              {accountsQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={colSpan}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : accountsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={colSpan}>
                    <DataTableError
                      message={getErrorMessage(accountsQuery.error)}
                      onRetry={() => accountsQuery.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan}>
                    <DataTableEmpty
                      title="No accounts"
                      message={emptyListMessage(canCreate, "Create an account to get started.")}
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
          </TabsContent>
          <TabsContent value={VIEW_SYSTEM} className="mt-0">
            <SystemAccountsCard />
          </TabsContent>
        </Tabs>
      </ListPageContent>
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
