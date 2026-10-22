"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/api/errors";
import {
  isConvertToMenuAction,
  type DocumentActionSpec,
  visibleActions,
} from "@/shared/components/document/workflow-registry";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { useCan } from "@/shared/providers/session-provider";

export type DocumentWorkflowExtras = {
  reason: string | null;
};

export function DocumentWorkflowButtons<TAction extends string>({
  availableActions,
  registry,
  documentKind,
  documentLabel,
  onAction,
  extra,
  disabledActions,
  onError,
}: {
  availableActions: readonly string[];
  registry: readonly DocumentActionSpec<TAction>[];
  documentKind: string;
  documentLabel: string;
  onAction: (action: TAction, extras: DocumentWorkflowExtras) => Promise<void>;
  extra?: ReactNode;
  disabledActions?: Partial<Record<TAction, boolean>>;
  onError?: (error: unknown) => boolean;
}) {
  const can = useCan();
  const reasonId = useId();
  const [confirming, setConfirming] = useState<DocumentActionSpec<TAction> | null>(null);
  const [running, setRunning] = useState<TAction | null>(null);
  const [reason, setReason] = useState("");

  const actions = visibleActions(availableActions, registry, can);
  const convertToActions = actions.filter((spec) => isConvertToMenuAction(spec.action, spec));
  const convertToKeys = new Set(convertToActions.map((spec) => spec.action));
  const primaryActions = actions.filter((spec) => !convertToKeys.has(spec.action));
  const pending = Boolean(running);
  const convertToPending = convertToActions.some((spec) => running === spec.action);

  const reasonRequired = Boolean(confirming?.reasonField?.required);
  const confirmDisabled = reasonRequired && !reason.trim();

  async function runAction(spec: DocumentActionSpec<TAction>) {
    const trimmed = reason.trim();
    if (spec.reasonField?.required && !trimmed) {
      return;
    }
    setRunning(spec.action);
    try {
      await onAction(spec.action, { reason: trimmed ? trimmed : null });
      setConfirming(null);
      setReason("");
    } catch (error) {
      if (!onError?.(error)) {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setRunning(null);
    }
  }

  function onClickAction(spec: DocumentActionSpec<TAction>) {
    if (spec.confirmCopy) {
      setConfirming(spec);
      return;
    }
    void runAction(spec);
  }

  const confirmTitle = confirming ? `${confirming.label} ${documentKind} ${documentLabel}` : "";

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        {extra}
        <div className="flex flex-wrap items-center gap-2">
          {convertToActions.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending || convertToPending}
                >
                  {convertToPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Convert to
                  <ChevronDown className="size-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {convertToActions.map((spec) => (
                  <DropdownMenuItem
                    key={spec.action}
                    disabled={pending || Boolean(disabledActions?.[spec.action])}
                    onSelect={() => onClickAction(spec)}
                  >
                    {spec.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {primaryActions.map((spec) => (
            <Button
              key={spec.action}
              type="button"
              size="sm"
              variant={spec.variant ?? "default"}
              disabled={pending || Boolean(disabledActions?.[spec.action])}
              onClick={() => onClickAction(spec)}
            >
              {running === spec.action ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {spec.label}
            </Button>
          ))}
        </div>
      </div>
      <ConfirmActionDialog
        open={Boolean(confirming)}
        title={confirmTitle}
        description={confirming?.confirmCopy?.(documentLabel) ?? ""}
        extra={
          confirming?.reasonField ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={reasonId}>
                {confirming.reasonField.label ?? "Reason (optional)"}
              </Label>
              {confirming.reasonField.options ? (
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id={reasonId}>
                    <SelectValue placeholder={confirming.reasonField.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {confirming.reasonField.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Textarea
                  id={reasonId}
                  value={reason}
                  maxLength={2000}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={confirming.reasonField.placeholder}
                />
              )}
            </div>
          ) : null
        }
        confirmLabel={
          confirming?.action === "cancel" ? "Confirm cancel" : (confirming?.label ?? "Confirm")
        }
        pending={pending}
        confirmDisabled={confirmDisabled}
        variant={confirming?.variant === "destructive" ? "destructive" : "default"}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
            setReason("");
          }
        }}
        onConfirm={() => {
          if (confirming) {
            void runAction(confirming);
          }
        }}
      />
    </>
  );
}
