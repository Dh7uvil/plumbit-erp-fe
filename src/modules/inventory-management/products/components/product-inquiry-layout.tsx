import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function InquirySection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-muted/20 overflow-hidden rounded-lg border", className)}>
      <header className="border-b bg-muted/30 px-4 py-2.5">
        <h3 className="text-xs font-semibold tracking-wide uppercase">{title}</h3>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-xs font-normal normal-case">{description}</p>
        ) : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function InquiryFieldGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {children}
    </dl>
  );
}

export function InquiryField({
  label,
  children,
  className,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className={cn("mt-1 text-sm leading-snug", valueClassName)}>{children}</dd>
    </div>
  );
}

export function InquiryActivityCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-background rounded-md border px-3 py-2.5">
      <p className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="mt-1.5 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function InquiryTableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto rounded-md border bg-background [&_table]:text-sm">{children}</div>
  );
}
