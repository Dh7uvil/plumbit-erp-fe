import { Building, Lock, ShieldCheck, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { APP_NAME, ORGANIZATION_NAME } from "@/config/constants";

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "Authorized Personnel Only" },
  { icon: Lock, label: "Encrypted Internal Network" },
  { icon: Building, label: ORGANIZATION_NAME },
] as const;

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen">
      <aside className="bg-primary text-primary-foreground hidden w-[420px] shrink-0 flex-col items-center justify-center p-12 lg:flex">
        <div className="mb-8 flex size-14 items-center justify-center rounded-2xl bg-white/15">
          <Zap className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-primary-foreground/60 mt-2 text-center text-sm">
          Internal Enterprise Resource Planning
          <br />
          &amp; Customer Relationship Management
        </p>
        <ul className="mt-12 flex w-full max-w-xs flex-col gap-4">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li key={label} className="text-primary-foreground/70 flex items-center gap-3 text-sm">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="text-primary-foreground/80 size-4" aria-hidden="true" />
              </div>
              {label}
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex flex-1 items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
