import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function RecordLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      data-slot="record-link"
      className={cn("inline-block max-w-64 truncate align-bottom hover:underline", className)}
    >
      {children}
    </Link>
  );
}
