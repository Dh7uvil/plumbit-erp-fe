"use client";

import { useEffect, useState } from "react";

import { getMainScrollElement } from "@/shared/lib/main-scroll";

export function DocsReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const main = getMainScrollElement();
    if (!main) {
      return;
    }

    function onScroll() {
      const scrollRoot = getMainScrollElement();
      if (!scrollRoot) {
        return;
      }
      const max = scrollRoot.scrollHeight - scrollRoot.clientHeight;
      setProgress(max > 0 ? Math.min(100, (scrollRoot.scrollTop / max) * 100) : 0);
    }

    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      main.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (progress <= 0) {
    return null;
  }

  return (
    <div
      className="bg-muted/80 fixed inset-x-0 top-0 z-30 h-0.5 backdrop-blur-sm lg:start-[calc(var(--sidebar-width,0px)+1rem)]"
      aria-hidden="true"
    >
      <div
        className="from-primary to-primary/70 h-full bg-gradient-to-r transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
