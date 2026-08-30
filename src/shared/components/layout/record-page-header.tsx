import Link from "next/link";
import type { ReactNode } from "react";

import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";

export type RecordPageMode = "view" | "edit";

export function RecordPageHeader({
  title,
  subtitle,
  code,
  listHref,
  viewHref,
  editHref,
  canUpdate = false,
  mode,
  extraActions,
}: {
  title: string;
  subtitle?: string;
  code?: string | null;
  listHref: string;
  viewHref: string;
  editHref?: string;
  canUpdate?: boolean;
  mode: RecordPageMode;
  extraActions?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      code={code}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          {mode === "view" && canUpdate && editHref ? (
            <Button type="button" size="sm" asChild>
              <Link href={editHref}>Edit</Link>
            </Button>
          ) : null}
          {mode === "edit" ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={viewHref}>Cancel</Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={listHref}>Back</Link>
            </Button>
          )}
        </div>
      }
    />
  );
}
