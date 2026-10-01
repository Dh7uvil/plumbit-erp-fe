"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";

import { CommConnectionBanner } from "@/modules/communication/components/ui";
import { CommEmptyState } from "@/modules/communication/components/ui/comm-empty-state";
import { ConversationDetailPanel } from "@/modules/communication/conversations/components/conversation-detail-panel";
import { ConversationListPanel } from "@/modules/communication/conversations/components/conversation-list-panel";
import { MessageThreadPanel } from "@/modules/communication/messages/components/message-thread-panel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";

export function ChatScreen({
  conversationId,
  scrollToSeq,
}: {
  conversationId?: string;
  scrollToSeq?: number;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    setDetailOpen(false);
  }, [conversationId]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLargeScreen(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const toggleDetail = () => setDetailOpen((open) => !open);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <CommConnectionBanner />
      <div
        className={cn(
          "grid h-full min-h-0 flex-1 grid-rows-1 overflow-hidden",
          detailOpen && isLargeScreen
            ? "lg:grid-cols-[280px_minmax(0,1fr)_320px]"
            : "lg:grid-cols-[280px_minmax(0,1fr)]",
        )}
      >
        <div
          className={cn(
            "min-h-0 overflow-hidden",
            conversationId ? "hidden md:block" : "block",
          )}
        >
          <ConversationListPanel activeConversationId={conversationId} />
        </div>

        <div
          className={
            conversationId
              ? "flex h-full min-h-0 flex-col overflow-hidden"
              : "hidden h-full min-h-0 md:flex md:items-center md:justify-center"
          }
        >
          {conversationId ? (
            <MessageThreadPanel
              conversationId={conversationId}
              scrollToSeq={scrollToSeq}
              detailOpen={detailOpen}
              onToggleDetail={toggleDetail}
            />
          ) : (
            <div className="bg-[#f0f4f9] flex h-full w-full flex-col items-center justify-center dark:bg-background">
              <CommEmptyState
                title="Select a conversation"
                message="Choose a chat from the sidebar or start a new direct message."
                className="max-w-sm py-16"
              />
            </div>
          )}
        </div>

        {conversationId && detailOpen && isLargeScreen ? (
          <div className="hidden min-h-0 overflow-hidden lg:block">
            <ConversationDetailPanel
              conversationId={conversationId}
              onClose={() => setDetailOpen(false)}
            />
          </div>
        ) : null}
      </div>

      {conversationId && !isLargeScreen ? (
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent side="right" className="w-full p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>Conversation details</SheetTitle>
            </SheetHeader>
            <ConversationDetailPanel
              conversationId={conversationId}
              onClose={() => setDetailOpen(false)}
            />
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
