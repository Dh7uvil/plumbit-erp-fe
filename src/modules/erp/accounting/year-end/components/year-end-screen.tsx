"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useCommitYearEnd,
  usePreviewYearEnd,
  useReopenYearEnd,
} from "@/modules/erp/accounting/year-end/mutations";
import { useYearEndState } from "@/modules/erp/accounting/year-end/queries";
import type { YearEndPreview } from "@/modules/erp/accounting/year-end/schemas";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDate, formatReportMoney } from "@/shared/lib/format";

function defaultFiscalYear(): number {
  return new Date().getFullYear();
}

export function YearEndScreen() {
  const tenantQuery = useCurrentTenant();
  const [fiscalYearInput, setFiscalYearInput] = useState(String(defaultFiscalYear()));
  const fiscalYear = useMemo(() => {
    const parsed = Number.parseInt(fiscalYearInput, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [fiscalYearInput]);
  const stateQuery = useYearEndState(fiscalYear);
  const previewMutation = usePreviewYearEnd();
  const commitMutation = useCommitYearEnd();
  const reopenMutation = useReopenYearEnd();
  const [preview, setPreview] = useState<YearEndPreview | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmCommit, setConfirmCommit] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);

  async function runPreview() {
    if (!fiscalYear) {
      return;
    }
    setFormError(null);
    try {
      const result = await previewMutation.mutateAsync(fiscalYear);
      setPreview(result);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function onCommit() {
    if (!fiscalYear) {
      return;
    }
    setFormError(null);
    try {
      await commitMutation.mutateAsync(fiscalYear);
      toast.success("Year-end closing committed");
      setConfirmCommit(false);
      setPreview(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setConfirmCommit(false);
    }
  }

  async function onReopen() {
    if (!fiscalYear) {
      return;
    }
    setFormError(null);
    try {
      await reopenMutation.mutateAsync(fiscalYear);
      toast.success("Year-end closing reversed");
      setConfirmReopen(false);
      setPreview(null);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setConfirmReopen(false);
    }
  }

  const state = stateQuery.data;
  const pending =
    previewMutation.isPending || commitMutation.isPending || reopenMutation.isPending;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Year-end closing"
        subtitle="Close P&amp;L into retained earnings and advance the books lock date."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fiscal year</CardTitle>
        </CardHeader>
        <CardContent
          data-slot="form-grid"
          className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2"
        >
          <div>
            <p className="text-muted-foreground text-xs font-medium">Organization fiscal start</p>
            <p className="text-sm">
              {tenantQuery.data
                ? `${tenantQuery.data.fiscal_year_start_month}/${tenantQuery.data.fiscal_year_start_day}`
                : "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="fiscal-year">
              Fiscal year to close
            </label>
            <Input
              id="fiscal-year"
              type="number"
              min={1900}
              max={9999}
              value={fiscalYearInput}
              onChange={(event) => setFiscalYearInput(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
      {stateQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : stateQuery.isError ? (
        <DataTableError
          message={getErrorMessage(stateQuery.error)}
          onRetry={() => stateQuery.refetch()}
        />
      ) : state ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {state.is_closed ? "Closed year" : "Open year"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm">
              Period {formatDate(state.from_date)} to {formatDate(state.to_date)}.
            </p>
            {state.is_closed ? (
              <>
                <p className="text-sm">
                  Journal{" "}
                  {state.journal_entry_id ? (
                    <Link
                      href={`/journals/${state.journal_entry_id}`}
                      className="cursor-pointer hover:underline"
                    >
                      {state.document_number ?? "Year-end journal"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="text-sm">
                  Committed {state.committed_at ? formatDate(state.committed_at) : "—"}
                </p>
                <p className="text-sm">
                  Lock date {state.lock_date ? formatDate(state.lock_date) : "—"}
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  className="self-start"
                  disabled={pending}
                  onClick={() => setConfirmReopen(true)}
                >
                  Reopen year-end
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertDescription>
                    Preview the closing journal, then commit to zero income and expense accounts
                    into retained earnings and set the lock date to the fiscal year end.
                  </AlertDescription>
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={pending} onClick={() => void runPreview()}>
                    {previewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Preview closing
                  </Button>
                  <Button
                    type="button"
                    disabled={!preview || pending}
                    onClick={() => setConfirmCommit(true)}
                  >
                    {commitMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Commit year-end
                  </Button>
                </div>
                {preview ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <p>
                      Entry date {formatDate(preview.entry_date)}. Net profit{" "}
                      {formatReportMoney(preview.net_profit)}.
                    </p>
                    <p>
                      Totals debit {formatReportMoney(preview.total_debit)} / credit{" "}
                      {formatReportMoney(preview.total_credit)}.
                    </p>
                    <ul className="flex flex-col gap-1">
                      {preview.lines.map((line, index) => (
                        <li key={`${line.account_id}-${index}`}>
                          {line.account_code} {line.account_name}: Dr{" "}
                          {formatReportMoney(line.closing_debit)} / Cr{" "}
                          {formatReportMoney(line.closing_credit)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
      <ConfirmActionDialog
        open={confirmCommit}
        title="Commit year-end closing"
        description="This posts a system journal that closes income and expense into retained earnings and advances the lock date."
        confirmLabel="Commit"
        pending={commitMutation.isPending}
        onOpenChange={setConfirmCommit}
        onConfirm={() => void onCommit()}
      />
      <ConfirmActionDialog
        open={confirmReopen}
        title="Reopen year-end closing"
        description="This reverses the year-end journal and rolls back the lock date. Only use when no later activity depends on the close."
        confirmLabel="Reopen"
        variant="destructive"
        pending={reopenMutation.isPending}
        onOpenChange={setConfirmReopen}
        onConfirm={() => void onReopen()}
      />
    </div>
  );
}
