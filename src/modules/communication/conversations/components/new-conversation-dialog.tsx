"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useCreateConversation } from "@/modules/communication/conversations/mutations";
import type { ConversationKind } from "@/modules/communication/conversations/schemas";
import { useUserDirectory } from "@/modules/communication/shared/use-user-directory";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export function NewConversationDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: ConversationKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { users, isLoading, isError } = useUserDirectory();
  const create = useCreateConversation();
  const [name, setName] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const reset = () => {
    setName("");
    setOtherUserId("");
    setMemberIds([]);
  };

  const handleSubmit = async () => {
    if (!kind) {
      return;
    }
    try {
      const conversation = await create.mutateAsync(
        kind === "DIRECT"
          ? { kind, other_user_id: otherUserId }
          : {
              kind,
              name: name.trim() || null,
              participant_user_ids: memberIds,
            },
      );
      toast.success(kind === "DIRECT" ? "Direct message opened" : "Group created");
      onOpenChange(false);
      reset();
      router.push(`/chat/${conversation.id}`);
    } catch {
      toast.error("Could not create conversation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === "GROUP" ? "Create group" : "Start direct message"}</DialogTitle>
        </DialogHeader>
        {kind === "DIRECT" ? (
          <div className="space-y-2">
            <Label htmlFor="dm-user">User</Label>
            <Select value={otherUserId} onValueChange={setOtherUserId}>
              <SelectTrigger id="dm-user">
                <SelectValue placeholder="Select a colleague" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="__loading" disabled>
                    Loading colleagues…
                  </SelectItem>
                ) : isError ? (
                  <SelectItem value="__error" disabled>
                    Could not load colleagues
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    No colleagues available
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Project team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-members">Add members</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !memberIds.includes(value)) {
                    setMemberIds([...memberIds, value]);
                  }
                }}
              >
                <SelectTrigger id="group-members">
                  <SelectValue placeholder="Select members" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="__loading" disabled>
                      Loading colleagues…
                    </SelectItem>
                  ) : isError ? (
                    <SelectItem value="__error" disabled>
                      Could not load colleagues
                    </SelectItem>
                  ) : users.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      No colleagues available
                    </SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {memberIds.length > 0 ? (
                <p className="text-muted-foreground text-xs">{memberIds.length} member(s) selected</p>
              ) : null}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={
              create.isPending ||
              (kind === "DIRECT" ? !otherUserId : memberIds.length === 0)
            }
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
