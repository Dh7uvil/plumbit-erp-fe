"use client";

import { Loader2, MessageSquare, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useGlobalSearch } from "@/modules/communication/search/queries";
import type { SearchResultItem, SearchType } from "@/modules/communication/search/schemas";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/cn";

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "messages", label: "Messages" },
  { value: "conversations", label: "Chats" },
  { value: "people", label: "People" },
  { value: "groups", label: "Groups" },
  { value: "files", label: "Files" },
];

function resultIcon(type: SearchType) {
  if (type === "people" || type === "groups") {
    return Users;
  }
  return MessageSquare;
}

function resultHref(result: SearchResultItem): string | null {
  if (result.type === "messages" && result.conversation_id) {
    const params = new URLSearchParams();
    if (result.seq != null) {
      params.set("seq", String(result.seq));
    }
    const query = params.toString();
    return `/chat/${result.conversation_id}${query ? `?${query}` : ""}`;
  }
  if (result.type === "conversations" || result.type === "groups") {
    return `/chat/${result.id}`;
  }
  if (result.type === "people") {
    return `/chat?user=${result.id}`;
  }
  if (result.type === "files" && result.conversation_id) {
    return `/chat/${result.conversation_id}`;
  }
  return null;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("messages");
  const deferredQuery = useDeferredValue(query.trim());
  const search = useGlobalSearch(
    deferredQuery
      ? {
          q: deferredQuery,
          type,
          limit: 50,
        }
      : null,
  );

  const results = search.data?.results ?? [];
  const grouped = useMemo(() => {
    const map = new Map<SearchType, SearchResultItem[]>();
    for (const row of results) {
      const bucket = map.get(row.type) ?? [];
      bucket.push(row);
      map.set(row.type, bucket);
    }
    return map;
  }, [results]);

  const openResult = (result: SearchResultItem) => {
    const href = resultHref(result);
    if (!href) {
      return;
    }
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-border border-b px-4 py-3">
          <DialogTitle>Search communication</DialogTitle>
        </DialogHeader>
        <div className="border-border border-b px-4 py-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages, people, files…"
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <Tabs value={type} onValueChange={(value) => setType(value as SearchType)} className="gap-0">
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent px-4 py-2">
            {SEARCH_TYPES.map((entry) => (
              <TabsTrigger key={entry.value} value={entry.value} className="text-xs">
                {entry.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {SEARCH_TYPES.map((entry) => (
            <TabsContent key={entry.value} value={entry.value} className="mt-0">
              <ResultList
                loading={search.isFetching && deferredQuery.length > 0}
                emptyQuery={deferredQuery.length === 0}
                results={grouped.get(entry.value) ?? []}
                onSelect={openResult}
              />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ResultList({
  loading,
  emptyQuery,
  results,
  onSelect,
}: {
  loading: boolean;
  emptyQuery: boolean;
  results: SearchResultItem[];
  onSelect: (result: SearchResultItem) => void;
}) {
  if (emptyQuery) {
    return (
      <p className="text-muted-foreground px-4 py-8 text-sm">
        Type to search across your communication workspace.
      </p>
    );
  }
  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Searching…
      </div>
    );
  }
  if (results.length === 0) {
    return <p className="text-muted-foreground px-4 py-8 text-sm">No results found.</p>;
  }

  return (
    <div className="max-h-80 overflow-y-auto py-2">
      {results.map((result) => {
        const Icon = resultIcon(result.type);
        return (
          <button
            key={`${result.type}-${result.id}`}
            type="button"
            className={cn(
              "hover:bg-muted flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
            )}
            onClick={() => onSelect(result)}
          >
            <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{result.title}</span>
              {result.subtitle ? (
                <span className="text-muted-foreground block truncate text-xs">{result.subtitle}</span>
              ) : null}
              {result.highlight ? (
                <span className="text-muted-foreground mt-1 block text-xs">{result.highlight}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GlobalSearchTrigger({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "ghost" | "default";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button type="button" variant={variant} className={className} onClick={() => setOpen(true)}>
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="bg-muted text-muted-foreground ml-2 hidden rounded px-1.5 py-0.5 text-[10px] md:inline">
          ⌘K
        </kbd>
      </Button>
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
