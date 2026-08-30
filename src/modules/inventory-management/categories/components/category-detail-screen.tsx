"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CategoryForm } from "@/modules/inventory-management/categories/components/category-form";
import { categoryPermissions } from "@/modules/inventory-management/categories/permissions";
import { useCategory } from "@/modules/inventory-management/categories/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { RecordCode } from "@/shared/components/form/record-code";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function CategoryDetailScreen({
  categoryId,
  mode,
}: {
  categoryId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(categoryPermissions);
  const categoryQuery = useCategory(categoryId);
  const category = categoryQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/categories/${categoryId}`;

  if (categoryQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (categoryQuery.isError || !category) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            categoryQuery.error ? getErrorMessage(categoryQuery.error) : "Category not found"
          }
          onRetry={() => categoryQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/categories">Back to categories</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={category.name}
        code={category.code}
        listHref="/categories"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{isEdit ? "Edit category" : "Category"}</CardTitle>
          <RecordCode entity="Category" code={category.code} />
        </CardHeader>
        <CardContent>
          <CategoryForm
            category={category}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
