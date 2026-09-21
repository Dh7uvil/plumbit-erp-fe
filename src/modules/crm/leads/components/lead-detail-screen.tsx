"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { LeadForm } from "@/modules/crm/leads/components/lead-form";
import { LeadStatusBadge } from "@/modules/crm/leads/components/lead-status-badge";
import { useAssignLead, useChangeLeadStatus } from "@/modules/crm/leads/mutations";
import { leadPermissions } from "@/modules/crm/leads/permissions";
import { useLead } from "@/modules/crm/leads/queries";
import { leadDisplayName } from "@/modules/crm/leads/schemas";
import { ActivityTimeline } from "@/modules/users-management/activity/components/activity-timeline";
import { useEntityActivity } from "@/modules/users-management/activity/queries";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { useCan } from "@/shared/providers/session-provider";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export function LeadDetailScreen({ leadId, mode }: { leadId: string; mode: RecordPageMode }) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(leadPermissions);
  const can = useCan();
  const canAssign = can(leadPermissions.assign);
  const leadQuery = useLead(leadId);
  const activityQuery = useEntityActivity("lead", leadId, undefined, { pageSize: 50 });
  const usersQuery = useAllUsers(canAssign);
  const assignLead = useAssignLead();
  const changeStatus = useChangeLeadStatus();
  const lead = leadQuery.data;
  if (leadQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (leadQuery.isError || !lead) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={leadQuery.error ? getErrorMessage(leadQuery.error) : "Lead not found"}
          onRetry={() => leadQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/leads">Back to leads</Link>
        </Button>
      </div>
    );
  }

  const currentLead = lead;
  const isEdit = mode === "edit";
  const viewHref = `/leads/${leadId}`;
  const canEdit = !["CONVERTED", "LOST"].includes(currentLead.status) && canUpdate;
  const title = leadDisplayName(currentLead);
  const canQualify = currentLead.available_actions.includes("set_status:QUALIFIED");

  async function onAssign(ownerId: string) {
    try {
      await assignLead.mutateAsync({
        id: currentLead.id,
        ownerId,
        version: currentLead.version,
      });
      toast.success("Owner updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onQualify() {
    try {
      await changeStatus.mutateAsync({
        id: currentLead.id,
        status: "QUALIFIED",
        version: currentLead.version,
      });
      toast.success("Lead marked as qualified");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const users = usersQuery.data ?? [];
  const activityRows = activityQuery.data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={currentLead.lead_number}
        listHref="/leads"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canEdit}
        mode={mode}
        extraActions={
          <>
            {canQualify ? (
              <Button
                type="button"
                size="sm"
                disabled={changeStatus.isPending}
                onClick={() => void onQualify()}
              >
                {changeStatus.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Mark qualified
              </Button>
            ) : null}
            <LeadStatusBadge status={currentLead.status} />
          </>
        }
      />
      {canAssign && !isEdit ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={currentLead.owner_id ?? ""}
              onValueChange={(value) => void onAssign(value)}
              disabled={assignLead.isPending}
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Assign owner" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <CardTitle className="text-base">{isEdit ? "Edit lead" : "Lead details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadForm
                lead={currentLead}
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
                  emptyMessage="Changes to this lead will appear here."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
