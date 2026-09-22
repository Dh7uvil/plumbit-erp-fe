"use client";

import { Download } from "lucide-react";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import {
  useCustomerStatement,
  useSupplierStatement,
} from "@/modules/erp/accounting/reports/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTable } from "@/shared/components/data-table/data-table";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { documentDetailHref } from "@/shared/components/document/document-links";
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
import { formatDate, formatReportMoney } from "@/shared/lib/format";

const ALL = "all";
const COLUMN_COUNT = 7;

export function PartyStatementScreen({ kind }: { kind: "customer" | "supplier" }) {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const partyId = kind === "customer" ? (filters.customer_id ?? "") : (filters.supplier_id ?? "");
  const customersQuery = useAllCustomers(kind === "customer");
  const suppliersQuery = useAllSuppliers(kind === "supplier");
  const parties = kind === "customer" ? (customersQuery.data ?? []) : (suppliersQuery.data ?? []);
  const customerQuery = useCustomerStatement(
    kind === "customer" && partyId ? { customer_id: partyId, from, to } : null,
  );
  const supplierQuery = useSupplierStatement(
    kind === "supplier" && partyId ? { supplier_id: partyId, from, to } : null,
  );
  const reportQuery = kind === "customer" ? customerQuery : supplierQuery;
  const report = reportQuery.data;
  const { csvPending, downloadCsv } = useReportCsv();
  const path = kind === "customer" ? "/reports/customer-statement" : "/reports/supplier-statement";
  const filename = kind === "customer" ? "customer-statement" : "supplier-statement";
  const partyKey = kind === "customer" ? "customer_id" : "supplier_id";

  function setParty(value: string) {
    setParams({
      filters:
        kind === "customer"
          ? { customer_id: value === ALL ? null : value }
          : { supplier_id: value === ALL ? null : value },
    });
  }

  return (
    <ListPage>
      <PageHeader
        title={kind === "customer" ? "Customer statement" : "Supplier statement"}
        subtitle="Document-level running balance in org currency. Line metadata shows original document currency where applicable."
        actions={
          partyId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void downloadCsv(path, { [partyKey]: partyId, from, to }, filename);
              }}
              disabled={csvPending}
            >
              <Download className="size-4" />
              Download CSV
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <FilterSelect
          label={kind === "customer" ? "Customer" : "Supplier"}
          className="w-64"
          placeholder={kind === "customer" ? "Customer" : "Supplier"}
          value={partyId || ALL}
          onValueChange={setParty}
          options={[
            { value: ALL, label: kind === "customer" ? "Select customer" : "Select supplier" },
            ...parties.map((party) => ({ value: party.id, label: party.name })),
          ]}
        />
        <DateRangeFilter
          layout="inline"
          fromId="party-stmt-from"
          toId="party-stmt-to"
          from={from}
          to={to}
          onFromChange={(value) => setParams({ filters: { from: value || null } })}
          onToChange={(value) => setParams({ filters: { to: value || null } })}
        />
        {from || to || partyId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() =>
              setParams({
                filters: {
                  from: null,
                  to: null,
                  customer_id: null,
                  supplier_id: null,
                },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      {report ? (
        <p className="text-muted-foreground text-sm">
          {report.party_name}. Opening{" "}
          {formatReportMoney(report.opening_balance, report.currency_code)}. Closing{" "}
          {formatReportMoney(report.closing_balance, report.currency_code)}.
        </p>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Running</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!partyId ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title={kind === "customer" ? "Select a customer" : "Select a supplier"}
                  message="Choose a party to load the statement."
                />
              </TableCell>
            </TableRow>
          ) : reportQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={COLUMN_COUNT}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty title="No lines" message="No documents in this date range." />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => {
              const href = documentDetailHref(line.document_type, line.document_id);
              return (
                <TableRow key={`${line.document_type}-${line.document_id}-${line.document_date}`}>
                  <TableCell>{formatDate(line.document_date)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {href ? (
                      <RecordLink href={href}>{line.document_number}</RecordLink>
                    ) : (
                      line.document_number
                    )}
                  </TableCell>
                  <TableCell>{line.due_date ? formatDate(line.due_date) : "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{line.description ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatReportMoney(line.debit, report.currency_code)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatReportMoney(line.credit, report.currency_code)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatReportMoney(line.running_balance, report.currency_code)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
