"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TermsTemplateFormDialog } from "@/modules/erp/accounting/terms-templates/components/terms-template-form-dialog";
import { useDeleteTermsTemplate } from "@/modules/erp/accounting/terms-templates/mutations";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { useTermsTemplates } from "@/modules/erp/accounting/terms-templates/queries";
import type { TermsTemplate } from "@/modules/erp/accounting/terms-templates/schemas";
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
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["Name", "Default", "Status"] as const;
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
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const termsTemplatesQuery = useTermsTemplates({
    page,
    page_size,
    search,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteTermsTemplate = useDeleteTermsTemplate();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<TermsTemplate | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = termsTemplatesQuery.data?.data ?? [];
  const meta = termsTemplatesQuery.data?.meta;

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
          placeholder="Search terms templates…"
        />
        <FilterSelect
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
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {termsTemplatesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : termsTemplatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(termsTemplatesQuery.error)}
                  onRetry={() => termsTemplatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No terms templates"
                  message={emptyListMessage(canCreate, "Create a terms template to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  <RecordLink href={`/terms-templates/${template.id}`}>{template.name}</RecordLink>
                </TableCell>
                <TableCell>
                  <RecordLink href={`/terms-templates/${template.id}`}>
                    {template.is_default ? <Badge variant="info">Default</Badge> : "—"}
                  </RecordLink>
                </TableCell>
                <TableCell>
                  <ActiveBadge active={template.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={template.name}
                      viewHref={canRead ? `/terms-templates/${template.id}` : undefined}
                      editHref={canUpdate ? `/terms-templates/${template.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(template) : undefined}
                    />
                  </TableCell>
                ) : null}
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
