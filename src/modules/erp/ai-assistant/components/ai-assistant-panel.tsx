"use client";

import { Bot, Loader2, X } from "lucide-react";
import { useState } from "react";

import { useAiAssist } from "@/modules/erp/ai-assistant/mutations";
import type { AiSuggestion } from "@/modules/erp/ai-assistant/schemas";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/cn";

export function AiAssistantPanel() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const assist = useAiAssist();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || assist.isPending) {
      return;
    }

    const result = await assist.mutateAsync({ prompt: trimmed });
    setSuggestions(result.suggestions);
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open ? (
        <div
          className={cn(
            "bg-background pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border p-4 shadow-lg",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">AI assistant</p>
              <p className="text-muted-foreground text-xs">
                Read-only suggestions. Cannot post journals or stock movements.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close AI assistant"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask how to complete a task in Plumbit ERP…"
              rows={4}
              maxLength={4000}
              disabled={assist.isPending}
            />
            <Button type="submit" disabled={!prompt.trim() || assist.isPending}>
              {assist.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Thinking…
                </>
              ) : (
                "Get suggestions"
              )}
            </Button>
          </form>

          {assist.isError ? (
            <p className="text-destructive text-sm">Could not load suggestions. Try again.</p>
          ) : null}

          {suggestions.length > 0 ? (
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {suggestions.map((item) => (
                <li key={`${item.title}-${item.body.slice(0, 24)}`} className="bg-muted/40 rounded-lg p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{item.body}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Button
        type="button"
        size="icon"
        className="pointer-events-auto h-12 w-12 rounded-full shadow-lg"
        aria-label="Open AI assistant"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bot className="size-5" />
      </Button>
    </div>
  );
}
