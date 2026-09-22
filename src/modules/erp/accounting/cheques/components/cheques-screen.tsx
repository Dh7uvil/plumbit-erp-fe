"use client";

import Link from "next/link";

import { useCheques } from "@/modules/erp/accounting/cheques/queries";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

export function ChequesScreen() {
  const { canCreate } = useCrudPermissions(chequePermissions);
  const { page, page_size, filters, setParams, setPage } = useTableParams();
  const query = useCheques({
    page,
    page_size,
    status: filters.status,
    direction: filters.direction,
    due_date_from: filters.due_from,
    due_date_to: filters.due_to,
  });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <ListPage>
      <PageHeader
        title="Cheques"
        subtitle="PDC register with issue, deposit, clear and bounce lifecycle."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/cheques/new">New cheque</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={filters.due === "pdc" ? "default" : "outline"}
          onClick={() =>
            setParams({
              filters: {
                ...filters,
                due: filters.due === "pdc" ? undefined : "pdc",
                due_from: filters.due === "pdc" ? undefined : new Date().toISOString().slice(0, 10),
              },
              page: 1,
            })
          }
        >
          PDC due view
        </Button>
        <Button
          variant={filters.status === "DRAFT" ? "default" : "outline"}
          onClick={() =>
            setParams({
              filters: {
                ...filters,
                status: filters.status === "DRAFT" ? undefined : "DRAFT",
              },
              page: 1,
            })
          }
        >
          Drafts
        </Button>
        <Button
          variant={filters.direction === "INBOUND" ? "default" : "outline"}
          onClick={() =>
            setParams({
              filters: {
                ...filters,
                direction: filters.direction === "INBOUND" ? undefined : "INBOUND",
              },
              page: 1,
            })
          }
        >
          Inbound
        </Button>
        <Button
          variant={filters.direction === "OUTBOUND" ? "default" : "outline"}
          onClick={() =>
            setParams({
              filters: {
                ...filters,
                direction: filters.direction === "OUTBOUND" ? undefined : "OUTBOUND",
              },
              page: 1,
            })
          }
        >
          Outbound
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cheque</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            </TableRow>
          ) : query.isError ? (
            <TableRow>
              <TableCell colSpan={5}>
                <DataTableError
                  message={getErrorMessage(query.error)}
                  onRetry={() => query.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <DataTableEmpty
                  title="No cheques"
                  message={emptyListMessage(canCreate, "Create a cheque to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link href={`/cheques/${row.id}`} className="font-medium hover:underline">
                    {row.cheque_number}
                  </Link>
                  <div className="text-muted-foreground text-xs">{row.document_number}</div>
                </TableCell>
                <TableCell>{row.party_type ?? "—"}</TableCell>
                <TableCell>{row.due_date ?? row.cheque_date}</TableCell>
                <TableCell>{row.amount}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.status}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
    </ListPage>
  );
}
