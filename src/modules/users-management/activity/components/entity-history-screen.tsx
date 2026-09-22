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
import {
  getHistoryResource,
  historyHasApprovals,
  historyPageTitle,
  isHistoryResource,
  type HistoryResource,
} from "@/shared/lib/history";

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
    <EntityHistoryLoaded
      resource={resource}
      entityType={spec.entityType}
      id={id}
      viewHref={viewHref}
      code={code}
    />
  );
}

function EntityHistoryLoaded({
  resource,
  entityType,
  id,
  viewHref,
  code,
}: {
  resource: HistoryResource;
  entityType: string;
  id: string;
  viewHref: string;
  code: string | null;
}) {
  const activityQuery = useEntityActivity(entityType, id, undefined, { pageSize: MAX_PAGE_SIZE });
  const [tab, setTab] = useState("edits");
  const [editFilter, setEditFilter] = useState<EditHistoryFilter>("all");
  const rows = activityQuery.data?.data ?? [];
  const showApprovals = historyHasApprovals(resource);
  const pageTitle = historyPageTitle(resource);
  const approvals = filterHistoryRows(rows, "approvals");
  const edits = filterHistoryRows(rows, "edits", editFilter);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={pageTitle}
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
        showApprovals ? (
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
                <EditHistoryFilterMenu value={editFilter} onChange={setEditFilter} />
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
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-end border-b pb-3">
              <EditHistoryFilterMenu value={editFilter} onChange={setEditFilter} />
            </div>
            <ActivityTimeline
              rows={edits}
              emptyTitle="No edit history"
              emptyMessage="Changes and file uploads for this record will appear here."
            />
          </div>
        )
      ) : null}
    </div>
  );
}

function EditHistoryFilterMenu({
  value,
  onChange,
}: {
  value: EditHistoryFilter;
  onChange: (value: EditHistoryFilter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ListFilter />
          {EDIT_FILTER_LABELS[value]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as EditHistoryFilter)}
        >
          <DropdownMenuRadioItem value="all">All Activity</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="edit">Edits</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="attachment">Attachments</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
