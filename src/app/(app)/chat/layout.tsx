"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/cn";

function isConversationShellRoute(pathname: string): boolean {
  if (pathname === "/chat/settings") {
    return false;
  }
  return pathname === "/chat" || pathname.startsWith("/chat/");
}

/** Chat thread routes fill the app main column via flex (see AppShell full-height routes). */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const conversationShell = isConversationShellRoute(pathname);

  return (
    <div
      className={cn(
        "flex flex-col",
        conversationShell ? "min-h-0 flex-1 overflow-hidden" : "min-h-min",
      )}
    >
      {children}
    </div>
  );
}
