"use client";

import Link from "next/link";

import { recurringPermissions } from "@/modules/erp/accounting/recurring/permissions";
import { useRecurringTemplates } from "@/modules/erp/accounting/recurring/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
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
import { useCan } from "@/shared/providers/session-provider";

export function RecurringScreen() {
  const can = useCan();
  const { page, page_size, search, setPage } = useTableParams();
  const templatesQuery = useRecurringTemplates({ page, page_size, search });
  const rows = templatesQuery.data?.data ?? [];
  const meta = templatesQuery.data?.meta;

  return (
    <ListPage>
      <PageHeader
        title="Recurring documents"
        subtitle="Schedules create draft invoices and bills. Nothing is posted automatically."
        actions={
          can(recurringPermissions.create) ? (
            <Button asChild>
              <Link href="/recurring/new">New template</Link>
            </Button>
          ) : undefined
        }
      />
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Next run</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templatesQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : templatesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={4}>
                <DataTableError
                  message={getErrorMessage(templatesQuery.error)}
                  onRetry={() => templatesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>
                <DataTableEmpty
                  title="No templates"
                  message="Create a schedule to generate drafts."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <RecordLink href={`/recurring/${row.id}`}>{row.name}</RecordLink>
                </TableCell>
                <TableCell>
                  {row.document_kind === "SALES_INVOICE" ? "Sales invoice" : "Purchase bill"}
                </TableCell>
                <TableCell>{row.next_run_date}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      {meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
    </ListPage>
  );
}
