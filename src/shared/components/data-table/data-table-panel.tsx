"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export const LIST_TABLE_PANEL_CLASS = "list-table-panel";

const MIN_PANEL_HEIGHT_PX = 120;
/** Extra space below pagination so the footer is not flush with the viewport edge. */
const LIST_TABLE_BOTTOM_INSET_PX = 8;

function getMainBottomInset(main: HTMLElement): number {
  const paddingBottom = Number.parseFloat(getComputedStyle(main).paddingBottom) || 0;
  return paddingBottom + LIST_TABLE_BOTTOM_INSET_PX;
}

function measurePanelMaxHeight(node: HTMLElement): number {
  const top = node.getBoundingClientRect().top;
  const main = document.getElementById("main-content");

  let available: number;
  if (main?.contains(node)) {
    available = main.getBoundingClientRect().bottom - top - getMainBottomInset(main);
  } else {
    available = window.innerHeight - top - 16 - LIST_TABLE_BOTTOM_INSET_PX;
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

    const main = document.getElementById("main-content");
    if (main) {
      observer.observe(main);
    }

    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
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
