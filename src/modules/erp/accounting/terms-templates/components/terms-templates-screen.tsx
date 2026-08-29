"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TermsTemplateFormDialog } from "@/modules/erp/accounting/terms-templates/components/terms-template-form-dialog";
import { useDeleteTermsTemplate } from "@/modules/erp/accounting/terms-templates/mutations";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { useTermsTemplates } from "@/modules/erp/accounting/terms-templates/queries";
import type { TermsTemplate } from "@/modules/erp/accounting/terms-templates/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const HEADERS = ["Name", "Default", "Status", "Actions"] as const;
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
  const can = useCan();
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const termsTemplatesQuery = useTermsTemplates({
    page,
    page_size,
    search,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteTermsTemplate = useDeleteTermsTemplate();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TermsTemplate | null>(null);
  const [deleting, setDeleting] = useState<TermsTemplate | null>(null);

  const rows = termsTemplatesQuery.data?.data ?? [];
  const meta = termsTemplatesQuery.data?.meta;

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
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Terms templates"
        subtitle="Reusable terms and conditions bodies"
        actions={
          can(termsTemplatePermissions.create) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
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
        <Select
          value={filters.is_active ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_active: value === ALL ? null : value } })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            {HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {termsTemplatesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : termsTemplatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(termsTemplatesQuery.error)}
                  onRetry={() => termsTemplatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty
                  title="No terms templates"
                  message="Create a terms template to get started."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  {template.is_default ? <Badge variant="info">Default</Badge> : "—"}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={template.is_active} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(termsTemplatePermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${template.name}`}
                        onClick={() => {
                          setEditing(template);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(termsTemplatePermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${template.name}`}
                        onClick={() => setDeleting(template)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <TermsTemplateFormDialog
        open={formOpen}
        template={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete terms template"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this terms template"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteTermsTemplate.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
