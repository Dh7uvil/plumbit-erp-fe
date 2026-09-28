"use client";

import { useEffect } from "react";

import type { TaskStatus } from "@/modules/task-management/tasks/schemas";
import { isEditableTarget } from "@/shared/lib/keyboard-shortcuts";

export function useBoardShortcuts({
  enabled,
  statuses,
  focusedTaskId,
  onFocusTask,
  onOpenTask,
  onAssignToMe,
  onOpenMenu,
  onClearFocus,
  sheetOpen,
  onCloseSheet,
}: {
  enabled: boolean;
  statuses: TaskStatus[];
  focusedTaskId: string | null;
  onFocusTask: (taskId: string | null) => void;
  onOpenTask: (taskId: string) => void;
  onAssignToMe: (taskId: string) => void;
  onOpenMenu: (taskId: string) => void;
  onClearFocus: () => void;
  sheetOpen: boolean;
  onCloseSheet: () => void;
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "escape") {
        if (sheetOpen) {
          event.preventDefault();
          onCloseSheet();
          return;
        }
        if (focusedTaskId) {
          event.preventDefault();
          onClearFocus();
        }
        return;
      }

      if (!focusedTaskId) {
        return;
      }

      if (key === "enter" || key === "o") {
        event.preventDefault();
        onOpenTask(focusedTaskId);
        return;
      }
      if (key === "i") {
        event.preventDefault();
        onAssignToMe(focusedTaskId);
        return;
      }
      if (key === ".") {
        event.preventDefault();
        onOpenMenu(focusedTaskId);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    focusedTaskId,
    onAssignToMe,
    onClearFocus,
    onCloseSheet,
    onFocusTask,
    onOpenMenu,
    onOpenTask,
    sheetOpen,
    statuses,
  ]);
}
