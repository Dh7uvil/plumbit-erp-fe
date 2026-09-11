"use client";

import { AlertCircle } from "lucide-react";
import { useId, useState } from "react";

import { creditControlPermissions } from "@/modules/erp/credit-control/permissions";
import { getErrorMessage, isApiError } from "@/shared/api/errors";
import type { DocumentWarning } from "@/shared/components/document/schemas";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCan } from "@/shared/providers/session-provider";

function warningDetails(warning: DocumentWarning): string | null {
  const details = warning.details ?? {};
  const parts = ["limit", "exposure", "this_document", "available"]
    .map((key) => {
      const value = details[key];
      if (typeof value !== "string" || !value.trim()) {
        return null;
      }
      const label = key === "this_document" ? "This document" : key.replace(/_/g, " ");
      return `${label} ${value.trim()}`;
    })
    .filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(". ") : null;
}

export function CreditLimitBanner({
  warnings = [],
  blockError,
  onOverride,
  overridePending = false,
}: {
  warnings?: readonly DocumentWarning[];
  blockError?: unknown;
  onOverride?: (reason: string) => Promise<void>;
  overridePending?: boolean;
}) {
  const can = useCan();
  const reasonId = useId();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [reason, setReason] = useState("");
  const creditWarnings = warnings.filter((warning) => warning.code === "CREDIT_LIMIT_EXCEEDED");
  const blocked = isApiError(blockError) && blockError.code === "CREDIT_LIMIT_EXCEEDED";
  const canOverride = Boolean(onOverride) && can(creditControlPermissions.override);

  if (creditWarnings.length === 0 && !blocked) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {creditWarnings.map((warning, index) => (
        <Alert key={`${warning.code}-${index}`}>
          <AlertCircle />
          <AlertTitle>Credit limit warning</AlertTitle>
          <AlertDescription>
            {warning.message}
            {warningDetails(warning) ? `. ${warningDetails(warning)}.` : ""}
          </AlertDescription>
        </Alert>
      ))}
      {blocked ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Credit limit exceeded</AlertTitle>
          <AlertDescription>
            <p>{getErrorMessage(blockError)}</p>
            {canOverride ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setOverrideOpen(true)}
              >
                Override credit limit
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <ConfirmActionDialog
        open={overrideOpen}
        title="Override credit limit"
        description="The document stays a draft until this override is sent with a reason. The reason is audited."
        extra={
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={reasonId}>Reason</Label>
            <Textarea
              id={reasonId}
              value={reason}
              maxLength={2000}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why this order or invoice should proceed"
            />
          </div>
        }
        confirmLabel="Override and continue"
        pending={overridePending}
        confirmDisabled={!reason.trim()}
        variant="destructive"
        onOpenChange={(open) => {
          if (!open) {
            setOverrideOpen(false);
            setReason("");
          }
        }}
        onConfirm={() => {
          if (!onOverride || !reason.trim()) {
            return;
          }
          void onOverride(reason.trim()).then(() => {
            setOverrideOpen(false);
            setReason("");
          });
        }}
      />
    </div>
  );
}
