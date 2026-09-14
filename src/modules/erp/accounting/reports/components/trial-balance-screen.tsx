"use client";

import { useRouter } from "next/navigation";

import { useReportCsv } from "@/modules/erp/accounting/reports/hooks/use-report-csv";
import { useReportPeriod } from "@/modules/erp/accounting/reports/hooks/use-report-period";
import { useTrialBalance } from "@/modules/erp/accounting/reports/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ReportShell } from "@/shared/components/report/report-shell";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const COLUMN_COUNT = 8;

export function TrialBalanceScreen() {
  const router = useRouter();
  const can = useCan();
  const { filters, setParams } = useTableParams();
  const period = useReportPeriod();
  const from = filters.from ?? period.from;
  const to = filters.to ?? period.to;
  const includeZero = filters.include_zero === "true";
  const branchId = filters.branch_id;
  const reportQuery = useTrialBalance({ from, to, branch_id: branchId, include_zero: includeZero });
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const report = reportQuery.data;
  const branches = branchesQuery.data ?? [];
  const { csvPending, downloadCsv } = useReportCsv();
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, report?.currency_code);

  function openGeneralLedger(accountId: string) {
    const params = new URLSearchParams({
      account_id: accountId,
      from,
      to,
    });
    if (branchId) {
      params.set("branch_id", branchId);
    }
    router.push(`/reports/general-ledger?${params.toString()}`);
  }

  return (
    <ReportShell
      title="Trial balance"
      subtitle="Opening, period movements, and netted closing balances in base currency"
      isBalanced={report?.is_balanced}
      csvPending={csvPending}
      onDownloadCsv={() => {
        void downloadCsv(
          "/reports/trial-balance",
          { from, to, branch_id: branchId, include_zero: includeZero },
          "trial-balance",
        );
      }}
      toolbar={
        <>
          <DateRangeFilter
            layout="inline"
            fromId="tb-from"
            toId="tb-to"
            from={from}
            to={to}
            onFromChange={(value) => setParams({ filters: { from: value || null } })}
            onToChange={(value) => setParams({ filters: { to: value || null } })}
          />
          <FilterSelect
            className="w-44"
            label="Branch"
            placeholder="All branches"
            aria-label="Filter by branch"
            value={branchId ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { branch_id: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All branches" },
              ...branches.map((branch) => ({
                value: branch.id,
                label: `${branch.code} — ${branch.name}`,
              })),
            ]}
          />
          <div className="flex h-9 items-center gap-2">
            <Checkbox
              id="tb-zero"
              checked={includeZero}
              onCheckedChange={(checked) =>
                setParams({ filters: { include_zero: checked === true ? "true" : null } })
              }
            />
            <Label htmlFor="tb-zero">Include zeros</Label>
          </div>
          {from || to || branchId || includeZero ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() =>
                setParams({ filters: { from: null, to: null, branch_id: null, include_zero: null } })
              }
            >
              Clear
            </Button>
          ) : null}
        </>
      }
    >
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Opening Dr</TableHead>
            <TableHead>Opening Cr</TableHead>
            <TableHead>Period Dr</TableHead>
            <TableHead>Period Cr</TableHead>
            <TableHead>Closing Dr</TableHead>
            <TableHead>Closing Cr</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportQuery.isLoading ? (
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
                <DataTableEmpty title="No balances" message="No posted activity in this range." />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {report.lines.map((line) => (
                <TableRow
                  key={line.account_id}
                  className={line.is_group ? undefined : "cursor-pointer"}
                  tabIndex={line.is_group ? undefined : 0}
                  onClick={() => {
                    if (!line.is_group) {
                      openGeneralLedger(line.account_id);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (line.is_group) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openGeneralLedger(line.account_id);
                    }
                  }}
                >
                  <TableCell className="font-mono text-sm">{line.account_code}</TableCell>
                  <TableCell>{line.account_name}</TableCell>
                  <TableCell>{money(line.opening_debit)}</TableCell>
                  <TableCell>{money(line.opening_credit)}</TableCell>
                  <TableCell>{money(line.period_debit)}</TableCell>
                  <TableCell>{money(line.period_credit)}</TableCell>
                  <TableCell>{money(line.closing_net_debit ?? line.closing_debit)}</TableCell>
                  <TableCell>{money(line.closing_net_credit ?? line.closing_credit)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Totals
                </TableCell>
                <TableCell className="font-medium">{money(report.total_opening_debit)}</TableCell>
                <TableCell className="font-medium">{money(report.total_opening_credit)}</TableCell>
                <TableCell className="font-medium">{money(report.total_period_debit)}</TableCell>
                <TableCell className="font-medium">{money(report.total_period_credit)}</TableCell>
                <TableCell className="font-medium">
                  {money(report.total_closing_net_debit ?? report.total_closing_debit)}
                </TableCell>
                <TableCell className="font-medium">
                  {money(report.total_closing_net_credit ?? report.total_closing_credit)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ReportShell>
  );
}
