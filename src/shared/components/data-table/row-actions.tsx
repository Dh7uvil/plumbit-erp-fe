"use client";

import { Edit2, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/shared/components/ui/button";

export function hasRowActions(...flags: Array<unknown>): boolean {
  return flags.some(Boolean);
}

export function tableHeaders<T extends string>(
  columns: readonly T[],
  showActions: boolean,
): readonly string[] {
  return showActions ? [...columns, "Actions"] : columns;
}

export function DataTableRowActions({
  entityName,
  onView,
  viewHref,
  onEdit,
  editHref,
  onDelete,
  extra,
}: {
  entityName: string;
  onView?: () => void;
  viewHref?: string;
  onEdit?: () => void;
  editHref?: string;
  onDelete?: () => void;
  extra?: ReactNode;
}) {
  if (!onView && !viewHref && !onEdit && !editHref && !onDelete && !extra) {
    return null;
  }

  const viewButton = viewHref ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`View ${entityName}`}
      asChild
    >
      <Link href={viewHref}>
        <Eye className="size-3.5" />
      </Link>
    </Button>
  ) : onView ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`View ${entityName}`}
      onClick={onView}
    >
      <Eye className="size-3.5" />
    </Button>
  ) : null;

  const editButton = editHref ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`Edit ${entityName}`}
      asChild
    >
      <Link href={editHref}>
        <Edit2 className="size-3.5" />
      </Link>
    </Button>
  ) : onEdit ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`Edit ${entityName}`}
      onClick={onEdit}
    >
      <Edit2 className="size-3.5" />
    </Button>
  ) : null;

  return (
    <div className="flex gap-0.5">
      {viewButton}
      {editButton}
      {extra}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive size-7"
          aria-label={`Delete ${entityName}`}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
