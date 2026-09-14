"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  clickLabeledPageAction,
  focusSidebarSearch,
  hasModifier,
  isEditableTarget,
} from "@/shared/lib/keyboard-shortcuts";

export function AppKeyboardShortcuts({
  searchOpen,
  onSearchOpenChange,
  helpOpen,
  onHelpOpenChange,
  onToggleSidebar,
}: {
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  helpOpen: boolean;
  onHelpOpenChange: (open: boolean) => void;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = isEditableTarget(event.target);
      const mod = hasModifier(event);
      const key = event.key;

      if (mod && key.toLowerCase() === "k") {
        event.preventDefault();
        onSearchOpenChange(!searchOpen);
        return;
      }

      if (mod && key === "/") {
        event.preventDefault();
        onHelpOpenChange(!helpOpen);
        return;
      }

      if (mod && key === "[") {
        event.preventDefault();
        if (!searchOpen && !helpOpen) {
          router.back();
        }
        return;
      }

      if (mod && key === "]") {
        event.preventDefault();
        if (!searchOpen && !helpOpen) {
          router.forward();
        }
        return;
      }

      if (mod && key.toLowerCase() === "b") {
        event.preventDefault();
        onToggleSidebar();
        return;
      }

      if (key === "Escape") {
        if (searchOpen) {
          event.preventDefault();
          onSearchOpenChange(false);
        }
        return;
      }

      if (typing || searchOpen || helpOpen || event.metaKey || event.ctrlKey) {
        return;
      }

      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      if (event.altKey && key === "ArrowLeft") {
        event.preventDefault();
        router.back();
        return;
      }

      if (event.altKey && key === "ArrowRight") {
        event.preventDefault();
        router.forward();
        return;
      }

      if (key === "?") {
        event.preventDefault();
        onHelpOpenChange(true);
        return;
      }

      if (key === "/" && !event.shiftKey) {
        event.preventDefault();
        focusSidebarSearch();
        return;
      }

      if (event.altKey || event.shiftKey) {
        return;
      }

      if (key.toLowerCase() === "n") {
        if (clickLabeledPageAction(/^new\b/i)) {
          event.preventDefault();
        }
        return;
      }

      if (key.toLowerCase() === "e") {
        if (clickLabeledPageAction(/^edit\b/i)) {
          event.preventDefault();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    helpOpen,
    onHelpOpenChange,
    onSearchOpenChange,
    onToggleSidebar,
    router,
    searchOpen,
  ]);

  return null;
}
