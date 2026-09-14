const LAST_TENANT_STORAGE_KEY = "pb_last_tenant_id";

export function readLastTenantId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(LAST_TENANT_STORAGE_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

export function writeLastTenantId(tenantId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LAST_TENANT_STORAGE_KEY, tenantId);
  } catch {
    // Ignore quota / private-mode failures; login still works.
  }
}
