"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  getMainScrollElement,
  MAIN_CONTENT_ID,
  scrollMainToHash,
} from "@/shared/lib/main-scroll";

export function MainScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    const main = getMainScrollElement();
    if (!main) {
      return;
    }

    function onClick(event: MouseEvent) {
      const scrollRoot = getMainScrollElement();
      if (!scrollRoot) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest<HTMLAnchorElement>(`a[href^="#"]:not([href="#"])`);
      if (!anchor || !scrollRoot.contains(anchor)) {
        return;
      }

      // Skip the skip-link target — scrolling main to itself breaks keyboard nav.
      if (anchor.getAttribute("href") === `#${MAIN_CONTENT_ID}`) {
        return;
      }

      const hash = anchor.getAttribute("href");
      if (!hash) {
        return;
      }

      const id = decodeURIComponent(hash.slice(1));
      const section = document.getElementById(id);
      if (!section || !scrollRoot.contains(section)) {
        return;
      }

      event.preventDefault();
      scrollMainToHash(hash);
      window.history.replaceState(null, "", `${pathname}${hash}`);
    }

    main.addEventListener("click", onClick);
    return () => main.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => {
    scrollMainToHash(window.location.hash, "auto");
  }, [pathname]);

  return null;
}

export { MAIN_CONTENT_ID };
