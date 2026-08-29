import { NextResponse } from "next/server";

import { MAX_LOGO_BYTES } from "@/config/constants";
import { isLoopbackLogoUrl } from "@/shared/lib/logo-url";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw || !isLoopbackLogoUrl(raw)) {
    return new NextResponse(null, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(raw, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = (upstream.headers.get("content-type") ?? "application/octet-stream")
    .split(";")[0]
    ?.trim()
    .toLowerCase();
  if (
    !contentType ||
    (!contentType.startsWith("image/") && contentType !== "application/octet-stream")
  ) {
    return new NextResponse(null, { status: 415 });
  }

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_LOGO_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
