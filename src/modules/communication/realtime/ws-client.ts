"use client";

import { publicEnv } from "@/config/env.public";
import { parseRealtimeEvent, type RealtimeEvent } from "@/modules/communication/realtime/event-schemas";
import { apiClient } from "@/shared/api/client";

type MessageHandler = (event: RealtimeEvent) => void;

export type RtmSyncMode = "connecting" | "live" | "polling";

type ConnectOptions = {
  onConnectionStateChange?: (connected: boolean) => void;
  onSyncModeChange?: (mode: RtmSyncMode) => void;
  onReconnected?: () => void;
};

let socket: WebSocket | null = null;
let activeOnEvent: MessageHandler | null = null;
let activeConnect: (() => Promise<() => void>) | null = null;
let activeSyncModeChange: ((mode: RtmSyncMode) => void) | null = null;
let activeReconnected: (() => void) | null = null;
let currentSyncMode: RtmSyncMode = "connecting";
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let intentionalDisconnect = false;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let watchdogTimer: ReturnType<typeof setInterval> | null = null;
let lastActivityAt = 0;
const subscribedChannels = new Set<string>();
const pendingConversationChannels = new Set<string>();

const MAX_RECONNECT_ATTEMPTS = 8;
const PING_INTERVAL_MS = 25_000;
const WATCHDOG_MS = 5_000;
const STALE_CONNECTION_MS = 45_000;

function setSyncMode(mode: RtmSyncMode) {
  currentSyncMode = mode;
  activeSyncModeChange?.(mode);
}

