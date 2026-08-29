"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PaymentTermFormDialog } from "@/modules/erp/accounting/payment-terms/components/payment-term-form-dialog";
import { useDeletePaymentTerm } from "@/modules/erp/accounting/payment-terms/mutations";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { usePaymentTerms } from "@/modules/erp/accounting/payment-terms/queries";
import type { PaymentTerm } from "@/modules/erp/accounting/payment-terms/schemas";
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

const HEADERS = ["Name", "Days", "Description", "Status", "Actions"] as const;
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

export function PaymentTermsScreen() {
  const can = useCan();
  const { page, page_size, search, filters, setParams, setPage } = useTableParams();
  const paymentTermsQuery = usePaymentTerms({
    page,
    page_size,
    search,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deletePaymentTerm = useDeletePaymentTerm();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [deleting, setDeleting] = useState<PaymentTerm | null>(null);

  const rows = paymentTermsQuery.data?.data ?? [];
  const meta = paymentTermsQuery.data?.meta;

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deletePaymentTerm.mutateAsync(deleting.id);
      toast.success("Payment term deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Payment terms"
        subtitle="Payment terms copied onto commercial documents"
        actions={
          can(paymentTermPermissions.create) ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-3.5" />
              New Payment Term
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search payment terms…"
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
          {paymentTermsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : paymentTermsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(paymentTermsQuery.error)}
                  onRetry={() => paymentTermsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty
                  title="No payment terms"
                  message="Create a payment term to get started."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((term) => (
              <TableRow key={term.id}>
                <TableCell className="font-medium">{term.name}</TableCell>
                <TableCell>{term.days}</TableCell>
                <TableCell>{term.description ?? "—"}</TableCell>
                <TableCell>
                  <ActiveBadge active={term.is_active} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(paymentTermPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${term.name}`}
                        onClick={() => {
                          setEditing(term);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(paymentTermPermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${term.name}`}
                        onClick={() => setDeleting(term)}
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
      <PaymentTermFormDialog
        open={formOpen}
        term={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete payment term"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this payment term"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deletePaymentTerm.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
