"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CommAvatar } from "@/modules/communication/components/ui";
import type { Conversation } from "@/modules/communication/conversations/schemas";
import { GroupMembers } from "@/modules/communication/messages/components/GroupMembers";
import { useUpdateGroup, useLeaveGroup } from "@/modules/communication/groups/mutations";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

export function GroupDetails({
  conversation,
  title,
  userNames,
  availableUserIds,
}: {
  conversation: Conversation;
  title: string;
  userNames: Map<string, string>;
  availableUserIds?: string[];
}) {
  const router = useRouter();
  const updateGroup = useUpdateGroup();
  const leaveGroup = useLeaveGroup();
  const [editing, setEditing] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [name, setName] = useState(conversation.name ?? "");
  const [description, setDescription] = useState(conversation.description ?? "");

  const handleSave = async () => {
    try {
      await updateGroup.mutateAsync({
        id: conversation.id,
        values: {
          name: name.trim() || null,
          description: description.trim() || null,
        },
      });
      setEditing(false);
      toast.success("Group updated");
    } catch {
      toast.error("Could not update group");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup.mutateAsync(conversation.id);
      toast.success("Left group");
      setLeaveOpen(false);
      router.push("/chat");
    } catch {
      toast.error("Could not leave group");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <CommAvatar label={title} size="lg" />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <div>
                <Label htmlFor="group-name">Name</Label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="group-description">Description</Label>
                <Textarea
                  id="group-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void handleSave()} disabled={updateGroup.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="truncate font-semibold">{title}</h3>
              {conversation.description ? (
                <p className="text-muted-foreground text-sm">{conversation.description}</p>
              ) : null}
              <p className="text-muted-foreground mt-1 text-xs">
                {conversation.participants.length} members
              </p>
              <Button
                size="sm"
                variant="link"
                className="h-auto px-0"
                onClick={() => setEditing(true)}
              >
                Edit group info
              </Button>
            </>
          )}
        </div>
      </div>

      <GroupMembers
        conversation={conversation}
        userNames={userNames}
        availableUserIds={availableUserIds}
      />

      <Button
        variant="outline"
        className="text-destructive w-full"
        onClick={() => setLeaveOpen(true)}
        disabled={leaveGroup.isPending}
      >
        Leave group
      </Button>

      <ConfirmActionDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave this group?"
        description="You will no longer receive messages from this group unless you are added again."
        confirmLabel="Leave group"
        pending={leaveGroup.isPending}
        onConfirm={() => void handleLeave()}
      />
    </div>
  );
}
