import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/config/env";
import { isAuthPath, isSafeInternalPath } from "@/shared/lib/redirect";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", crypto.randomUUID());

  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(env.AUTH_ACCESS_COOKIE)?.value;

  if (pathname.startsWith("/api/v1") && accessToken && !requestHeaders.has("authorization")) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const hasSession = Boolean(accessToken);

  if (!hasSession && !isAuthPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    const next = `${pathname}${search}`;
    if (next !== "/" && isSafeInternalPath(next)) {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
