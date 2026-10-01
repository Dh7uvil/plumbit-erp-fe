"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

import { useConversationMessageSearch } from "@/modules/communication/search/queries";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export function ConversationSearch({
  conversationId,
  onSelectMessage,
}: {
  conversationId: string;
  onSelectMessage?: (seq: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const { data: results = [], isFetching } = useConversationMessageSearch(
    open ? conversationId : null,
    open && trimmed ? { q: trimmed, limit: 20 } : null,
  );

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Search messages"
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="border-border absolute inset-x-0 top-full z-10 border-b bg-background px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Search className="text-muted-foreground h-4 w-4 shrink-0" />
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search in conversation…"
          className="h-8"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {trimmed ? (
        <div className="mt-2 max-h-48 overflow-y-auto">
          {isFetching ? (
            <p className="text-muted-foreground py-2 text-xs">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground py-2 text-xs">No messages found.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    className="hover:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm"
                    onClick={() => {
                      onSelectMessage?.(message.seq);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <p className="truncate">{message.body ?? "Attachment"}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
