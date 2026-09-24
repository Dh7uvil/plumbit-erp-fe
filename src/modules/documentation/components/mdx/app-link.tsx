"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { navigation } from "@/config/navigation";
import { can } from "@/shared/auth/permissions";
import { Button } from "@/shared/components/ui/button";
import { useSession } from "@/shared/providers/session-provider";

function permissionForHref(href: string): string | null {
  if (href === "/purchases") {
    return null;
  }
  for (const group of navigation) {
    for (const item of group.items) {
      if (item.href === href) {
        return item.permission;
      }
    }
  }
  return null;
}

export function AppLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { permissions } = useSession();
  const permission = permissionForHref(href);
  const allowed = permission === null || can(permission, permissions);

  if (allowed) {
    return (
      <Button asChild variant="outline" size="sm" className="not-prose my-2">
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  return (
    <span className="not-prose bg-muted/50 text-muted-foreground my-2 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm">
      <Lock className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
      <span className="text-xs">(requires access — ask your administrator)</span>
    </span>
  );
}
