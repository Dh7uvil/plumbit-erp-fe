"use client";

import { StatementReportFilters } from "@/modules/erp/accounting/reports/components/statement-report-filters";
import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useProfitAndLoss } from "@/modules/erp/accounting/reports/queries";
import { glHref, type ProfitAndLossLine } from "@/modules/erp/accounting/reports/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
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
import { formatReportMoney } from "@/shared/lib/format";

function SectionHeader({
  label,
  columnCount,
}: {
  label: string;
  columnCount: number;
}) {
  return (
    <TableRow>
      <TableCell colSpan={columnCount} className="bg-muted/40 font-medium">
        {label}
      </TableCell>
    </TableRow>
  );
}

function LineRow({
  line,
  from,
  to,
  branchId,
  costCenterId,
  money,
  showComparative,
  showYtd,
}: {
  line: ProfitAndLossLine;
  from: string;
  to: string;
  branchId?: string;
  costCenterId?: string;
  money: (value: string | null | undefined) => string;
  showComparative: boolean;
  showYtd: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">
        <RecordLink href={glHref(line.account_id, from, to, branchId, costCenterId)}>
          {line.account_code}
        </RecordLink>
      </TableCell>
      <TableCell>
        <RecordLink href={glHref(line.account_id, from, to, branchId, costCenterId)}>
          {line.account_name}
        </RecordLink>
      </TableCell>
      <TableCell>{line.account_subtype || line.account_type}</TableCell>
      <TableCell>{money(line.amount)}</TableCell>
      {showComparative ? (
        <TableCell>{line.comparative_amount ? money(line.comparative_amount) : "—"}</TableCell>
      ) : null}
      {showYtd ? <TableCell>{line.ytd_amount ? money(line.ytd_amount) : "—"}</TableCell> : null}
    </TableRow>
  );
}

export function ProfitAndLossScreen() {
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const includeYtd = filters.include_ytd === "true";
  const branchId = filters.branch_id;
  const costCenterId = filters.cost_center_id;
  const params = {
    from,
    to,
    branch_id: branchId,
    cost_center_id: costCenterId,
    include_ytd: includeYtd,
  };
  const reportQuery = useProfitAndLoss(params);
  const report = reportQuery.data;
  const { csvPending, excelPending, downloadCsv, downloadExcel } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);
  const showComparative = Boolean(report?.comparative_from);
  const showYtd = Boolean(report?.ytd_from);
  const columnCount = 4 + Number(showComparative) + Number(showYtd);
  const incomeLines = (report?.lines ?? []).filter((line) => line.account_type === "INCOME");
  const cogsLines = (report?.lines ?? []).filter((line) => line.account_subtype === "COGS");
  const expenseLines = (report?.lines ?? []).filter(
    (line) => line.account_type === "EXPENSE" && line.account_subtype !== "COGS",
  );

  return (
    <ReportShell
      title="Profit and loss"
      subtitle="Posted income and expense for the selected period. Totals come from the server."
      csvPending={csvPending}
      excelPending={excelPending}
      onDownloadCsv={() => {
        void downloadCsv("/reports/profit-and-loss", params, "profit-and-loss");
      }}
      onDownloadExcel={() => {
        void downloadExcel("/reports/profit-and-loss", params, "profit-and-loss");
      }}
      toolbar={
        <StatementReportFilters
          from={from}
          to={to}
          branchId={branchId}
          costCenterId={costCenterId}
          showCostCenterFilter
          includeYtd={includeYtd}
          onChange={(patch) => setParams({ filters: patch })}
        />
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            {showComparative ? (
              <TableHead>
                {report?.comparative_from && report?.comparative_to
                  ? `Prior period (${report.comparative_from} – ${report.comparative_to})`
                  : "Prior period"}
              </TableHead>
            ) : null}
            {showYtd ? <TableHead>YTD</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={columnCount}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : reportQuery.isError ? (
            <TableRow>
              <TableCell colSpan={columnCount}>
                <DataTableError
                  message={getErrorMessage(reportQuery.error)}
                  onRetry={() => reportQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : !report || report.lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount}>
                <DataTableEmpty
                  title="No activity"
                  message="No posted income or expense in this range."
                />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {incomeLines.length > 0 ? <SectionHeader label="Income" columnCount={columnCount} /> : null}
              {incomeLines.map((line) => (
                <LineRow
                  key={line.account_id}
                  line={line}
                  from={from}
                  to={to}
                  branchId={branchId}
                  costCenterId={costCenterId}
                  money={money}
                  showComparative={showComparative}
                  showYtd={showYtd}
                />
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total income
                </TableCell>
                <TableCell className="font-medium">{money(report.total_income)}</TableCell>
                {showComparative ? <TableCell /> : null}
                {showYtd ? <TableCell /> : null}
              </TableRow>
              {cogsLines.length > 0 ? (
                <SectionHeader label="Cost of goods sold" columnCount={columnCount} />
              ) : null}
              {cogsLines.map((line) => (
                <LineRow
                  key={line.account_id}
                  line={line}
                  from={from}
                  to={to}
                  branchId={branchId}
                  costCenterId={costCenterId}
                  money={money}
                  showComparative={showComparative}
                  showYtd={showYtd}
                />
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Cost of goods sold
                </TableCell>
                <TableCell className="font-medium">{money(report.total_cogs)}</TableCell>
                {showComparative ? <TableCell /> : null}
                {showYtd ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Gross profit
                </TableCell>
                <TableCell className="font-medium">{money(report.gross_profit)}</TableCell>
                {showComparative ? (
                  <TableCell className="font-medium">
                    {report.comparative_gross_profit ? money(report.comparative_gross_profit) : "—"}
                  </TableCell>
                ) : null}
                {showYtd ? (
                  <TableCell className="font-medium">
                    {report.ytd_gross_profit ? money(report.ytd_gross_profit) : "—"}
                  </TableCell>
                ) : null}
              </TableRow>
              {expenseLines.length > 0 ? (
                <SectionHeader label="Operating expenses" columnCount={columnCount} />
              ) : null}
              {expenseLines.map((line) => (
                <LineRow
                  key={line.account_id}
                  line={line}
                  from={from}
                  to={to}
                  branchId={branchId}
                  costCenterId={costCenterId}
                  money={money}
                  showComparative={showComparative}
                  showYtd={showYtd}
                />
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Operating expenses
                </TableCell>
                <TableCell className="font-medium">
                  {money(report.total_operating_expense)}
                </TableCell>
                {showComparative ? <TableCell /> : null}
                {showYtd ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Total expense
                </TableCell>
                <TableCell className="font-medium">{money(report.total_expense)}</TableCell>
                {showComparative ? <TableCell /> : null}
                {showYtd ? <TableCell /> : null}
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Net profit
                </TableCell>
                <TableCell className="font-medium">{money(report.net_profit)}</TableCell>
                {showComparative ? (
                  <TableCell className="font-medium">
                    {report.comparative_net_profit ? money(report.comparative_net_profit) : "—"}
                  </TableCell>
                ) : null}
                {showYtd ? (
                  <TableCell className="font-medium">
                    {report.ytd_net_profit ? money(report.ytd_net_profit) : "—"}
                  </TableCell>
                ) : null}
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
