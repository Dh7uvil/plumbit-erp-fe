import type { SessionUser } from "@/shared/auth/session-schema";

export function can(permission: string, granted: readonly string[] = []): boolean {
  return granted.includes(permission);
}

export function hasPermission(session: SessionUser, permission: string): boolean {
  return can(permission, session.permissions);
}
