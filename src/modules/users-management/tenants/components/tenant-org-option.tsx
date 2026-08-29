"use client";

import { useState } from "react";

import { toDisplayLogoUrl } from "@/shared/lib/logo-url";

export function TenantOrgOption({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const showLogo = Boolean(logoUrl) && logoUrl !== brokenSrc;

  return (
    <span className="flex min-w-0 items-center gap-2">
      {showLogo ? (
        // Presigned URLs expire in 1 hour; native img avoids caching an expired query string.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={toDisplayLogoUrl(logoUrl)}
          alt=""
          referrerPolicy="no-referrer"
          className="size-5 shrink-0 rounded-sm object-contain"
          onError={() => {
            if (logoUrl) {
              setBrokenSrc(logoUrl);
            }
          }}
        />
      ) : null}
      <span className="truncate">{name}</span>
    </span>
  );
}
