"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { usePreviewPeriodLock, useUpdatePeriodLock } from "@/modules/erp/period-lock/mutations";
import { periodLockPermissions } from "@/modules/erp/period-lock/permissions";
import { usePeriodLock } from "@/modules/erp/period-lock/queries";
import {
  periodLockUnpostedHref,
  periodLockUnpostedLabel,
  type PeriodLock,
  type PeriodLockNegativeBalance,
  type PeriodLockPreview,
  type PeriodLockUnpostedDocument,
  type PeriodLockUpdate,
} from "@/modules/erp/period-lock/schemas";
import { getErrorMessage, isApiError } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { useIsClient } from "@/shared/hooks/use-is-client";
import { formatDate, formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const REASON_MIN_LENGTH = 10;

function normalizeDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function isRetreatOrClear(current: string | null, next: string | null): boolean {
  if (current && !next) {
    return true;
  }
  return Boolean(current && next && next < current);
}

function lockConsequence(
  current: PeriodLock,
  nextLock: string | null,
  nextHard: string | null,
): string {
  const parts: string[] = [];
  if (nextLock) {
    parts.push(
      `Transactions dated on or before ${formatDate(nextLock)} will be locked. Override can still post into the transaction lock.`,
    );
  } else if (current.lock_date) {
    parts.push(
      "The transaction lock will be cleared. Dated documents in that period can be posted again.",
    );
  }
  if (nextHard) {
    parts.push(
      `Books close on ${formatDate(nextHard)} cannot be posted through until unlocked with a reason.`,
    );
  } else if (current.hard_lock_date) {
    parts.push("Books close will be cleared.");
  }
  if (parts.length === 0) {
    return "Period lock dates will be updated.";
  }
  return parts.join(" ");
}

function NegativeBalanceList({
  balances,
  totalCount,
}: {
  balances: PeriodLockNegativeBalance[];
  totalCount: number;
}) {
  if (totalCount === 0) {
    return null;
  }
  const remaining = Math.max(0, totalCount - balances.length);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Current negative balances</p>
      <ul className="text-muted-foreground list-disc pl-5 text-sm">
        {balances.map((row) => (
          <li key={`${row.warehouse_id}-${row.product_id}`}>
            {row.warehouse_code} · {row.sku} · {formatDecimal(row.qty_on_hand)}
          </li>
        ))}
      </ul>
      {remaining > 0 ? <p className="text-muted-foreground text-sm">{remaining} more.</p> : null}
      <Link href="/stock?negative_only=true" className="text-sm font-medium underline">
        View negative stock
      </Link>
    </div>
  );
}

function UnpostedDocumentList({
  documents,
  totalCount,
}: {
  documents: PeriodLockUnpostedDocument[];
  totalCount: number;
}) {
  if (totalCount === 0) {
    return null;
  }
  const remaining = Math.max(0, totalCount - documents.length);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Unposted documents on or before the lock</p>
      <ul className="text-muted-foreground list-disc pl-5 text-sm">
        {documents.map((document) => (
          <li key={document.id}>
            <Link href={periodLockUnpostedHref(document)} className="font-medium underline">
              {periodLockUnpostedLabel(document)}
            </Link>
            {` · ${formatDate(document.document_date)}`}
          </li>
        ))}
      </ul>
      {remaining > 0 ? <p className="text-muted-foreground text-sm">{remaining} more.</p> : null}
    </div>
  );
}

