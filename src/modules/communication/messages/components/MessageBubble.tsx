"use client";

import {
  CornerUpLeft,
  Download,
  Forward,
  MoreVertical,
  Pencil,
  Phone,
  Pin,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ReactionPicker } from "@/modules/communication/components/ReactionPicker";
import { CommAvatar } from "@/modules/communication/components/ui/comm-avatar";
import { CommAttachmentPreview } from "@/modules/communication/components/ui/comm-attachment-preview";
import { CommMediaLightbox } from "@/modules/communication/components/ui/comm-media-lightbox";
import { chatAttachmentsApi } from "@/modules/communication/attachments/api";
import { downloadChatAttachment } from "@/modules/communication/attachments/download";
import {
  CommMessageStatus,
  type MessageDeliveryStatus,
} from "@/modules/communication/components/ui/comm-message-status";
import { commTheme } from "@/modules/communication/components/ui/comm-theme";
import { formatCallBubbleText } from "@/modules/communication/calls/components/CallHistory";
import { getCallEventMeta } from "@/modules/communication/shared/call-label";
import type { MessageActionHandlers } from "@/modules/communication/hooks/useMessageActions";
import { useDeleteMessage, useUpdateMessage } from "@/modules/communication/messages/mutations";
import type { Message } from "@/modules/communication/messages/schemas";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

export type { MessageDeliveryStatus };

