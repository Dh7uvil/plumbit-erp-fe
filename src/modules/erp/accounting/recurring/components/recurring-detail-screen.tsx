"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useGenerateRecurringDraft } from "@/modules/erp/accounting/recurring/mutations";
import { recurringPermissions } from "@/modules/erp/accounting/recurring/permissions";
import { useRecurringTemplate } from "@/modules/erp/accounting/recurring/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useCan } from "@/shared/providers/session-provider";

function documentHref(kind: string, id: string): string {
  return kind === "PURCHASE_INVOICE" ? `/purchase-invoices/${id}` : `/sales-invoices/${id}`;
}

export function RecurringDetailScreen({ templateId }: { templateId: string }) {
  const can = useCan();
  const templateQuery = useRecurringTemplate(templateId);
  const generate = useGenerateRecurringDraft();
  const template = templateQuery.data;

  async function onGenerate() {
    try {
      await generate.mutateAsync(templateId);
      toast.success("Draft created");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (templateQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (templateQuery.isError || !template) {
    return (
      <DataTableError
        message={getErrorMessage(templateQuery.error)}
        onRetry={() => templateQuery.refetch()}
      />
    );
  }

  return (
    <ListPage>
      <PageHeader
        title={template.name}
        subtitle={`${template.document_kind === "SALES_INVOICE" ? "Sales invoice" : "Purchase bill"} · ${template.frequency} · ${template.status}`}
        actions={
          template.available_actions.includes("generate") && can(recurringPermissions.generate) ? (
            <Button type="button" disabled={generate.isPending} onClick={() => void onGenerate()}>
              {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Generate draft
            </Button>
          ) : undefined
        }
      />
      <p className="text-muted-foreground text-sm">
        Next run {template.next_run_date}. Generated {template.occurrences_generated}
        {template.max_occurrences ? ` of ${template.max_occurrences}` : ""}.
      </p>
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
                <TableCell>{row.run_date}</TableCell>
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
    </ListPage>
  );
}
