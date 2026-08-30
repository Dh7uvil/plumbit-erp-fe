"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { TermsTemplateForm } from "@/modules/erp/accounting/terms-templates/components/terms-template-form";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import { useTermsTemplate } from "@/modules/erp/accounting/terms-templates/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function TermsTemplateDetailScreen({
  templateId,
  mode,
}: {
  templateId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(termsTemplatePermissions);
  const templateQuery = useTermsTemplate(templateId);
  const template = templateQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/terms-templates/${templateId}`;

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
          message={
            templateQuery.error ? getErrorMessage(templateQuery.error) : "Terms template not found"
          }
          onRetry={() => templateQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/terms-templates">Back to terms templates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={template.name}
        listHref="/terms-templates"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit terms template" : "Terms template"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TermsTemplateForm
            template={template}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
