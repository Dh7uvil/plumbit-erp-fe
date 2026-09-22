"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  useExcludeStatementLine,
  useMatchStatementLine,
  useReconcileBankStatement,
  useUnmatchStatementLine,
} from "@/modules/erp/accounting/bank-reconciliation/mutations";
import { bankReconciliationPermissions } from "@/modules/erp/accounting/bank-reconciliation/permissions";
import {
  useBankStatement,
  useBookEntries,
  useMatchSuggestions,
  useReconciliationSummary,
} from "@/modules/erp/accounting/bank-reconciliation/queries";
import { getErrorMessage } from "@/shared/api/errors";
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
import { isZeroDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function lineAmount(debit: string, credit: string): string {
  return !isZeroDecimal(debit) ? debit : credit;
}

export function BankReconciliationDetailScreen({ id }: { id: string }) {
  const can = useCan();
  const canReconcile = can(bankReconciliationPermissions.reconcile);
  const statementQuery = useBankStatement(id);
  const bookQuery = useBookEntries(id);
  const suggestionsQuery = useMatchSuggestions(id);
  const summaryQuery = useReconciliationSummary(id);
  const matchLine = useMatchStatementLine();
  const unmatchLine = useUnmatchStatementLine();
  const excludeLine = useExcludeStatementLine();
  const reconcile = useReconcileBankStatement();
  const statement = statementQuery.data;
  const suggestions = suggestionsQuery.data ?? [];
  const [selectedStatementLineId, setSelectedStatementLineId] = useState<string | null>(null);

  async function applyMatch(statementLineId: string, journalLineId: string) {
    if (!statement) return;
    try {
      await matchLine.mutateAsync({
        id,
        payload: {
          statement_line_id: statementLineId,
          journal_line_id: journalLineId,
          version: statement.version,
        },
      });
      toast.success("Line matched");
      setSelectedStatementLineId(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function applySuggestion(statementLineId: string, journalLineId: string) {
    await applyMatch(statementLineId, journalLineId);
  }

  async function unmatch(statementLineId: string) {
    if (!statement) return;
    try {
      await unmatchLine.mutateAsync({
        id,
        payload: { statement_line_id: statementLineId, version: statement.version },
      });
      toast.success("Line unmatched");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function exclude(statementLineId: string) {
    if (!statement) return;
    try {
      await excludeLine.mutateAsync({
        id,
        payload: { statement_line_id: statementLineId, version: statement.version },
      });
      toast.success("Line excluded");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function closeReconciliation() {
    if (!statement) return;
    try {
      await reconcile.mutateAsync({ id, version: statement.version });
      toast.success("Statement reconciled");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (statementQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!statement) {
    return null;
  }

  return (
    <ListPage>
      <PageHeader
        title={`Reconciliation ${statement.period_start} — ${statement.period_end}`}
        subtitle="Match imported statement lines to posted book entries."
        actions={
          canReconcile ? (
            <Button onClick={closeReconciliation} disabled={statement.status === "RECONCILED"}>
              Mark reconciled
            </Button>
          ) : undefined
        }
      />
      {summaryQuery.data ? (
        <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-5">
          <div>
            <div className="text-muted-foreground text-sm">Statement balance</div>
            <div className="text-lg font-semibold">{summaryQuery.data.statement_balance}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Book balance</div>
            <div className="text-lg font-semibold">{summaryQuery.data.book_balance}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Unmatched statement</div>
            <div className="text-lg font-semibold">
              {summaryQuery.data.unmatched_statement_total}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Unmatched book</div>
            <div className="text-lg font-semibold">{summaryQuery.data.unmatched_book_total}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Reconciled balance</div>
            <div className="text-lg font-semibold">{summaryQuery.data.reconciled_balance}</div>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Statement lines</h2>
          {selectedStatementLineId ? (
            <p className="text-muted-foreground mb-2 text-sm">
              Select a book entry to match the highlighted statement line.
            </p>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.lines.map((line) => (
                <TableRow
                  key={line.id}
                  className={
                    selectedStatementLineId === line.id
                      ? "bg-muted/50"
                      : canReconcile &&
                          statement.status !== "RECONCILED" &&
                          line.match_status === "UNMATCHED"
                        ? "cursor-pointer"
                        : undefined
                  }
                  onClick={() =>
                    canReconcile &&
                    statement.status !== "RECONCILED" &&
                    line.match_status === "UNMATCHED"
                      ? setSelectedStatementLineId(line.id)
                      : undefined
                  }
                >
                  <TableCell>{line.line_date}</TableCell>
                  <TableCell>{line.description ?? line.reference ?? "—"}</TableCell>
                  <TableCell>{lineAmount(line.debit, line.credit)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{line.match_status}</Badge>
                  </TableCell>
                  <TableCell>
                    {canReconcile && statement.status !== "RECONCILED" ? (
                      <div className="flex gap-1">
                        {line.match_status === "UNMATCHED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              void exclude(line.id);
                            }}
                          >
                            Exclude
                          </Button>
                        ) : null}
                        {line.match_status === "MATCHED" || line.match_status === "EXCLUDED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              void unmatch(line.id);
                            }}
                          >
                            Undo
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Book entries</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookQuery.data ?? []).map((entry) => {
                const suggestion = suggestions.find(
                  (item) => item.journal_line_id === entry.journal_line_id,
                );
                return (
                  <TableRow key={entry.journal_line_id}>
                    <TableCell>{entry.entry_date}</TableCell>
                    <TableCell>{entry.reference ?? entry.document_number ?? "—"}</TableCell>
                    <TableCell>{lineAmount(entry.debit, entry.credit)}</TableCell>
                    <TableCell>
                      {canReconcile && !entry.is_matched ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (selectedStatementLineId) {
                              void applyMatch(selectedStatementLineId, entry.journal_line_id);
                              return;
                            }
                            if (suggestion) {
                              void applySuggestion(
                                suggestion.statement_line_id,
                                entry.journal_line_id,
                              );
                            }
                          }}
                          disabled={!selectedStatementLineId && !suggestion}
                        >
                          Match
                        </Button>
                      ) : entry.is_matched ? (
                        <Badge variant="secondary">Matched</Badge>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </ListPage>
  );
}
