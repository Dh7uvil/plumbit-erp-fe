"use client";

import { ChevronLeft, ListFilter } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  filterHistoryRows,
  type EditHistoryFilter,
} from "@/modules/users-management/activity/activity-timeline";
import { ActivityTimeline } from "@/modules/users-management/activity/components/activity-timeline";
import { useEntityActivity } from "@/modules/users-management/activity/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { useSetBreadcrumbRecord } from "@/shared/components/layout/breadcrumb-record";
import { PageHeader } from "@/shared/components/layout/page-header";
import { PageLoadingState } from "@/shared/components/feedback/loading-state";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { MAX_PAGE_SIZE } from "@/config/constants";
import { HISTORY_PAGE_TITLE, getHistoryResource, isHistoryResource } from "@/shared/lib/history";

const EDIT_FILTER_LABELS: Record<EditHistoryFilter, string> = {
  all: "All Activity",
  edit: "Edits",
  attachment: "Attachments",
};

export function EntityHistoryScreen({ resource, id }: { resource: string; id: string }) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const valid = isHistoryResource(resource);
  const spec = valid ? getHistoryResource(resource) : undefined;
  const viewHref = spec ? `${spec.listHref}/${id}` : "/";

  useSetBreadcrumbRecord(code || spec?.label || "Details");

  if (!valid || !spec) {
    return (
      <p className="text-muted-foreground p-6 text-sm">History is not available for this record.</p>
    );
  }

  return (
    <EntityHistoryLoaded entityType={spec.entityType} id={id} viewHref={viewHref} code={code} />
  );
}

function EntityHistoryLoaded({
  entityType,
  id,
  viewHref,
  code,
}: {
  entityType: string;
  id: string;
  viewHref: string;
  code: string | null;
}) {
  const activityQuery = useEntityActivity(entityType, id, undefined, { pageSize: MAX_PAGE_SIZE });
  const [tab, setTab] = useState("edits");
  const [editFilter, setEditFilter] = useState<EditHistoryFilter>("all");
  const rows = activityQuery.data?.data ?? [];
  const approvals = filterHistoryRows(rows, "approvals");
  const edits = filterHistoryRows(rows, "edits", editFilter);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={HISTORY_PAGE_TITLE}
        subtitle={code ?? undefined}
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={viewHref}>
              <ChevronLeft />
              Back
            </Link>
          </Button>
        }
      />
      {activityQuery.isLoading ? <PageLoadingState /> : null}
      {activityQuery.isError ? (
        <DataTableError
          message={
            activityQuery.error ? getErrorMessage(activityQuery.error) : "Unable to load history."
          }
          onRetry={() => activityQuery.refetch()}
        />
      ) : null}
      {!activityQuery.isLoading && !activityQuery.isError ? (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b">
            <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0 sm:w-auto">
              <TabsTrigger
                value="approvals"
                className="data-[state=active]:border-primary rounded-none border-0 border-b-2 border-transparent px-3 py-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Approvals
              </TabsTrigger>
              <TabsTrigger
                value="edits"
                className="data-[state=active]:border-primary rounded-none border-0 border-b-2 border-transparent px-3 py-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Edit History
              </TabsTrigger>
            </TabsList>
            {tab === "edits" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <ListFilter />
                    {EDIT_FILTER_LABELS[editFilter]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={editFilter}
                    onValueChange={(value) => setEditFilter(value as EditHistoryFilter)}
                  >
                    <DropdownMenuRadioItem value="all">All Activity</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="edit">Edits</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="attachment">Attachments</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <TabsContent value="approvals" className="pt-4">
            <ActivityTimeline
              rows={approvals}
              emptyTitle="No approvals"
              emptyMessage="Submit, approve, and reject events will appear here."
            />
          </TabsContent>
          <TabsContent value="edits" className="pt-4">
            <ActivityTimeline
              rows={edits}
              emptyTitle="No edit history"
              emptyMessage="Changes and file uploads for this record will appear here."
            />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
