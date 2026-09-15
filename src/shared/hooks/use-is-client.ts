import { useSyncExternalStore } from "react";

let hydrated = false;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  queueMicrotask(() => {
    hydrated = true;
    listeners.forEach((listener) => listener());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  );
}
