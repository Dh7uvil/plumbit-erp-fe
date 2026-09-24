"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import {
  getMainBottomInset,
  getMainScrollElement,
} from "@/shared/lib/main-scroll";
import { cn } from "@/shared/lib/cn";

export const LIST_TABLE_PANEL_CLASS = "list-table-panel";

const MIN_PANEL_HEIGHT_PX = 120;

function measurePanelMaxHeight(node: HTMLElement): number {
  const top = node.getBoundingClientRect().top;
  const main = getMainScrollElement();

  let available: number;
  if (main?.contains(node)) {
    available = main.getBoundingClientRect().bottom - top - getMainBottomInset(main);
  } else {
    available = window.innerHeight - top - 16 - 8;
  }

  if (available <= 0) {
    return MIN_PANEL_HEIGHT_PX;
  }

  return available;
}

export function DataTablePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    function update() {
      const current = ref.current;
      if (!current) {
        return;
      }
      setMaxHeight(measurePanelMaxHeight(current));
    }

    update();

    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    observer.observe(node);

    const main = getMainScrollElement();
    if (main) {
      observer.observe(main);
      main.addEventListener("scroll", update, { passive: true });
    }

    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      main?.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(LIST_TABLE_PANEL_CLASS, className)}
      style={maxHeight === undefined ? undefined : { maxHeight }}
    >
      {children}
    </div>
  );
}
