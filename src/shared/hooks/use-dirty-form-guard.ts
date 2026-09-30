"use client";

import { useEffect } from "react";

const LEAVE_MESSAGE = "You have unsaved changes. Leave this page?";

function shouldInterceptNavigation(url: URL): boolean {
  if (url.origin !== window.location.origin) {
    return false;
  }
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

export function useDirtyFormGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function onDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      const url = new URL(anchor.href, window.location.href);
      if (!shouldInterceptNavigation(url)) {
        return;
      }
      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function guardHistoryMethod(
      original: History["pushState"] | History["replaceState"],
    ): History["pushState"] | History["replaceState"] {
      return function guardedHistoryMethod(state, title, url) {
        if (typeof url === "string") {
          const nextUrl = new URL(url, window.location.href);
          if (shouldInterceptNavigation(nextUrl) && !window.confirm(LEAVE_MESSAGE)) {
            return;
          }
        }
        return original.call(history, state, title, url);
      };
    }

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);
    history.pushState = guardHistoryMethod(originalPushState) as History["pushState"];
    history.replaceState = guardHistoryMethod(originalReplaceState) as History["replaceState"];

    function onPopState() {
      if (!window.confirm(LEAVE_MESSAGE)) {
        history.pushState(null, "", window.location.href);
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onDocumentClick, true);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [isDirty]);
}
