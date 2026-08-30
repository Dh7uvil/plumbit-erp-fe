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
    <Link href={href} className={cn("cursor-pointer hover:underline", className)}>
      {children}
    </Link>
  );
}
