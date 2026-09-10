"use client";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useGeneralLedger } from "@/modules/erp/accounting/reports/queries";
import { sourceDocumentHref } from "@/modules/erp/accounting/reports/schemas";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { DataTable } from "@/shared/components/data-table/data-table";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const COLUMN_COUNT = 7;

export function GeneralLedgerScreen() {
  const can = useCan();
  const { filters, setParams } = useTableParams();
  const from = filters.from ?? "";
  const to = filters.to ?? "";
  const accountId = filters.account_id ?? "";
  const branchId = filters.branch_id;
  const accountsQuery = useAllAccounts({ is_group: false });
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const reportQuery = useGeneralLedger(
    accountId && from && to
      ? { account_id: accountId, from, to, branch_id: branchId }
      : null,
  );
  const accounts = (accountsQuery.data ?? []).filter((row) => !row.is_group);
  const branches = branchesQuery.data ?? [];
  const report = reportQuery.data;

  return (
    <ListPage>
      <PageHeader title="General ledger" subtitle="Running balance per posted line" />
      <DataTableToolbar>
        <FilterSelect
          className="w-64"
          placeholder="Account"
          aria-label="Account"
          value={accountId || ALL}
          onValueChange={(value) =>
            setParams({ filters: { account_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "Select account" },
            ...accounts.map((account) => ({
              value: account.id,
              label: `${account.code} — ${account.name}`,
            })),
          ]}
        />
        <DateRangeFilter
          layout="inline"
          fromId="gl-from"
          toId="gl-to"
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
        {from || to || accountId || branchId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() =>
              setParams({ filters: { from: null, to: null, account_id: null, branch_id: null } })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      {report ? (
        <p className="text-muted-foreground text-sm">
          {report.account_code} {report.account_name}. Opening {formatDecimal(report.opening_balance)}.
          Closing {formatDecimal(report.closing_balance)}.
        </p>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Journal</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Running</TableHead>
            <TableHead>Narration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!accountId || !from || !to ? (
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT}>
                <DataTableEmpty
                  title="Select an account and dates"
                  message="Choose a postable account and a date range."
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
                <DataTableEmpty title="No lines" message="No posted activity for this account." />
              </TableCell>
            </TableRow>
          ) : (
            report.lines.map((line) => (
              <TableRow key={line.journal_entry_line_id}>
                <TableCell>{formatDate(line.entry_date)}</TableCell>
                <TableCell>
                  <RecordLink href={`/journals/${line.journal_entry_id}`}>
                    {line.document_number}
                  </RecordLink>
                </TableCell>
                <TableCell>
                  {line.source_id ? (
                    <RecordLink
                      href={sourceDocumentHref(line.source_type, line.source_id, line.journal_entry_id)}
                    >
                      {line.source_type ?? "Journal"}
                    </RecordLink>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{formatDecimal(line.debit_base)}</TableCell>
                <TableCell>{formatDecimal(line.credit_base)}</TableCell>
                <TableCell>{formatDecimal(line.running_balance)}</TableCell>
                <TableCell>{line.narration ?? line.description ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
