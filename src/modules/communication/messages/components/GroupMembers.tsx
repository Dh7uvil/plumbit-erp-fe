"use client";

import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CommAvatar, CommSectionHeader } from "@/modules/communication/components/ui";
import type { Conversation } from "@/modules/communication/conversations/schemas";
import {
  useAddGroupMembers,
  useDemoteGroupAdmin,
  usePromoteGroupAdmin,
  useRemoveGroupMember,
} from "@/modules/communication/groups/mutations";
import { usePresence } from "@/modules/communication/presence/queries";
import { useMe } from "@/modules/users-management/auth/queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";

export function GroupMembers({
  conversation,
  userNames,
  availableUserIds = [],
}: {
  conversation: Conversation;
  userNames: Map<string, string>;
  availableUserIds?: string[];
}) {
  const { data: me } = useMe();
  const participantIds = conversation.participants.map((p) => p.user_id);
  const { data: presence = [] } = usePresence(participantIds);
  const addMembers = useAddGroupMembers();
  const removeMember = useRemoveGroupMember();
  const promoteAdmin = usePromoteGroupAdmin();
  const demoteAdmin = useDemoteGroupAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  const presenceByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of presence) {
      map.set(row.user_id, row.status);
    }
    return map;
  }, [presence]);

  const myParticipant = conversation.participants.find((p) => p.user_id === me?.id);
  const canManage = myParticipant?.role === "OWNER" || myParticipant?.role === "ADMIN";

  const filteredAvailable = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    return availableUserIds.filter((id) => {
      const name = userNames.get(id) ?? "";
      return !q || name.toLowerCase().includes(q);
    });
  }, [addQuery, availableUserIds, userNames]);

  const handleAddMember = (userId: string) => {
    addMembers.mutate(
      { id: conversation.id, values: { user_ids: [userId] } },
      {
        onSuccess: () => {
          toast.success("Member added");
          setAddOpen(false);
          setAddQuery("");
        },
        onError: () => toast.error("Could not add member"),
      },
    );
  };

  return (
    <div className="space-y-3">
      <CommSectionHeader
        title={`Members (${conversation.participants.length})`}
        action={
          canManage && availableUserIds.length > 0 ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setAddOpen(true)}
              aria-label="Add member"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          ) : null
        }
      />

      <ul className="space-y-2 px-1">
        {conversation.participants.map((participant) => {
          const name = userNames.get(participant.user_id) ?? "User";
          const status = presenceByUser.get(participant.user_id) ?? "OFFLINE";
          const isSelf = participant.user_id === me?.id;
          return (
            <li
              key={participant.user_id}
              className="hover:bg-muted/50 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CommAvatar label={name} presence={status} size="sm" />
                <span className="truncate text-sm">
                  {name}
                  {isSelf ? " (you)" : ""}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {participant.role}
                </Badge>
                {canManage && !isSelf && participant.role !== "OWNER" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        Manage
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {participant.role === "MEMBER" ? (
                        <DropdownMenuItem
                          onClick={() =>
                            promoteAdmin.mutate(
                              { id: conversation.id, userId: participant.user_id },
                              {
                                onSuccess: () => toast.success("Promoted to admin"),
                                onError: () => toast.error("Could not promote"),
                              },
                            )
                          }
                        >
                          Make admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            demoteAdmin.mutate(
                              { id: conversation.id, userId: participant.user_id },
                              {
                                onSuccess: () => toast.success("Demoted to member"),
                                onError: () => toast.error("Could not demote"),
                              },
                            )
                          }
                        >
                          Remove admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          removeMember.mutate(
                            { id: conversation.id, userId: participant.user_id },
                            {
                              onSuccess: () => toast.success("Member removed"),
                              onError: () => toast.error("Could not remove member"),
                            },
                          )
                        }
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>
          <Input
            value={addQuery}
            onChange={(event) => setAddQuery(event.target.value)}
            placeholder="Search colleagues…"
            autoFocus
          />
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {filteredAvailable.length === 0 ? (
              <li className="text-muted-foreground py-4 text-center text-sm">No users found.</li>
            ) : (
              filteredAvailable.map((userId) => (
                <li key={userId}>
                  <button
                    type="button"
                    className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm"
                    onClick={() => handleAddMember(userId)}
                  >
                    <CommAvatar label={userNames.get(userId) ?? "User"} size="sm" />
                    {userNames.get(userId) ?? userId}
                  </button>
                </li>
              ))
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
