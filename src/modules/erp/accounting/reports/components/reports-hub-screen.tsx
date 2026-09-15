"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { visibleReportCatalog } from "@/config/report-catalog";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";
import { useSession } from "@/shared/providers/session-provider";

const SECTION_ICON_CLASS: Record<string, string> = {
  "Financial reports": "bg-primary/10 text-primary",
  "Receivables & payables": "bg-warning-muted text-warning-foreground",
  "Tax reports": "bg-info-muted text-info-foreground",
  "Inventory reports": "bg-success-muted text-success-foreground",
  "Operations reports": "bg-secondary text-secondary-foreground",
};

export function ReportsHubScreen() {
  const { permissions } = useSession();
  const groups = visibleReportCatalog(permissions);

  if (groups.length === 0) {
    return (
      <EmptyState title="Reports unavailable" message="You do not have access to any reports." />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title="Reports" subtitle="Open a report from a section below." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <Card
              key={group.label}
              className="hover:border-primary/20 h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3 [.border-b]:pb-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md",
                      SECTION_ICON_CLASS[group.label] ?? "bg-primary/10 text-primary",
                    )}
                  >
                    <GroupIcon className="size-3.5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-sm leading-tight font-semibold tracking-tight">
                    {group.label}
                  </CardTitle>
                </div>
                <Badge variant="muted" className="px-2.5 py-1 text-sm font-semibold tabular-nums">
                  {group.items.length}
                </Badge>
              </CardHeader>
              <CardContent className="px-3 pt-2 pb-3">
                <ul className="flex flex-col">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="group/item hover:bg-muted/80 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors"
                        >
                          <span className="bg-muted text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary flex size-7 shrink-0 items-center justify-center rounded-md transition-colors">
                            <ItemIcon className="size-3.5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                          <ChevronRight
                            className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
