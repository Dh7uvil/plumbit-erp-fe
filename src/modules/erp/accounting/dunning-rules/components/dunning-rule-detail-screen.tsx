"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { DunningRuleForm } from "@/modules/erp/accounting/dunning-rules/components/dunning-rule-form";
import { dunningPermissions } from "@/modules/erp/accounting/dunning-rules/permissions";
import { useDunningRule } from "@/modules/erp/accounting/dunning-rules/queries";
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

export function DunningRuleDetailScreen({
  ruleId,
  mode,
}: {
  ruleId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions({
    ...dunningPermissions,
    update: dunningPermissions.manage,
  });
  const ruleQuery = useDunningRule(ruleId);
  const rule = ruleQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/dunning-rules/${ruleId}`;

  if (ruleQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (ruleQuery.isError || !rule) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={ruleQuery.error ? getErrorMessage(ruleQuery.error) : "Dunning rule not found"}
          onRetry={() => ruleQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/dunning-rules">Back to payment reminders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={rule.name}
        listHref="/dunning-rules"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit rule" : "Dunning rule"}</CardTitle>
        </CardHeader>
        <CardContent>
          <DunningRuleForm rule={rule} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
        </CardContent>
      </Card>
    </div>
  );
}
