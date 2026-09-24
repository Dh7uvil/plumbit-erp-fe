"use client";

import Link from "next/link";
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
import { DataTableError } from "@/shared/components/data-table/states";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, formatReportMoney, isZeroDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const STATUS_LABELS = {
  DRAFT: "Draft",
  IMPORTED: "Imported",
  RECONCILED: "Reconciled",
} as const;

const STATUS_VARIANTS = {
  DRAFT: "warning",
  IMPORTED: "info",
  RECONCILED: "success",
} as const;

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
  const [confirmReconcile, setConfirmReconcile] = useState(false);

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
      setConfirmReconcile(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (statementQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (statementQuery.isError || !statement) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={getErrorMessage(statementQuery.error)}
          onRetry={() => statementQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/bank-reconciliation">Back to bank reconciliation</Link>
        </Button>
      </div>
    );
  }

  const title = `${formatDate(statement.period_start)} — ${formatDate(statement.period_end)}`;

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle="Match imported statement lines to posted book entries."
        listHref="/bank-reconciliation"
        viewHref={`/bank-reconciliation/${id}`}
        canUpdate={false}
        mode="view"
        badges={
          <DocumentStatusBadge
            status={statement.status}
            labels={STATUS_LABELS}
            variants={STATUS_VARIANTS}
          />
        }
        extraActions={
          canReconcile && statement.status !== "RECONCILED" ? (
            <Button onClick={() => setConfirmReconcile(true)}>Mark reconciled</Button>
          ) : undefined
        }
      />
      {statement.base_opening_balance || statement.base_closing_balance ? (
        <p className="text-muted-foreground text-sm">
          {statement.base_opening_balance
            ? `Base opening ${formatReportMoney(statement.base_opening_balance)}`
            : null}
          {statement.base_opening_balance && statement.base_closing_balance ? " · " : null}
          {statement.base_closing_balance
            ? `Base closing ${formatReportMoney(statement.base_closing_balance)}`
            : null}
        </p>
      ) : null}
      {summaryQuery.data ? (
        <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-5">
          <div>
            <div className="text-muted-foreground text-sm">Statement balance</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatReportMoney(summaryQuery.data.statement_balance)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Book balance</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatReportMoney(summaryQuery.data.book_balance)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Unmatched statement</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatReportMoney(summaryQuery.data.unmatched_statement_total)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Unmatched book</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatReportMoney(summaryQuery.data.unmatched_book_total)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Reconciled balance</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatReportMoney(summaryQuery.data.reconciled_balance)}
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statement lines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedStatementLineId ? (
              <p className="text-muted-foreground px-4 pb-2 text-sm">
                Select a book entry to match the highlighted statement line.
              </p>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
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
                    <TableCell>{formatDate(line.line_date)}</TableCell>
                    <TableCell>{line.description ?? line.reference ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatReportMoney(lineAmount(line.debit, line.credit))}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge
                        status={line.match_status}
                        labels={{
                          UNMATCHED: "Unmatched",
                          MATCHED: "Matched",
                          EXCLUDED: "Excluded",
                        }}
                        variants={{
                          UNMATCHED: "warning",
                          MATCHED: "success",
                          EXCLUDED: "muted",
                        }}
                      />
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Book entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
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
                      <TableCell>{formatDate(entry.entry_date)}</TableCell>
                      <TableCell>{entry.reference ?? entry.document_number ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatReportMoney(lineAmount(entry.debit, entry.credit))}
                      </TableCell>
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
                          <DocumentStatusBadge
                            status="MATCHED"
                            labels={{ MATCHED: "Matched" }}
                            variants={{ MATCHED: "success" }}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <ConfirmActionDialog
        open={confirmReconcile}
        onOpenChange={setConfirmReconcile}
        title="Mark statement reconciled"
        description="This closes the reconciliation period. Unmatched lines will remain visible but the statement will be marked reconciled."
        confirmLabel="Mark reconciled"
        variant="default"
        pending={reconcile.isPending}
        onConfirm={() => void closeReconciliation()}
      />
    </div>
  );
}
