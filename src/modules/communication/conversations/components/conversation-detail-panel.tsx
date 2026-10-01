"use client";

import { Download, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CommAttachmentPreview,
  CommAvatar,
  CommEmptyState,
  CommMediaLightbox,
  CommPresenceBadge,
} from "@/modules/communication/components/ui";
import { commTheme } from "@/modules/communication/components/ui/comm-theme";
import { useConversation, useConversationAttachments } from "@/modules/communication/conversations/queries";
import { cn } from "@/shared/lib/cn";
import { GroupDetails } from "@/modules/communication/messages/components/GroupDetails";
import { conversationLabel } from "@/modules/communication/shared/conversation-label";
import {
  buildConversationUserNames,
  useUserDirectory,
} from "@/modules/communication/shared/use-user-directory";
import { usePresence } from "@/modules/communication/presence/queries";
import { useMe } from "@/modules/users-management/auth/queries";
import { chatAttachmentsApi } from "@/modules/communication/attachments/api";
import { downloadChatAttachment } from "@/modules/communication/attachments/download";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
export function ConversationDetailPanel({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose?: () => void;
}) {
  const { data: me } = useMe();
  const { data: conversation } = useConversation(conversationId);
  const { byId, users } = useUserDirectory();
  const participantIds = conversation?.participants.map((p) => p.user_id) ?? [];
  const { data: presence = [] } = usePresence(participantIds);
  const [activeTab, setActiveTab] = useState("info");
  const { data: files = [] } = useConversationAttachments(conversationId, "file", {
    enabled: activeTab === "files",
  });
  const { data: media = [] } = useConversationAttachments(conversationId, "media", {
    enabled: activeTab === "media",
  });
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; type?: string } | null>(
    null,
  );

  const userNames = useMemo(() => buildConversationUserNames(byId, me), [byId, me]);

  const presenceByUser = useMemo(() => {
    const map = new Map<string, { status: string; lastSeen: string | null }>();
    for (const row of presence) {
      map.set(row.user_id, { status: row.status, lastSeen: row.last_seen_at });
    }
    return map;
  }, [presence]);

  if (!me || !conversation) {
    return null;
  }

  const title = conversationLabel(conversation, me.id, userNames);
  const availableToAdd = users
    .filter((user) => !conversation.participants.some((p) => p.user_id === user.id))
    .map((user) => user.id);

  const openAttachment = async (attachmentId: string, filename: string, contentType: string) => {
    try {
      const detail = await chatAttachmentsApi.getDownloadUrl(attachmentId);
      if (contentType.startsWith("image/") || contentType.startsWith("video/")) {
        setLightbox({ src: detail.download_url, alt: filename, type: contentType });
        return;
      }
      window.open(detail.download_url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open attachment");
    }
  };

  const handleDownload = async (attachmentId: string, filename: string) => {
    try {
      await downloadChatAttachment(attachmentId, filename);
    } catch {
      toast.error("Could not download attachment");
    }
  };

  return (
    <div className={cn("border-border/60 flex h-full flex-col border-l", commTheme.sidebar)}>
      <div className="border-border/60 border-b px-4 py-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-3 gap-y-0.5">
          <CommAvatar
            label={title}
            size="lg"
            className={cn(
              "col-start-1 self-center",
              conversation.description ? "row-span-2" : "row-span-1",
            )}
          />
          <h3 className="col-start-2 row-start-1 min-w-0 truncate font-semibold leading-tight">
            {title}
          </h3>
          {conversation.description ? (
            <p className="text-muted-foreground col-start-2 row-start-2 min-w-0 truncate text-sm leading-tight">
              {conversation.description}
            </p>
          ) : null}
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "col-start-3 h-8 w-8 shrink-0 self-center",
                conversation.description ? "row-span-2" : "row-span-1",
              )}
              onClick={onClose}
              aria-label="Close details"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/chat/settings">Settings</Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="info"
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="flex-1 overflow-y-auto px-4 pb-4">
          {conversation.kind === "GROUP" ? (
            <GroupDetails
              conversation={conversation}
              title={title}
              userNames={userNames}
              availableUserIds={availableToAdd}
            />
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Members
              </p>
              <ul className="space-y-2">
                {conversation.participants.map((participant) => {
                  const name = userNames.get(participant.user_id) ?? "User";
                  const row = presenceByUser.get(participant.user_id);
                  return (
                    <li
                      key={participant.user_id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-3 gap-y-0.5 rounded-lg px-1 py-1.5"
                    >
                      <CommAvatar
                        label={name}
                        presence={row?.status ?? "OFFLINE"}
                        size="sm"
                        className={cn("col-start-1 self-center", row ? "row-span-2" : "row-span-1")}
                      />
                      <span className="col-start-2 row-start-1 truncate text-sm leading-tight">
                        {name}
                      </span>
                      {row ? (
                        <CommPresenceBadge
                          status={row.status}
                          lastSeen={row.lastSeen}
                          className="col-start-2 row-start-2"
                        />
                      ) : null}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "col-start-3 self-center text-[10px] uppercase",
                          row ? "row-span-2" : "row-span-1",
                        )}
                      >
                        {participant.role}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="flex-1 overflow-y-auto px-4 pb-4">
          {files.length === 0 ? (
            <CommEmptyState
              title="No files shared"
              message="Files shared in this chat will appear here."
              className="py-8"
            />
          ) : (
            <ul className="space-y-2 pt-2">
              {files.map((file) => (
                <li key={file.attachment_id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() =>
                        void openAttachment(
                          file.attachment_id,
                          file.original_filename,
                          file.content_type,
                        )
                      }
                    >
                      <CommAttachmentPreview
                        filename={file.original_filename}
                        contentType={file.content_type}
                        sizeBytes={file.size_bytes}
                        variant="bubble"
                      />
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Download ${file.original_filename}`}
                      onClick={() =>
                        void handleDownload(file.attachment_id, file.original_filename)
                      }
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="media" className="flex-1 overflow-y-auto px-4 pb-4">
          {media.length === 0 ? (
            <CommEmptyState
              title="No media shared"
              message="Photos and videos from this chat will appear here."
              className="py-8"
            />
          ) : (
            <ul className="grid grid-cols-2 gap-2 pt-2">
              {media.map((item) => (
                <li key={item.attachment_id} className="group/media relative">
                  <button
                    type="button"
                    className="hover:ring-primary/30 aspect-square w-full overflow-hidden rounded-lg border transition hover:ring-2"
                    onClick={() =>
                      void openAttachment(
                        item.attachment_id,
                        item.original_filename,
                        item.content_type,
                      )
                    }
                  >
                    <CommAttachmentPreview
                      filename={item.original_filename}
                      contentType={item.content_type}
                      thumbnailUrl={item.thumbnail_url}
                      variant="grid"
                      className="h-full"
                    />
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 shadow-sm transition-opacity group-hover/media:opacity-100"
                    aria-label={`Download ${item.original_filename}`}
                    onClick={() =>
                      void handleDownload(item.attachment_id, item.original_filename)
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <CommMediaLightbox
        open={lightbox != null}
        onOpenChange={(open) => {
          if (!open) {
            setLightbox(null);
          }
        }}
        src={lightbox?.src ?? null}
        alt={lightbox?.alt ?? "Media"}
        contentType={lightbox?.type}
      />
    </div>
  );
}
