"use client";

import {
  CHEQUE_STATUS_LABELS,
  CHEQUE_STATUS_VARIANTS,
} from "@/modules/erp/accounting/cheques/components/cheque-columns";
import { useAllBankAccounts } from "@/modules/erp/accounting/bank-accounts/queries";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { usePdcRegister } from "@/modules/erp/accounting/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatReportMoney, humanizeEnum } from "@/shared/lib/format";

const ALL = "all";
const COLUMN_COUNT = 9;

export function PdcRegisterScreen() {
  const { filters, setParams } = useTableParams();
  const dueFrom = filters.due_from;
  const dueTo = filters.due_to;
  const params = {
    due_date_from: dueFrom || undefined,
    due_date_to: dueTo || undefined,
    direction: filters.direction || undefined,
    status: filters.status || undefined,
    bank_account_id: filters.bank_account_id || undefined,
  };
  const reportQuery = usePdcRegister(params);
  const bankAccountsQuery = useAllBankAccounts();
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  return (
    <ReportShell
      title="PDC register"
      subtitle="Uncleared post-dated cheques by due date, direction, and bank account."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/pdc-register", params, "pdc-register");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/pdc-register", params, "pdc-register");
      }}
      toolbar={
        <div className="flex flex-wrap items-end gap-3">
          <DateRangeFilter
            layout="inline"
            fromId="pdc-due-from"
            toId="pdc-due-to"
            from={dueFrom ?? ""}
            to={dueTo ?? ""}
            fromLabel="Due from"
            toLabel="Due to"
            onFromChange={(value) =>
              setParams({ filters: { due_from: value || null } })
            }
            onToChange={(value) => setParams({ filters: { due_to: value || null } })}
          />
          <FilterSelect
            label="Direction"
            className="w-44"
            placeholder="Direction"
            value={filters.direction ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { direction: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All directions" },
              { value: "INBOUND", label: "Inbound" },
              { value: "OUTBOUND", label: "Outbound" },
            ]}
          />
          <FilterSelect
            label="Status"
            className="w-44"
            placeholder="Status"
            value={filters.status ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { status: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All statuses" },
              ...Object.entries(CHEQUE_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <FilterSelect
            label="Bank account"
            className="w-56"
            placeholder="Bank account"
            value={filters.bank_account_id ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { bank_account_id: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All bank accounts" },
              ...(bankAccountsQuery.data ?? []).map((account) => ({
                value: account.id,
                label: `${account.bank_name} — ${account.account_name}`,
              })),
            ]}
          />
        </div>
      }
    >
      {report ? (
        <div className="text-muted-foreground mb-3 flex flex-wrap gap-4 text-sm">
          <span>Inbound: {money(report.total_inbound)}</span>
          <span>Outbound: {money(report.total_outbound)}</span>
        </div>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Cheque</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cheque date</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
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
                <DataTableEmpty title="No cheques" message="No PDC lines match these filters." />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => (
              <TableRow key={line.cheque_id}>
                <TableCell>
                  <RecordLink href={`/cheques/${line.cheque_id}`}>{line.cheque_number}</RecordLink>
                </TableCell>
                <TableCell>{line.document_number}</TableCell>
                <TableCell>{humanizeEnum(line.direction)}</TableCell>
                <TableCell>
                  <DocumentStatusBadge
                    status={line.status}
                    labels={CHEQUE_STATUS_LABELS}
                    variants={CHEQUE_STATUS_VARIANTS}
                  />
                </TableCell>
                <TableCell>{formatDate(line.cheque_date)}</TableCell>
                <TableCell>{formatDate(line.due_date ?? line.cheque_date)}</TableCell>
                <TableCell>{line.party_name ?? "—"}</TableCell>
                <TableCell>{line.bank_name ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{money(line.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