function groupReactions(message: Message) {
  return (message.reactions ?? []).reduce<Array<{ emoji: string; userIds: string[] }>>(
    (acc, reaction) => {
      const existing = acc.find((item) => item.emoji === reaction.emoji);
      if (existing) {
        existing.userIds.push(reaction.user_id);
      } else {
        acc.push({ emoji: reaction.emoji, userIds: [reaction.user_id] });
      }
      return acc;
    },
    [],
  );
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  senderName,
  deliveryStatus,
  replyPreviewLabel,
  onReply,
  messageActions,
  showAvatar = false,
}: {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  senderName: string;
  deliveryStatus?: MessageDeliveryStatus;
  replyPreviewLabel?: string | null;
  onReply?: (message: Message) => void;
  messageActions?: MessageActionHandlers;
  showAvatar?: boolean;
}) {
  const deleted = Boolean(message.deleted_at);
  const attachment = message.attachment;
  const isImage = attachment?.content_type.startsWith("image/");
  const isVideo = attachment?.content_type.startsWith("video/");
  const isSystem = message.kind === "SYSTEM" || message.kind === "CALL_EVENT";
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body ?? "");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    if (!open) {
      requestAnimationFrame(() => {
        (document.activeElement as HTMLElement | null)?.blur?.();
      });
    }
  };

  const handleReactionPickerOpenChange = (open: boolean) => {
    setReactionPickerOpen(open);
    if (!open) {
      requestAnimationFrame(() => {
        (document.activeElement as HTMLElement | null)?.blur?.();
      });
    }
  };

  const openAttachment = async () => {
    if (!attachment) {
      return;
    }
    try {
      const detail = await chatAttachmentsApi.getDownloadUrl(attachment.id);
      if (isImage || isVideo) {
        setLightboxSrc(detail.download_url);
        setLightboxOpen(true);
        return;
      }
      window.open(detail.download_url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open attachment");
    }
  };

  const handleDownloadAttachment = async () => {
    if (!attachment) {
      return;
    }
    try {
      await downloadChatAttachment(attachment.id, attachment.original_filename);
    } catch {
      toast.error("Could not download attachment");
    }
  };

  const showMessageActions = menuOpen || reactionPickerOpen;

  const handleSaveEdit = async () => {
    const body = editBody.trim();
    if (!body) {
      return;
    }
    try {
      await updateMessage.mutateAsync({ id: message.id, values: { body } });
      setEditing(false);
    } catch {
      toast.error("Could not edit message");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMessage.mutateAsync(message.id);
    } catch {
      toast.error("Could not delete message");
    }
  };

  const replyPreview = message.reply_preview;
  const forwardedFrom = message.forwarded_from;
  const isSaved = messageActions?.savedMessageIds.has(message.id) ?? false;
  const groupedReactions = groupReactions(message);
  const hasReactions = groupedReactions.length > 0;

  if (isSystem) {
    const callMeta = getCallEventMeta(message);
    const label =
      callMeta != null
        ? formatCallBubbleText(callMeta.kind, callMeta.durationSeconds, callMeta.missed)
        : (message.body ?? "System message");

    return (
      <div className="flex justify-center py-2">
        <div className="bg-white/90 text-muted-foreground flex items-center gap-1.5 rounded-full px-3 py-1 text-xs shadow-sm dark:bg-card">
          {callMeta ? (
            callMeta.kind === "VIDEO" ? (
              <Video className="h-3 w-3" />
            ) : (
              <Phone className="h-3 w-3" />
            )
          ) : null}
          <span>{label}</span>
          <span>· {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    );
  }

  const timeLabel = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const metadataRow = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 text-[11px] leading-none whitespace-nowrap",
        isOwn ? "text-[#174ea6]/70 dark:text-blue-200/70" : "text-muted-foreground",
      )}
    >
      {message.edited_at ? <span className="mr-0.5 italic">edited</span> : null}
      <span>{timeLabel}</span>
      {isOwn && deliveryStatus ? <CommMessageStatus status={deliveryStatus} /> : null}
    </span>
  );

  return (
    <>
      <div className={cn("relative flex gap-2 pb-1", isOwn && "flex-row-reverse")}>
        {!isOwn && showAvatar ? (
          <CommAvatar label={senderName} size="sm" className="mt-1 self-end" />
        ) : null}

        <div
          className={cn(
            "group/message relative flex w-fit max-w-[min(78%,22rem)] flex-col",
            isOwn ? "items-end" : "items-start",
          )}
        >
          {!isOwn ? (
            <p className="text-muted-foreground mb-0.5 px-1 text-[11px] font-medium">{senderName}</p>
          ) : null}

          <div
            className={cn(
              "relative rounded-2xl px-3 py-2 text-sm leading-relaxed",
              isOwn ? cn(commTheme.bubbleOwn, "rounded-br-md") : cn(commTheme.bubbleOther, "rounded-bl-md"),
              deliveryStatus === "failed" && "ring-destructive/50 ring-1",
            )}
          >
            {forwardedFrom ? (
              <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                Forwarded
              </p>
            ) : null}

            {replyPreview && !deleted ? (
              <div
                className={cn(
                  "mb-2 rounded-lg border-l-[3px] px-2 py-1.5 text-xs",
                  isOwn
                    ? "border-[#1a73e8]/50 bg-white/40 dark:bg-white/5"
                    : "border-[#1a73e8] bg-[#f8f9fa] dark:bg-muted/40",
                )}
              >
                <p className="font-medium text-[#1a73e8]">{replyPreviewLabel ?? "Reply"}</p>
                <p className="text-muted-foreground truncate">
                  {replyPreview.deleted_at
                    ? "Message deleted"
                    : (replyPreview.body ??
                      (replyPreview.kind === "ATTACHMENT" ? "Attachment" : ""))}
                </p>
              </div>
            ) : null}

            {deleted ? (
              <p className="text-muted-foreground whitespace-pre-wrap break-words italic">Message deleted</p>
            ) : editing ? (
              <div key={`edit-${message.id}`} className="space-y-2">
                <Input
                  value={editBody}
                  onChange={(event) => setEditBody(event.target.value)}
                  className="text-foreground h-8 text-sm"
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => void handleSaveEdit()}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : attachment ? (
              <button
                type="button"
                onClick={() => void openAttachment()}
                className="block w-full text-left"
              >
                <CommAttachmentPreview
                  filename={attachment.original_filename}
                  contentType={attachment.content_type}
                  sizeBytes={attachment.size_bytes}
                  thumbnailUrl={attachment.thumbnail_url}
                  variant="bubble"
                />
              </button>
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {message.body ?? ""}
                <span className="float-right ml-3 inline-flex h-[1.125rem] items-end pb-px pl-1" aria-hidden>
                  {metadataRow}
                </span>
              </p>
            )}

            {(deleted || editing || attachment) && (
              <div className="mt-1 flex justify-end">{metadataRow}</div>
            )}
          </div>

          {!deleted && (messageActions || onReply) ? (
            <ReactionPicker
              reactions={groupedReactions}
              currentUserId={currentUserId}
              onToggleReaction={(emoji) => void messageActions?.toggleReaction(message, emoji)}
              align={isOwn ? "end" : "start"}
              showAddButton={Boolean(messageActions)}
              onPickerOpenChange={handleReactionPickerOpenChange}
              forceShowActions={showMessageActions}
              className={cn("relative z-[1] px-1", hasReactions ? "-mt-2.5 mb-0.5" : "")}
              suffix={
                <DropdownMenu modal={false} open={menuOpen} onOpenChange={handleMenuOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 rounded-full border border-border/70 text-muted-foreground hover:bg-white hover:text-foreground"
                      aria-label="Message actions"
                      aria-expanded={menuOpen}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isOwn ? "end" : "start"}
                    side="bottom"
                    sideOffset={6}
                    onCloseAutoFocus={(event) => event.preventDefault()}
                  >
                    {attachment ? (
                      <DropdownMenuItem
                        onClick={() => {
                          void handleDownloadAttachment();
                          handleMenuOpenChange(false);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                    ) : null}
                    {messageActions ? (
                      <DropdownMenuItem
                        onClick={() => {
                          messageActions.reply(message);
                          handleMenuOpenChange(false);
                        }}
                      >
                        <CornerUpLeft className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                    ) : onReply ? (
                      <DropdownMenuItem
                        onClick={() => {
                          onReply(message);
                          handleMenuOpenChange(false);
                        }}
                      >
                        <CornerUpLeft className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                    ) : null}
                    {messageActions ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            void messageActions.toggleStar(message);
                            handleMenuOpenChange(false);
                          }}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {isSaved ? "Unsave" : "Save"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            void messageActions.pin(message);
                            handleMenuOpenChange(false);
                          }}
                        >
                          <Pin className="mr-2 h-4 w-4" />
                          Pin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            messageActions.requestForward(message);
                            handleMenuOpenChange(false);
                          }}
                        >
                          <Forward className="mr-2 h-4 w-4" />
                          Forward
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {isOwn && message.kind === "TEXT" ? (
                      <DropdownMenuItem
                        onClick={() => {
                          if (messageActions) {
                            messageActions.edit(message);
                          } else {
                            setEditing(true);
                          }
                          handleMenuOpenChange(false);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    ) : null}
                    {isOwn ? (
                      <DropdownMenuItem
                        onClick={() => {
                          if (messageActions) {
                            void messageActions.delete(message);
                          } else {
                            void handleDelete();
                          }
                          handleMenuOpenChange(false);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ) : null}
        </div>
      </div>
      <CommMediaLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        src={lightboxSrc}
        alt={attachment?.original_filename ?? "Attachment"}
        contentType={attachment?.content_type}
      />
    </>
  );
}
