"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";

import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { useTasks } from "@/modules/task-management/tasks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";
import { useCan } from "@/shared/providers/session-provider";

export function MyTasksWidget() {
  const can = useCan();
  const enabled = can(taskPermissions.read);
  const tasksQuery = useTasks({
    mine: true,
    page: 1,
    page_size: 1,
    sort_by: "due_at",
    sort_order: "asc",
  });

  if (!enabled) return null;

  const openCount = tasksQuery.data?.meta.total ?? 0;

  return (
    <Link href="/tasks?mine=1" className="block min-w-0">
      <Card className="hover:border-primary/20 h-full min-w-0 overflow-hidden transition-shadow hover:shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">My open tasks</CardTitle>
          <span
            className={cn(
              "bg-info-muted text-info-foreground flex size-8 shrink-0 items-center justify-center rounded-lg",
            )}
          >
            <ListChecks className="size-4" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="min-w-0">
          <p className="text-xl font-semibold break-all tabular-nums sm:text-2xl">{openCount}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
