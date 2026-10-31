import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { env } from "@/config/env";
import { serverRequest } from "@/shared/api/server-client";
import { SessionUserSchema, type SessionUser } from "@/shared/auth/session-schema";

export type { SessionUser } from "@/shared/auth/session-schema";

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(env.AUTH_ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(env.AUTH_REFRESH_COOKIE)?.value;
}

export async function hasSessionCookie(): Promise<boolean> {
  return Boolean((await getAccessToken()) || (await getRefreshToken()));
}

export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }

  try {
    return SessionUserSchema.parse(await serverRequest("/auth/me"));
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
