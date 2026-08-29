"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DocumentSequenceFormDialog } from "@/modules/erp/accounting/document-sequences/components/document-sequence-form-dialog";
import { useDeleteDocumentSequence } from "@/modules/erp/accounting/document-sequences/mutations";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { useDocumentSequences } from "@/modules/erp/accounting/document-sequences/queries";
import type { DocumentSequence } from "@/modules/erp/accounting/document-sequences/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { PageHeader } from "@/shared/components/layout/page-header";
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

const HEADERS = ["Type", "Series", "Year", "Prefix", "Next", "Padding", "Status", "Actions"] as const;
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

export function DocumentSequencesScreen() {
  const can = useCan();
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const documentSequencesQuery = useDocumentSequences({
    page,
    page_size,
    search,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteDocumentSequence = useDeleteDocumentSequence();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentSequence | null>(null);
  const [deleting, setDeleting] = useState<DocumentSequence | null>(null);

  const rows = documentSequencesQuery.data?.data ?? [];
  const meta = documentSequencesQuery.data?.meta;

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteDocumentSequence.mutateAsync(deleting.id);
      toast.success("Document sequence deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Document sequences"
        subtitle="Locked counters for document numbers"
        actions={
          can(documentSequencePermissions.create) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New Document Sequence
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search document sequences…"
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
          {documentSequencesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : documentSequencesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(documentSequencesQuery.error)}
                  onRetry={() => documentSequencesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty
                  title="No document sequences"
                  message="Create a document sequence to get started."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((sequence) => (
              <TableRow key={sequence.id}>
                <TableCell>{sequence.document_type}</TableCell>
                <TableCell className="font-medium">{sequence.series}</TableCell>
                <TableCell>{sequence.fiscal_year}</TableCell>
                <TableCell className="font-mono text-sm">{sequence.prefix}</TableCell>
                <TableCell>{sequence.next_number}</TableCell>
                <TableCell>{sequence.padding}</TableCell>
                <TableCell>
                  <ActiveBadge active={sequence.is_active} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(documentSequencePermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${sequence.series} ${sequence.fiscal_year}`}
                        onClick={() => {
                          setEditing(sequence);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(documentSequencePermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${sequence.series} ${sequence.fiscal_year}`}
                        onClick={() => setDeleting(sequence)}
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
      <DocumentSequenceFormDialog
        open={formOpen}
        sequence={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete document sequence"
        description={`Delete ${deleting ? `"${deleting.series}" (${deleting.fiscal_year})` : "this document sequence"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteDocumentSequence.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
