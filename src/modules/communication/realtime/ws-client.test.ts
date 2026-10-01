import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetWsClientForTests,
  connectRtm,
  getCommunicationPollIntervalMs,
  subscribeConversationChannel,
} from "@/modules/communication/realtime/ws-client";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    });
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}

vi.mock("@/shared/api/client", () => ({
  apiClient: {
    post: vi.fn(async () => ({ ticket: "test-ticket" })),
  },
}));

describe("ws-client", () => {
  beforeEach(() => {
    __resetWsClientForTests();
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
    vi.stubGlobal("window", {
      location: {
        protocol: "http:",
        host: "localhost:3000",
      },
    });
  });

  afterEach(() => {
    __resetWsClientForTests();
    vi.unstubAllGlobals();
  });

  it("connects and queues conversation subscribe", async () => {
    const onEvent = vi.fn();
    const teardown = await connectRtm(onEvent, {
      onConnectionStateChange: vi.fn(),
      onSyncModeChange: vi.fn(),
    });

    await subscribeConversationChannel("t12345678-c22222222-2222-4222-8222-222222222222");
    const ws = MockWebSocket.instances.at(-1);
    expect(ws?.url).toContain("ticket=test-ticket");
    expect(ws?.sent.some((line) => line.includes("subscribe"))).toBe(true);

    await teardown();
  });

  it("uses slower poll interval in live mode", () => {
    expect(getCommunicationPollIntervalMs("live")).toBe(10_000);
    expect(getCommunicationPollIntervalMs("polling")).toBe(3_000);
  });
});
