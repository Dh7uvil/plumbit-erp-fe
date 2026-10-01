"use client";

import { useEffect, useState } from "react";

const CHANNEL_NAME = "plumbit-call-lock";
const ELECTION_MS = 50;

function getTabId(): string {
  if (typeof window === "undefined") {
    return "server";
  }
  const key = "plumbit-call-tab-id";
  const existing = window.sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

/** Lowest tab id wins — only that tab should show the incoming-call dialog. */
export function useCallDialogLock(): boolean {
  const [isLeader, setIsLeader] = useState(true);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }
    const myTabId = getTabId();
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const candidates = new Set<string>([myTabId]);

    const onMessage = (event: MessageEvent<{ type?: string; tabId?: string }>) => {
      if (event.data?.type === "hello" && event.data.tabId) {
        candidates.add(event.data.tabId);
      }
    };

    channel.addEventListener("message", onMessage);
    channel.postMessage({ type: "hello", tabId: myTabId });

    const timer = window.setTimeout(() => {
      const winner = [...candidates].sort()[0];
      setIsLeader(winner === myTabId);
    }, ELECTION_MS);

    return () => {
      window.clearTimeout(timer);
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, []);

  return isLeader;
}

export function broadcastCallLockDismiss(callId: string): void {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "dismiss", callId });
  channel.close();
}
