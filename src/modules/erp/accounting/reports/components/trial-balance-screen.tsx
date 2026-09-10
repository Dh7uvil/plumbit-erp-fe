"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { useTrialBalance } from "@/modules/erp/accounting/reports/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const COLUMN_COUNT = 8;

export function TrialBalanceScreen() {
  const router = useRouter();
  const can = useCan();
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const includeZero = filters.include_zero === "true";
  const branchId = filters.branch_id;
  const reportQuery = useTrialBalance(from && to ? { from, to, branch_id: branchId, include_zero: includeZero } : null);
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const report = reportQuery.data;
  const branches = branchesQuery.data ?? [];

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
    <ListPage>
      <PageHeader title="Trial balance" subtitle="Opening, period, and closing balances in base currency" />
      <DataTableToolbar>
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
          placeholder="Branch"
          aria-label="Filter by branch"
          value={branchId ?? ALL}
          onValueChange={(value) => setParams({ filters: { branch_id: value === ALL ? null : value } })}
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
      </DataTableToolbar>
      {report && !report.is_balanced ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            This trial balance does not balance. Totals come from the server — do not post until
            the ledger is investigated.
          </AlertDescription>
        </Alert>
      ) : null}
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
          {!from || !to ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="Select a date range"
                  message="Choose from and to dates to load the trial balance."
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
                  <TableCell>{formatDecimal(line.opening_debit)}</TableCell>
                  <TableCell>{formatDecimal(line.opening_credit)}</TableCell>
                  <TableCell>{formatDecimal(line.period_debit)}</TableCell>
                  <TableCell>{formatDecimal(line.period_credit)}</TableCell>
                  <TableCell>{formatDecimal(line.closing_debit)}</TableCell>
                  <TableCell>{formatDecimal(line.closing_credit)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Totals
                </TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_opening_debit)}</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_opening_credit)}</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_period_debit)}</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_period_credit)}</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_closing_debit)}</TableCell>
                <TableCell className="font-medium">{formatDecimal(report.total_closing_credit)}</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
