"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CategoryFormDialog } from "@/modules/inventory-management/categories/components/category-form-dialog";
import { useDeleteCategory } from "@/modules/inventory-management/categories/mutations";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { useAllCategories, useCategories } from "@/modules/inventory-management/categories/queries";
import type { Category } from "@/modules/inventory-management/categories/schemas";
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
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "code", label: "Code" },
  { value: "name", label: "Name" },
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

export function CategoriesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(categoryPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const categoriesQuery = useCategories({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
    parent_id: filters.parent_id,
  });
  const allCategoriesQuery = useAllCategories();
  const deleteCategory = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = categoriesQuery.data?.data ?? [];
  const meta = categoriesQuery.data?.meta;
  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of allCategoriesQuery.data ?? []) {
      map.set(category.id, category.name);
    }
    return map;
  }, [allCategoriesQuery.data]);
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<Category>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        className: "font-mono text-sm",
        cell: (category) => (
          <RecordLink href={`/categories/${category.id}`}>{category.code}</RecordLink>
        ),
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "font-medium",
        cell: (category) => (
          <RecordLink href={`/categories/${category.id}`}>{category.name}</RecordLink>
        ),
      },
      {
        id: "parent",
        header: "Parent",
        cell: (category) =>
          category.parent_id ? (parentNameById.get(category.parent_id) ?? "—") : "—",
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (category) => <ActiveBadge active={category.is_active} />,
      },
      ...auditTimestampColumns<Category>(),
      ...auditActorColumns<Category>(userNameById),
      ...actionsColumn<Category>(showActions, (category) => (
        <DataTableRowActions
          entityName={category.name}
          viewHref={canRead ? `/categories/${category.id}` : undefined}
          editHref={canUpdate ? `/categories/${category.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(category) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, parentNameById, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.categories", columnDefs);

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteCategory.mutateAsync(deleting.id);
      toast.success("Category deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Categories"
        subtitle="Product category hierarchy"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Category
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search code, name…"
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
          label="Parent"
          className="w-44"
          placeholder="Parent"
          value={filters.parent_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { parent_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All parents" },
            ...(allCategoriesQuery.data ?? []).map((category) => ({
              value: category.id,
              label: category.name,
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
        {search || filters.is_active || filters.parent_id || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null, parent_id: null },
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
          {categoriesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : categoriesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(categoriesQuery.error)}
                  onRetry={() => categoriesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No categories"
                  message={emptyListMessage(canCreate, "Create a category to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((category) => (
              <TableRow key={category.id}>
                <DataTableCells columns={columns} row={category} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete category"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this category"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteCategory.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
