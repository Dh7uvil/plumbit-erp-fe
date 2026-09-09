import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "@/config/env";

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number;
};

export function cookieSecureForRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  if (forwarded === "https") {
    return true;
  }
  if (forwarded === "http") {
    return false;
  }
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return env.AUTH_COOKIE_SECURE;
  }
}

function cookieOptions(request: Request, maxAge?: number) {
  return {
    httpOnly: true,
    secure: cookieSecureForRequest(request),
    sameSite: env.AUTH_COOKIE_SAMESITE,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  } as const;
}

export function applyTokenCookies(
  response: NextResponse,
  tokens: TokenPair,
  remember: boolean,
  request: Request,
): void {
  const refreshMaxAge = remember ? env.AUTH_REFRESH_MAX_AGE_SECONDS : undefined;

  response.cookies.set(
    env.AUTH_ACCESS_COOKIE,
    tokens.access_token,
    cookieOptions(request, tokens.expires_in),
  );
  response.cookies.set(
    env.AUTH_REFRESH_COOKIE,
    tokens.refresh_token,
    cookieOptions(request, refreshMaxAge),
  );
  response.cookies.set(
    env.AUTH_REMEMBER_COOKIE,
    remember ? "1" : "0",
    cookieOptions(request, refreshMaxAge),
  );
}

export function clearTokenCookies(response: NextResponse, request: Request): void {
  response.cookies.set(env.AUTH_ACCESS_COOKIE, "", cookieOptions(request, 0));
  response.cookies.set(env.AUTH_REFRESH_COOKIE, "", cookieOptions(request, 0));
  response.cookies.set(env.AUTH_REMEMBER_COOKIE, "", cookieOptions(request, 0));
}

export async function readRememberFlag(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(env.AUTH_REMEMBER_COOKIE)?.value === "1";
}

export async function readRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(env.AUTH_REFRESH_COOKIE)?.value;
}

export async function readAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(env.AUTH_ACCESS_COOKIE)?.value;
}
