"use client";

import { Search } from "lucide-react";
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
  const onChangeRef = useRef(onChange);
  const skipFirst = useRef(true);

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
    <div className="relative max-w-xs flex-1">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
      <Input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
