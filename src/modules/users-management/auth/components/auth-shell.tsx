import { Building, Lock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { ORGANIZATION_NAME } from "@/config/constants";
import {
  AuthBrandMark,
  AuthBrandProvider,
} from "@/modules/users-management/auth/components/auth-brand";

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "Authorized Personnel Only" },
  { icon: Lock, label: "Encrypted Internal Network" },
  { icon: Building, label: ORGANIZATION_NAME },
] as const;

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <AuthBrandProvider>
      <div className="bg-background flex min-h-screen">
        <aside className="bg-primary text-primary-foreground hidden w-[420px] shrink-0 flex-col items-center justify-center p-12 lg:flex">
          <AuthBrandMark />
          <p className="text-primary-foreground/60 mt-2 text-center text-sm">
            Internal Enterprise Resource Planning
            <br />
            &amp; Customer Relationship Management
          </p>
          <ul className="mt-12 flex w-full max-w-xs flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="text-primary-foreground/70 flex items-center gap-3 text-sm"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="text-primary-foreground/80 size-4" aria-hidden="true" />
                </div>
                {label}
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex flex-1 items-center justify-center p-6 md:p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <AuthBrandMark compact />
            </div>
            {children}
          </div>
        </div>
      </div>
    </AuthBrandProvider>
  );
}
