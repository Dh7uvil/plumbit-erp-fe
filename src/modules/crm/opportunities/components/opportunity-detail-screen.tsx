"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OpportunityForm } from "@/modules/crm/opportunities/components/opportunity-form";
import { OpportunityStatusBadge } from "@/modules/crm/opportunities/components/opportunity-status-badge";
import {
  useLoseOpportunity,
  useReopenOpportunity,
  useWinOpportunity,
} from "@/modules/crm/opportunities/mutations";
import { opportunityPermissions } from "@/modules/crm/opportunities/permissions";
import { useOpportunity } from "@/modules/crm/opportunities/queries";
import { useAllLostReasons } from "@/modules/crm/lost-reasons/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { ActivityTimeline } from "@/modules/users-management/activity/components/activity-timeline";
import { useEntityActivity } from "@/modules/users-management/activity/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
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
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatMoney } from "@/shared/lib/format";

export function OpportunityDetailScreen({
  opportunityId,
  mode,
}: {
  opportunityId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(opportunityPermissions);
  const opportunityQuery = useOpportunity(opportunityId);
  const activityQuery = useEntityActivity("opportunity", opportunityId, undefined, {
    pageSize: 50,
  });
  const winOpportunity = useWinOpportunity();
  const loseOpportunity = useLoseOpportunity();
  const reopenOpportunity = useReopenOpportunity();
  const lostReasonsQuery = useAllLostReasons(true);
  const currenciesQuery = useAllCurrencies();
  const [loseOpen, setLoseOpen] = useState(false);
  const [lostReasonId, setLostReasonId] = useState("");

  const currencyCodeById = useMemo(
    () => new Map((currenciesQuery.data ?? []).map((currency) => [currency.id, currency.code])),
    [currenciesQuery.data],
  );

  const opportunity = opportunityQuery.data;
  if (opportunityQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (opportunityQuery.isError || !opportunity) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            opportunityQuery.error ? getErrorMessage(opportunityQuery.error) : "Opportunity not found"
          }
          onRetry={() => opportunityQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/opportunities">Back to opportunities</Link>
        </Button>
      </div>
    );
  }

  const current = opportunity;
  const isEdit = mode === "edit";
  const viewHref = `/opportunities/${opportunityId}`;
  const canEdit = current.status === "OPEN" && canUpdate;
  const currencyCode = current.currency_id
    ? currencyCodeById.get(current.currency_id)
    : undefined;
  const canWin = current.available_actions.includes("win");
  const canLose = current.available_actions.includes("lose");
  const canReopen = current.available_actions.includes("reopen");

  async function onWin() {
    try {
      await winOpportunity.mutateAsync({ id: current.id, version: current.version });
      toast.success("Opportunity marked as won");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onReopen() {
    try {
      await reopenOpportunity.mutateAsync({ id: current.id, version: current.version });
      toast.success("Opportunity reopened");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onConfirmLose() {
    if (!lostReasonId) {
      return;
    }
    try {
      await loseOpportunity.mutateAsync({
        id: current.id,
        lostReasonId,
        version: current.version,
      });
      toast.success("Opportunity marked as lost");
      setLoseOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const activityRows = activityQuery.data?.data ?? [];
  const lostReasons = lostReasonsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={current.name}
        subtitle={current.opportunity_number}
        listHref="/opportunities"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canEdit}
        mode={mode}
        extraActions={
          <>
            {canWin ? (
              <Button type="button" size="sm" disabled={winOpportunity.isPending} onClick={() => void onWin()}>
                {winOpportunity.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Mark won
              </Button>
            ) : null}
            {canLose ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setLoseOpen(true)}>
                Mark lost
              </Button>
            ) : null}
            {canReopen ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reopenOpportunity.isPending}
                onClick={() => void onReopen()}
              >
                Reopen
              </Button>
            ) : null}
            <OpportunityStatusBadge status={current.status} />
          </>
        }
      />
      {!isEdit && current.amount && currencyCode ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-medium tabular-nums">
            {formatMoney(current.amount, currencyCode)}
          </CardContent>
        </Card>
      ) : null}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isEdit ? "Edit opportunity" : "Opportunity details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OpportunityForm
                opportunity={current}
                disabled={!isEdit || !canEdit}
                onSuccess={() => router.push(viewHref)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : activityQuery.isError ? (
                <DataTableError
                  message={getErrorMessage(activityQuery.error)}
                  onRetry={() => activityQuery.refetch()}
                />
              ) : (
                <ActivityTimeline
                  rows={activityRows}
                  emptyTitle="No activity yet"
                  emptyMessage="Changes to this opportunity will appear here."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={loseOpen} onOpenChange={setLoseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark opportunity as lost</DialogTitle>
          </DialogHeader>
          <Select value={lostReasonId} onValueChange={setLostReasonId}>
            <SelectTrigger>
              <SelectValue placeholder="Select lost reason" />
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
            <Button type="button" variant="outline" onClick={() => setLoseOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!lostReasonId || loseOpportunity.isPending}
              onClick={() => void onConfirmLose()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
