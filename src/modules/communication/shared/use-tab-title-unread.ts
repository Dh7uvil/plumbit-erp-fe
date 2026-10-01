"use client";

import { useEffect, useRef } from "react";

import { useUnreadSummary } from "@/modules/communication/conversations/queries";

const DEFAULT_TITLE = "Plumbit ERP";

export function useTabTitleUnread(baseTitle = DEFAULT_TITLE) {
  const { data } = useUnreadSummary();
  const originalTitleRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (originalTitleRef.current == null) {
      originalTitleRef.current = document.title || baseTitle;
    }

    const unread = data?.total_unread ?? 0;
    const title = originalTitleRef.current;

    document.title = unread > 0 ? `(${unread}) ${title}` : title;

    return () => {
      document.title = originalTitleRef.current ?? baseTitle;
    };
  }, [baseTitle, data?.total_unread]);
}
