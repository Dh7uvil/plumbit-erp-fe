"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useChangeOpportunityStage } from "@/modules/crm/opportunities/mutations";
import type { Opportunity } from "@/modules/crm/opportunities/schemas";
import type { PipelineStage } from "@/modules/crm/pipelines/schemas";
import { useAllLostReasons } from "@/modules/crm/lost-reasons/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { formatMoney } from "@/shared/lib/format";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type PendingDrop = {
  opportunity: Opportunity;
  stage: PipelineStage;
};

export function OpportunityBoard({
  stages,
  opportunities,
}: {
  stages: PipelineStage[];
  opportunities: Opportunity[];
}) {
  const changeStage = useChangeOpportunityStage();
  const lostReasonsQuery = useAllLostReasons(true);
  const currenciesQuery = useAllCurrencies();
  const currencyCodeById = useMemo(
    () => new Map((currenciesQuery.data ?? []).map((currency) => [currency.id, currency.code])),
    [currenciesQuery.data],
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [lostReasonId, setLostReasonId] = useState("");

  const byStage = useMemo(() => {
    const map = new Map<string, Opportunity[]>();
    for (const stage of stages) {
      map.set(stage.id, []);
    }
    for (const row of opportunities) {
      const bucket = map.get(row.stage_id);
      if (bucket) {
        bucket.push(row);
      }
    }
    return map;
  }, [opportunities, stages]);

  async function commitDrop(opportunity: Opportunity, stage: PipelineStage, reasonId?: string) {
    try {
      await changeStage.mutateAsync({
        id: opportunity.id,
        stageId: stage.id,
        version: opportunity.version,
        lostReasonId: reasonId ?? null,
      });
      toast.success("Stage updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function onDrop(stage: PipelineStage, opportunityId: string) {
    const opportunity = opportunities.find((row) => row.id === opportunityId);
    if (!opportunity) {
      return;
    }
    if (stage.stage_kind === "LOST") {
      setPendingDrop({ opportunity, stage });
      setLostReasonId("");
      return;
    }
    if (!opportunity.available_actions.includes(`move_stage:${stage.id}`)) {
      toast.error("This stage change is not allowed");
      return;
    }
    void commitDrop(opportunity, stage);
  }

  const lostReasons = lostReasonsQuery.data ?? [];

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <Card
            key={stage.id}
            className="min-w-72 shrink-0 bg-muted/20"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain") || draggingId;
              if (id) {
                onDrop(stage, id);
              }
              setDraggingId(null);
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {stage.name}
                <span className="text-muted-foreground ml-2 font-normal">
                  ({byStage.get(stage.id)?.length ?? 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {(byStage.get(stage.id) ?? []).map((row) => {
                const currencyCode = row.currency_id
                  ? currencyCodeById.get(row.currency_id)
                  : undefined;
                return (
                  <div
                    key={row.id}
                    draggable={row.available_actions.some((action) =>
                      action.startsWith("move_stage:"),
                    )}
                    onDragStart={(event) => {
                      setDraggingId(row.id);
                      event.dataTransfer.setData("text/plain", row.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className="bg-background rounded-md border p-3 shadow-sm"
                  >
                    <Link href={`/opportunities/${row.id}`} className="font-medium hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-muted-foreground mt-1 font-mono text-xs">{row.opportunity_number}</p>
                    {row.amount && currencyCode ? (
                      <p className="mt-2 tabular-nums text-sm">{formatMoney(row.amount, currencyCode)}</p>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={Boolean(pendingDrop)} onOpenChange={(open) => !open && setPendingDrop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lost reason required</DialogTitle>
          </DialogHeader>
          <Select value={lostReasonId} onValueChange={setLostReasonId}>
            <SelectTrigger>
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              {lostReasons.map((reason) => (
                <SelectItem key={reason.id} value={reason.id}>
                  {reason.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDrop(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!lostReasonId || changeStage.isPending}
              onClick={() => {
                if (!pendingDrop || !lostReasonId) {
                  return;
                }
                void commitDrop(pendingDrop.opportunity, pendingDrop.stage, lostReasonId).finally(
                  () => setPendingDrop(null),
                );
              }}
            >
              Mark lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
