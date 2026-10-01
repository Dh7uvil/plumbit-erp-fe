import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearOutbox,
  enqueuePendingMessage,
  flushOutbox,
  listPendingMessages,
} from "@/modules/communication/reliability/outbox";

const mockStore = new Map<string, IDBRequest>();

function createMockDb() {
  let activeTxComplete: (() => void) | null = null;
  const rows = () =>
    [...mockStore.values()].map((request) => JSON.parse((request as { key: string }).key));
  const finishTx = () => {
    queueMicrotask(() => activeTxComplete?.());
  };
  const objectStore = {
    put: vi.fn((value: { id: string; tenantId: string; userId: string }) => {
      const request = {
        result: undefined,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        key: JSON.stringify(value),
      };
      mockStore.set(value.id, request as unknown as IDBRequest);
      queueMicrotask(() => {
        request.onsuccess?.();
        finishTx();
      });
      return request;
    }),
    get: vi.fn((key: string) => {
      const stored = mockStore.get(key) as { key: string; onsuccess: (() => void) | null } | undefined;
      const request = {
        result: stored ? JSON.parse(stored.key) : undefined,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      queueMicrotask(() => {
        request.onsuccess?.();
        finishTx();
      });
      return request;
    }),
    getAll: vi.fn(() => {
      const request = {
        result: rows(),
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      queueMicrotask(() => {
        request.onsuccess?.();
        finishTx();
      });
      return request;
    }),
    clear: vi.fn(() => {
      mockStore.clear();
      const request = {
        result: undefined,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      queueMicrotask(() => {
        request.onsuccess?.();
        finishTx();
      });
      return request;
    }),
    delete: vi.fn((key: string) => {
      mockStore.delete(key);
      const request = {
        result: undefined,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      queueMicrotask(() => {
        request.onsuccess?.();
        finishTx();
      });
      return request;
    }),
    index: vi.fn(() => ({
      getAll: vi.fn((tenantId: string) => {
        const request = {
          result: rows().filter((row) => row.tenantId === tenantId),
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
        };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      }),
    })),
  };

  return {
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => objectStore),
      get oncomplete() {
        return activeTxComplete;
      },
      set oncomplete(handler: (() => void) | null) {
        activeTxComplete = handler;
      },
      onerror: null as (() => void) | null,
    })),
    objectStoreNames: { contains: vi.fn(() => false) },
    deleteObjectStore: vi.fn(),
    createObjectStore: vi.fn(() => ({
      createIndex: vi.fn(),
    })),
  };
}

describe("message outbox", () => {
  beforeEach(() => {
    mockStore.clear();
    vi.stubGlobal("indexedDB", {
      open: vi.fn(() => {
        const request = {
          result: createMockDb(),
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
        };
        queueMicrotask(() => {
          try {
            request.onupgradeneeded?.({ target: request } as IDBVersionChangeEvent);
          } catch {
            // Ignore upgrade errors in the mock; store methods are stubbed separately.
          }
          request.onsuccess?.();
        });
        return request;
      }),
    });
  });

  it("queues and lists pending messages for the owner user", async () => {
    await enqueuePendingMessage({
      id: "client-1",
      tenantId: "tenant-1",
      userId: "user-a",
      conversationId: "conv-1",
      payload: { body: "hello", kind: "TEXT", client_message_id: "client-1" },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    const pending = await listPendingMessages("tenant-1", "user-a");
    expect(pending).toHaveLength(1);
    expect(pending[0]?.payload.body).toBe("hello");
  });

  it("flushes only the requested conversation without deleting others", async () => {
    await enqueuePendingMessage({
      id: "client-1",
      tenantId: "tenant-1",
      userId: "user-a",
      conversationId: "conv-a",
      payload: { body: "a", kind: "TEXT", client_message_id: "client-1" },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    await enqueuePendingMessage({
      id: "client-2",
      tenantId: "tenant-1",
      userId: "user-a",
      conversationId: "conv-b",
      payload: { body: "b", kind: "TEXT", client_message_id: "client-2" },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    const handler = vi.fn().mockResolvedValue(undefined);
    await flushOutbox("tenant-1", "user-a", "conv-a", handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]?.payload.body).toBe("a");

    const remaining = await listPendingMessages("tenant-1", "user-a");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.conversationId).toBe("conv-b");
  });

  it("only flushes pending messages for the requested user", async () => {
    await enqueuePendingMessage({
      id: "client-a",
      tenantId: "tenant-1",
      userId: "user-a",
      conversationId: "conv-1",
      payload: { body: "from a", kind: "TEXT", client_message_id: "client-a" },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    await enqueuePendingMessage({
      id: "client-b",
      tenantId: "tenant-1",
      userId: "user-b",
      conversationId: "conv-1",
      payload: { body: "from b", kind: "TEXT", client_message_id: "client-b" },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    const handler = vi.fn().mockResolvedValue(undefined);
    await flushOutbox("tenant-1", "user-a", "conv-1", handler);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]?.payload.body).toBe("from a");

    const userB = await listPendingMessages("tenant-1", "user-b");
    expect(userB).toHaveLength(1);
  });

  it("clearOutbox removes all entries", async () => {
    await enqueuePendingMessage({
      id: "client-1",
      tenantId: "tenant-1",
      userId: "user-a",
      conversationId: "conv-1",
      payload: { body: "hello", kind: "TEXT", client_message_id: "client-1" },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    await clearOutbox();
    const pending = await listPendingMessages("tenant-1", "user-a");
    expect(pending).toHaveLength(0);
  });
});
