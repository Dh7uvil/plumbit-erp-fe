import type { MessageCreateRequest } from "@/modules/communication/messages/schemas";

const DB_NAME = "plumbit-communication-outbox";
const DB_VERSION = 2;
const STORE = "pending_messages";

export type PendingMessage = {
  id: string;
  tenantId: string;
  userId: string;
  conversationId: string;
  payload: MessageCreateRequest;
  createdAt: string;
  attempts: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Failed to open outbox"));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE);
      }
      const store = db.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("tenantId", "tenantId", { unique: false });
      store.createIndex("conversationId", "conversationId", { unique: false });
      store.createIndex("userId", "userId", { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise<T | void>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const request = fn(store);
        tx.oncomplete = () => resolve(request ? (request as IDBRequest<T>).result : undefined);
        tx.onerror = () => reject(tx.error ?? new Error("Outbox transaction failed"));
      }),
  );
}

export async function enqueuePendingMessage(entry: PendingMessage): Promise<void> {
  if (!entry.userId) {
    throw new Error("Pending message requires userId");
  }
  await withStore("readwrite", (store) => store.put(entry));
}

export async function listPendingMessages(
  tenantId: string,
  userId: string,
): Promise<PendingMessage[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const index = store.index("tenantId");
    const request = index.getAll(tenantId);
    request.onsuccess = () => {
      const rows = (request.result as PendingMessage[]) ?? [];
      resolve(rows.filter((row) => row.userId === userId));
    };
    request.onerror = () => reject(request.error ?? new Error("Failed to list pending messages"));
  });
}

export async function removePendingMessage(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function incrementPendingAttempts(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const row = getRequest.result as PendingMessage | undefined;
      if (!row) {
        resolve();
        return;
      }
      store.put({ ...row, attempts: row.attempts + 1 });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to update pending message"));
  });
}

export async function flushOutbox(
  tenantId: string,
  userId: string,
  conversationId: string,
  send: (entry: PendingMessage) => Promise<void>,
): Promise<number> {
  const pending = await listPendingMessages(tenantId, userId);
  const forConversation = pending.filter((entry) => entry.conversationId === conversationId);
  let sent = 0;
  for (const entry of forConversation) {
    try {
      await send(entry);
      await removePendingMessage(entry.id);
      sent += 1;
    } catch {
      await incrementPendingAttempts(entry.id);
    }
  }
  return sent;
}

export async function clearOutbox(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to clear outbox"));
  });
}
