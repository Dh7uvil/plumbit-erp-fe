"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { visibleReportCatalog, type ReportCatalogGroup } from "@/config/report-catalog";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";
import { useSession } from "@/shared/providers/session-provider";

const SECTION_ICON_CLASS: Record<string, string> = {
  "Financial reports": "bg-primary/10 text-primary",
  "Receivables & payables": "bg-warning-muted text-warning-foreground",
  "Tax reports": "bg-info-muted text-info-foreground",
  "Inventory reports": "bg-success-muted text-success-foreground",
  "Operations reports": "bg-secondary text-secondary-foreground",
  "CRM reports": "bg-primary/10 text-primary",
};

function groupPanelId(label: string) {
  return `report-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function ReportGroupTab({
  group,
  isOpen,
  onToggle,
}: {
  group: ReportCatalogGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const GroupIcon = group.icon;
  const panelId = groupPanelId(group.label);

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left shadow-xs transition-colors",
        isOpen
          ? "border-primary bg-primary/5 ring-primary/20 ring-1"
          : "bg-card hover:border-primary/20 hover:bg-muted/40",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            SECTION_ICON_CLASS[group.label] ?? "bg-primary/10 text-primary",
          )}
        >
          <GroupIcon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="text-sm leading-tight font-semibold tracking-tight">{group.label}</span>
      </span>
      <Badge variant="muted" className="px-2.5 py-1 text-sm font-semibold tabular-nums">
        {group.items.length}
      </Badge>
    </button>
  );
}

function ReportGroupPanel({ group }: { group: ReportCatalogGroup }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent id={groupPanelId(group.label)} className="px-3 py-3">
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
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
}

export function ReportsHubScreen() {
  const { permissions } = useSession();
  const groups = visibleReportCatalog(permissions);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const activeGroup = groups.find((group) => group.label === openGroup);

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  if (groups.length === 0) {
    return (
      <EmptyState title="Reports unavailable" message="You do not have access to any reports." />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title="Reports" subtitle="Open a report from a section below." />
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <ReportGroupTab
              key={group.label}
              group={group}
              isOpen={openGroup === group.label}
              onToggle={() => toggleGroup(group.label)}
            />
          ))}
        </div>
        {activeGroup ? <ReportGroupPanel group={activeGroup} /> : null}
      </div>
    </section>
  );
}
