"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function ListSearch({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const searchId = useId();
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
    <div className="flex max-w-md min-w-48 flex-1 flex-col gap-1">
      <Label htmlFor={searchId} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          id={searchId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
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
    </div>
  );
}
