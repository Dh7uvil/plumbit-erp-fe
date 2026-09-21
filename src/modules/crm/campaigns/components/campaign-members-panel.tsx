"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useAddCampaignMember,
  useRemoveCampaignMember,
  useUpdateCampaignMember,
} from "@/modules/crm/campaigns/mutations";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import { useCampaignMembers } from "@/modules/crm/campaigns/queries";
import {
  CAMPAIGN_MEMBER_STATUSES,
  CAMPAIGN_MEMBER_STATUS_LABELS,
  CAMPAIGN_MEMBER_TYPE_LABELS,
  type CampaignMember,
  type CampaignMemberStatus,
  type CampaignMemberType,
} from "@/modules/crm/campaigns/schemas";
import { useAllContacts } from "@/modules/crm/contacts/queries";
import { useLeads } from "@/modules/crm/leads/queries";
import { leadDisplayName } from "@/modules/crm/leads/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { useTableParams } from "@/shared/hooks/use-table-params";

export function CampaignMembersPanel({ campaignId }: { campaignId: string }) {
  const { canUpdate } = useCrudPermissions(campaignPermissions);
  const { page, page_size, setPage } = useTableParams();
  const membersQuery = useCampaignMembers(campaignId, { page, page_size });
  const addMember = useAddCampaignMember();
  const updateMember = useUpdateCampaignMember();
  const removeMember = useRemoveCampaignMember();
  const [addOpen, setAddOpen] = useState(false);
  const [memberType, setMemberType] = useState<CampaignMemberType>("lead");
  const [memberId, setMemberId] = useState("");
  const [removing, setRemoving] = useState<CampaignMember | null>(null);
  const leadsQuery = useLeads({ page: 1, page_size: 100 });
  const contactsQuery = useAllContacts(addOpen && memberType === "contact");
  const rows = membersQuery.data?.data ?? [];
  const meta = membersQuery.data?.meta;

  const memberOptions = useMemo(() => {
    if (memberType === "lead") {
      return (leadsQuery.data?.data ?? []).map((lead) => ({
        value: lead.id,
        label: leadDisplayName(lead),
      }));
    }
    return (contactsQuery.data ?? []).map((contact) => ({
      value: contact.id,
      label: contact.name,
    }));
  }, [contactsQuery.data, leadsQuery.data?.data, memberType]);

  async function onAdd() {
    if (!memberId) {
      toast.error("Select a member");
      return;
    }
    try {
      await addMember.mutateAsync({
        id: campaignId,
        values: { member_type: memberType, member_id: memberId },
      });
      toast.success("Member added");
      setAddOpen(false);
      setMemberId("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onStatusChange(member: CampaignMember, status: CampaignMemberStatus) {
    try {
      await updateMember.mutateAsync({
        id: campaignId,
        memberId: member.id,
        values: { member_status: status },
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function confirmRemove() {
    if (!removing) {
      return;
    }
    try {
      await removeMember.mutateAsync({ id: campaignId, memberId: removing.id });
      toast.success("Member removed");
      setRemoving(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (membersQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (membersQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(membersQuery.error)}
        onRetry={() => membersQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canUpdate ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 size-4" aria-hidden />
            Add member
          </Button>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            {canUpdate ? <TableHead className="w-28">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canUpdate ? 4 : 3}>
                <DataTableEmpty
                  title="No members"
                  message="Add leads or contacts to this campaign."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.member_label ?? member.member_id}
                </TableCell>
                <TableCell>{CAMPAIGN_MEMBER_TYPE_LABELS[member.member_type]}</TableCell>
                <TableCell>
                  {canUpdate ? (
                    <Select
                      value={member.member_status}
                      onValueChange={(value) =>
                        void onStatusChange(member, value as CampaignMemberStatus)
                      }
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPAIGN_MEMBER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {CAMPAIGN_MEMBER_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    CAMPAIGN_MEMBER_STATUS_LABELS[member.member_status]
                  )}
                </TableCell>
                {canUpdate ? (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoving(member)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add campaign member</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select
              value={memberType}
              onValueChange={(value) => {
                setMemberType(value as CampaignMemberType);
                setMemberId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
              </SelectContent>
            </Select>
            <MasterSelect
              value={memberId}
              onValueChange={setMemberId}
              options={memberOptions}
              placeholder={memberType === "lead" ? "Select a lead" : "Select a contact"}
              searchPlaceholder="Search…"
              asFormControl={false}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onAdd()} disabled={addMember.isPending}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={Boolean(removing)}
        title="Remove member"
        description="Remove this member from the campaign?"
        confirmLabel="Remove"
        pending={removeMember.isPending}
        onOpenChange={(open) => !open && setRemoving(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}
