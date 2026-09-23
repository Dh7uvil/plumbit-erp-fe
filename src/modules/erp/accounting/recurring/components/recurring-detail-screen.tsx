"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useGenerateRecurringDraft } from "@/modules/erp/accounting/recurring/mutations";
import { recurringPermissions } from "@/modules/erp/accounting/recurring/permissions";
import { useRecurringTemplate } from "@/modules/erp/accounting/recurring/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, humanizeEnum } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function documentHref(kind: string, id: string): string {
  return kind === "PURCHASE_INVOICE" ? `/purchase-invoices/${id}` : `/sales-invoices/${id}`;
}

export function RecurringDetailScreen({ templateId }: { templateId: string }) {
  const can = useCan();
  const templateQuery = useRecurringTemplate(templateId);
  const generate = useGenerateRecurringDraft();
  const template = templateQuery.data;
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  async function onGenerate() {
    try {
      await generate.mutateAsync(templateId);
      toast.success("Draft created");
      setConfirmGenerate(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (templateQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (templateQuery.isError || !template) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={getErrorMessage(templateQuery.error)}
          onRetry={() => templateQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/recurring">Back to recurring templates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={template.name}
        listHref="/recurring"
        viewHref={`/recurring/${template.id}`}
        canUpdate={false}
        mode="view"
        badges={
          <DocumentStatusBadge
            status={template.status as "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED"}
            labels={{
              ACTIVE: "Active",
              PAUSED: "Paused",
              COMPLETED: "Completed",
              CANCELLED: "Cancelled",
            }}
            variants={{
              ACTIVE: "success",
              PAUSED: "warning",
              COMPLETED: "muted",
              CANCELLED: "destructive",
            }}
          />
        }
        extraActions={
          template.available_actions.includes("generate") && can(recurringPermissions.generate) ? (
            <Button type="button" disabled={generate.isPending} onClick={() => setConfirmGenerate(true)}>
              {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Generate draft
            </Button>
          ) : undefined
        }
      />
      <p className="text-muted-foreground text-sm">
        {template.document_kind === "SALES_INVOICE" ? "Sales invoice" : "Purchase bill"} ·{" "}
        {template.interval > 1
          ? `Every ${template.interval} ${humanizeEnum(template.frequency).toLowerCase()}`
          : humanizeEnum(template.frequency)}{" "}
        · Next run {formatDate(template.next_run_date)}
        {template.end_date ? ` · Ends ${formatDate(template.end_date)}` : ""}. Generated{" "}
        {template.occurrences_generated}
        {template.max_occurrences ? ` of ${template.max_occurrences}` : ""}.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generated drafts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Run date</TableHead>
                <TableHead>Draft</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.generations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <DataTableEmpty
                      title="No drafts yet"
                      message="Generate a draft when this template is due."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                template.generations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.run_date)}</TableCell>
                    <TableCell>
                      {row.document_id ? (
                        <RecordLink href={documentHref(row.document_kind, row.document_id)}>
                          {row.document_number ?? "Open draft"}
                        </RecordLink>
                      ) : (
                        "Pending"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={confirmGenerate}
        title="Generate draft"
        description={`Create the next draft for ${template.name}?`}
        confirmLabel="Generate draft"
        pending={generate.isPending}
        onOpenChange={setConfirmGenerate}
        onConfirm={() => void onGenerate()}
      />
    </div>
  );
}
