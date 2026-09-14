"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/shared/components/ui/input";

export function ListSearch({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const onChangeRef = useRef(onChange);
  const skipFirst = useRef(true);

  if (value !== prevValue) {
    setPrevValue(value);
    setInput(value);
  }

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      onChangeRef.current(input);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [input]);

  return (
    <div className="relative max-w-md min-w-48 flex-1">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
      <Input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-8 pl-8"
      />
      {input ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-sm p-1"
          onClick={() => setInput("")}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
