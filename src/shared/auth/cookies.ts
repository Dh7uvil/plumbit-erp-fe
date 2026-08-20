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

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: env.AUTH_COOKIE_SAMESITE,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  } as const;
}

export function applyTokenCookies(
  response: NextResponse,
  tokens: TokenPair,
  remember: boolean,
): void {
  const refreshMaxAge = remember ? env.AUTH_REFRESH_MAX_AGE_SECONDS : undefined;

  response.cookies.set(
    env.AUTH_ACCESS_COOKIE,
    tokens.access_token,
    cookieOptions(tokens.expires_in),
  );
  response.cookies.set(env.AUTH_REFRESH_COOKIE, tokens.refresh_token, cookieOptions(refreshMaxAge));
  response.cookies.set(
    env.AUTH_REMEMBER_COOKIE,
    remember ? "1" : "0",
    cookieOptions(refreshMaxAge),
  );
}

export function clearTokenCookies(response: NextResponse): void {
  response.cookies.set(env.AUTH_ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(env.AUTH_REFRESH_COOKIE, "", cookieOptions(0));
  response.cookies.set(env.AUTH_REMEMBER_COOKIE, "", cookieOptions(0));
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