function wsBaseUrl(): string {
  if (publicEnv.NEXT_PUBLIC_REALTIME_WS_URL) {
    return publicEnv.NEXT_PUBLIC_REALTIME_WS_URL.replace(/\/$/, "");
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/v1/communication/ws`;
}

async function mintWsTicket(): Promise<string> {
  const data = await apiClient.post<{ ticket: string }>("/communication/ws/ticket", {});
  if (!data?.ticket) {
    throw new Error("Missing WebSocket ticket");
  }
  return data.ticket;
}

function clearTimers() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

function markActivity() {
  lastActivityAt = Date.now();
}

function flushPendingSubscriptions() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  for (const channel of pendingConversationChannels) {
    if (subscribedChannels.has(channel)) {
      continue;
    }
    socket.send(JSON.stringify({ op: "subscribe", channel }));
    subscribedChannels.add(channel);
  }
}

function startWatchdog() {
  if (watchdogTimer) {
    return;
  }
  watchdogTimer = setInterval(() => {
    if (currentSyncMode !== "live" || !socket) {
      return;
    }
    if (Date.now() - lastActivityAt > STALE_CONNECTION_MS) {
      socket.close();
    }
  }, WATCHDOG_MS);
}

async function connectInternal(
  onEvent: MessageHandler,
  options: ConnectOptions,
): Promise<() => void> {
  intentionalDisconnect = false;
  activeOnEvent = onEvent;
  activeSyncModeChange = options.onSyncModeChange ?? null;
  activeReconnected = options.onReconnected ?? null;
  setSyncMode("connecting");
  options.onConnectionStateChange?.(false);

  const ticket = await mintWsTicket();
  const url = `${wsBaseUrl()}?ticket=${encodeURIComponent(ticket)}`;
  const ws = new WebSocket(url);
  socket = ws;

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("WebSocket connection failed"));
  });

  markActivity();
  setSyncMode("live");
  options.onConnectionStateChange?.(true);
  reconnectAttempt = 0;
  activeReconnected?.();

  ws.onmessage = (messageEvent) => {
    markActivity();
    try {
      const frame = JSON.parse(String(messageEvent.data)) as {
        op?: string;
        event?: unknown;
      };
      if (frame.op === "pong") {
        return;
      }
      if (frame.op === "event" && frame.event) {
        const event = parseRealtimeEvent(JSON.stringify(frame.event));
        if (event) {
          onEvent(event);
        }
      }
    } catch {
      // ignore malformed frames
    }
  };

  ws.onclose = () => {
    subscribedChannels.clear();
    if (socket === ws) {
      socket = null;
    }
    setSyncMode("connecting");
    options.onConnectionStateChange?.(false);
    if (!intentionalDisconnect && activeOnEvent && activeConnect) {
      scheduleRtmReconnect(activeOnEvent, activeConnect);
    }
  };

  pingTimer = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ op: "ping" }));
    }
  }, PING_INTERVAL_MS);

  startWatchdog();
  flushPendingSubscriptions();

  return async () => {
    intentionalDisconnect = true;
    clearTimers();
    subscribedChannels.clear();
    pendingConversationChannels.clear();
    if (socket === ws) {
      socket.close();
      socket = null;
    }
    setSyncMode("connecting");
    options.onConnectionStateChange?.(false);
  };
}

export async function connectRtm(
  onEvent: MessageHandler,
  options: ConnectOptions = {},
): Promise<() => void> {
  activeConnect = () => connectInternal(onEvent, options);
  try {
    return await activeConnect();
  } catch {
    setSyncMode("polling");
    if (activeOnEvent && activeConnect) {
      scheduleRtmReconnect(activeOnEvent, activeConnect);
    }
    return () => undefined;
  }
}

export async function subscribeConversationChannel(channelName: string): Promise<void> {
  pendingConversationChannels.add(channelName);
  if (currentSyncMode !== "live" || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }
  if (subscribedChannels.has(channelName)) {
    return;
  }
  socket.send(JSON.stringify({ op: "subscribe", channel: channelName }));
  subscribedChannels.add(channelName);
}

export async function resubscribePendingChannels(): Promise<void> {
  flushPendingSubscriptions();
}

export function getCommunicationPollIntervalMs(mode: RtmSyncMode): number | false {
  return mode === "live" ? 10_000 : 3_000;
}

export function nudgeRtmReconnect(): void {
  if (intentionalDisconnect || !activeOnEvent || !activeConnect) {
    return;
  }
  if (currentSyncMode === "live" && socket?.readyState === WebSocket.OPEN) {
    void resubscribePendingChannels();
    return;
  }
  scheduleRtmReconnect(activeOnEvent, activeConnect);
}

export async function unsubscribeConversationChannel(channelName: string): Promise<void> {
  pendingConversationChannels.delete(channelName);
  subscribedChannels.delete(channelName);
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ op: "unsubscribe", channel: channelName }));
  }
}

export function clearCommunicationSessionStorage(): void {
  // WebSocket transport does not use sessionStorage token caches.
}

export function sendTypingOverSocket(conversationId: string, isTyping: boolean): boolean {
  if (currentSyncMode !== "live" || !socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }
  socket.send(
    JSON.stringify({
      op: "typing",
      conversation_id: conversationId,
      is_typing: isTyping,
    }),
  );
  return true;
}

export function scheduleRtmReconnect(
  _onEvent: MessageHandler,
  connect: () => Promise<() => void>,
) {
  if (reconnectTimer || intentionalDisconnect) {
    return;
  }
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    setSyncMode("polling");
    return;
  }
  const delay = Math.min(10_000, 500 * 2 ** reconnectAttempt);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connect().catch(() => {
      scheduleRtmReconnect(_onEvent, connect);
    });
  }, delay);
}

/** @internal Test helper */
export function __resetWsClientForTests(): void {
  intentionalDisconnect = true;
  clearTimers();
  subscribedChannels.clear();
  pendingConversationChannels.clear();
  if (socket) {
    socket.close();
    socket = null;
  }
  currentSyncMode = "connecting";
  reconnectAttempt = 0;
  activeOnEvent = null;
  activeConnect = null;
  activeSyncModeChange = null;
  activeReconnected = null;
}
