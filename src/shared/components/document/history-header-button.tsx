"use client";

import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { HISTORY_PAGE_TITLE } from "@/shared/lib/history";

export function HistoryHeaderButton({ href }: { href: string }) {
  return (
    <Button type="button" size="sm" variant="outline" asChild>
      <Link href={href}>{HISTORY_PAGE_TITLE}</Link>
    </Button>
  );
}