function blockedBalancesFromError(error: unknown): PeriodLockNegativeBalance[] {
  if (!isApiError(error) || error.code !== "PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK") {
    return [];
  }
  if (!error.details || typeof error.details !== "object" || Array.isArray(error.details)) {
    return [];
  }
  const balances = (error.details as { balances?: unknown }).balances;
  if (!Array.isArray(balances)) {
    return [];
  }
  return balances.flatMap((row) => {
    if (!row || typeof row !== "object") {
      return [];
    }
    const record = row as Record<string, unknown>;
    if (
      typeof record.warehouse_id !== "string" ||
      typeof record.warehouse_code !== "string" ||
      typeof record.product_id !== "string" ||
      typeof record.sku !== "string" ||
      (typeof record.qty_on_hand !== "string" && typeof record.qty_on_hand !== "number")
    ) {
      return [];
    }
    return [
      {
        warehouse_id: record.warehouse_id,
        warehouse_code: record.warehouse_code,
        product_id: record.product_id,
        sku: record.sku,
        qty_on_hand: String(record.qty_on_hand),
      },
    ];
  });
}

export function TransactionLockCard() {
  const can = useCan();
  const isClient = useIsClient();
  const canLock = can(periodLockPermissions.lock);
  const lockQuery = usePeriodLock();
  const previewLock = usePreviewPeriodLock();
  const updateLock = useUpdatePeriodLock();
  const current = lockQuery.data;

  const [lockDateDraft, setLockDateDraft] = useState<string | null>(null);
  const [hardLockDateDraft, setHardLockDateDraft] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<PeriodLockPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockedPreview, setBlockedPreview] = useState<PeriodLockPreview | null>(null);
  const [blockedError, setBlockedError] = useState<unknown>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const lockDate = lockDateDraft ?? current?.lock_date ?? "";
  const hardLockDate = hardLockDateDraft ?? current?.hard_lock_date ?? "";

  const nextLock = normalizeDate(lockDate);
  const nextHard = normalizeDate(hardLockDate);
  const needsReason = Boolean(
    current &&
    (isRetreatOrClear(current.lock_date, nextLock) ||
      isRetreatOrClear(current.hard_lock_date, nextHard)),
  );
  const datesDirty = Boolean(
    current &&
    (nextLock !== (current.lock_date ?? null) || nextHard !== (current.hard_lock_date ?? null)),
  );
  const pending = previewLock.isPending || updateLock.isPending;

  const blockedBalances = useMemo(() => {
    if (blockedPreview) {
      return {
        balances: blockedPreview.negative_balances,
        totalCount: blockedPreview.negative_balances_total_count,
      };
    }
    if (blockedError) {
      const balances = blockedBalancesFromError(blockedError);
      const details =
        isApiError(blockedError) &&
        blockedError.details &&
        typeof blockedError.details === "object" &&
        !Array.isArray(blockedError.details)
          ? (blockedError.details as { total_count?: unknown })
          : null;
      const totalCount =
        typeof details?.total_count === "number" ? details.total_count : balances.length;
      return { balances, totalCount };
    }
    return { balances: [] as PeriodLockNegativeBalance[], totalCount: 0 };
  }, [blockedError, blockedPreview]);

  async function onSave() {
    if (!current || !datesDirty) {
      return;
    }
    setFormError(null);
    setBlockedPreview(null);
    setBlockedError(null);
    if (needsReason && reason.trim().length < REASON_MIN_LENGTH) {
      setFormError("Enter a reason of at least 10 characters to unlock or move the lock earlier.");
      return;
    }
    try {
      const previewData = await previewLock.mutateAsync({
        lock_date: nextLock,
        hard_lock_date: nextHard,
      });
      if (previewData.blocked) {
        setBlockedPreview(previewData);
        return;
      }
      setPreview(previewData);
      setConfirmOpen(true);
    } catch (error) {
      if (isApiError(error) && error.code === "PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK") {
        setBlockedError(error);
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  async function onConfirm() {
    if (!current || !preview) {
      return;
    }
    const payload: PeriodLockUpdate = {};
    if (nextLock !== (current.lock_date ?? null)) {
      payload.lock_date = nextLock;
    }
    if (nextHard !== (current.hard_lock_date ?? null)) {
      payload.hard_lock_date = nextHard;
    }
    if (needsReason || reason.trim()) {
      payload.reason = reason.trim();
    }
    if (preview.requires_acknowledgement) {
      payload.acknowledge_negative_stock = true;
    }
    try {
      await updateLock.mutateAsync(payload);
      setConfirmOpen(false);
      setPreview(null);
      setLockDateDraft(null);
      setHardLockDateDraft(null);
      setReason("");
      toast.success("Period lock updated");
    } catch (error) {
      setConfirmOpen(false);
      if (isApiError(error) && error.code === "PERIOD_LOCK_BLOCKED_NEGATIVE_STOCK") {
        setBlockedError(error);
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  if (!isClient || lockQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction lock</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (lockQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(lockQuery.error)}
        onRetry={() => lockQuery.refetch()}
      />
    );
  }

  const showBlocked = Boolean(blockedPreview || blockedError);

  return (
    <>
      <Card>
        <CardHeader className="items-center">
          <CardTitle className="text-base">Transaction lock</CardTitle>
          {canLock ? (
            <CardAction className="self-center">
              <Button
                type="button"
                size="sm"
                disabled={!datesDirty || pending}
                onClick={() => void onSave()}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save lock
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CardDescription>
            Override bypasses the transaction lock only. Books close is final until unlocked with a
            reason.
          </CardDescription>
          {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
          {showBlocked ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Cannot lock this period</AlertTitle>
              <AlertDescription>
                <p>
                  {blockedError
                    ? getErrorMessage(blockedError)
                    : "The period cannot be locked while stock is negative."}
                </p>
                <NegativeBalanceList
                  balances={blockedBalances.balances}
                  totalCount={blockedBalances.totalCount}
                />
              </AlertDescription>
            </Alert>
          ) : null}
          {canLock ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="transaction-lock-date">Transaction lock</Label>
                <Input
                  id="transaction-lock-date"
                  type="date"
                  value={lockDate}
                  onChange={(event) => setLockDateDraft(event.target.value)}
                />
                {current?.lock_reason ? (
                  <p className="text-muted-foreground text-xs">{current.lock_reason}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="books-close-date">Books close</Label>
                <Input
                  id="books-close-date"
                  type="date"
                  value={hardLockDate}
                  onChange={(event) => setHardLockDateDraft(event.target.value)}
                />
                {current?.hard_lock_reason ? (
                  <p className="text-muted-foreground text-xs">{current.hard_lock_reason}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="period-lock-reason">
                  {needsReason ? "Reason (required to unlock)" : "Reason"}
                </Label>
                <Textarea
                  id="period-lock-reason"
                  value={reason}
                  maxLength={500}
                  aria-required={needsReason}
                  placeholder={
                    needsReason
                      ? "Why this lock is being moved earlier or cleared"
                      : "Optional note stored with the lock"
                  }
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs font-medium">Transaction lock</p>
                <p className="text-sm">{formatDate(current?.lock_date)}</p>
                {current?.lock_reason ? (
                  <p className="text-muted-foreground text-xs">{current.lock_reason}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-xs font-medium">Books close</p>
                <p className="text-sm">{formatDate(current?.hard_lock_date)}</p>
                {current?.hard_lock_reason ? (
                  <p className="text-muted-foreground text-xs">{current.hard_lock_reason}</p>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={confirmOpen}
        title="Apply period lock"
        description={current ? lockConsequence(current, nextLock, nextHard) : ""}
        extra={
          preview ? (
            <div className="flex flex-col gap-3">
              {preview.requires_acknowledgement ? (
                <p className="text-sm">
                  Negative stock exists. Applying this lock confirms you accept the current negative
                  balances.
                </p>
              ) : null}
              <NegativeBalanceList
                balances={preview.negative_balances}
                totalCount={preview.negative_balances_total_count}
              />
              <UnpostedDocumentList
                documents={preview.unposted_documents}
                totalCount={preview.unposted_documents_total_count}
              />
            </div>
          ) : null
        }
        confirmLabel="Apply lock"
        pending={pending}
        variant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false);
            setPreview(null);
          }
        }}
        onConfirm={() => {
          void onConfirm();
        }}
      />
    </>
  );
}
