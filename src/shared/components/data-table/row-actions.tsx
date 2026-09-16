"use client";

import { Edit2, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

export function hasRowActions(...flags: Array<unknown>): boolean {
  return flags.some(Boolean);
}

export function tableHeaders<T extends string>(
  columns: readonly T[],
  showActions: boolean,
): readonly string[] {
  return showActions ? [...columns, "Actions"] : columns;
}

export function TableActionTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function wrapLabeledActions(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) {
      return child;
    }
    if (child.type === Fragment) {
      return wrapLabeledActions((child.props as { children?: ReactNode }).children);
    }
    if (child.type === TableActionTooltip) {
      return child;
    }
    const props = child.props as { "aria-label"?: string; title?: string };
    const label = props["aria-label"] ?? props.title;
    if (!label) {
      return child;
    }
    return (
      <TableActionTooltip label={label}>
        {cloneElement(child as ReactElement<Record<string, unknown>>, { title: undefined })}
      </TableActionTooltip>
    );
  });
}

function actionLabel(verb: string, entityName?: string | null) {
  const trimmed = entityName?.trim();
  return trimmed ? `${verb} ${trimmed}` : verb;
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
  entityName?: string | null;
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

  const viewLabel = actionLabel("View", entityName);
  const editLabel = actionLabel("Edit", entityName);
  const deleteLabel = actionLabel("Delete", entityName);

  const viewButton = viewHref ? (
    <TableActionTooltip label={viewLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={viewLabel} asChild>
        <Link href={viewHref}>
          <Eye className="size-3.5" />
        </Link>
      </Button>
    </TableActionTooltip>
  ) : onView ? (
    <TableActionTooltip label={viewLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={viewLabel} onClick={onView}>
        <Eye className="size-3.5" />
      </Button>
    </TableActionTooltip>
  ) : null;

  const editButton = editHref ? (
    <TableActionTooltip label={editLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={editLabel} asChild>
        <Link href={editHref}>
          <Edit2 className="size-3.5" />
        </Link>
      </Button>
    </TableActionTooltip>
  ) : onEdit ? (
    <TableActionTooltip label={editLabel}>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={editLabel} onClick={onEdit}>
        <Edit2 className="size-3.5" />
      </Button>
    </TableActionTooltip>
  ) : null;

  return (
    <div className="flex gap-0.5">
      {viewButton}
      {editButton}
      {wrapLabeledActions(extra)}
      {onDelete ? (
        <TableActionTooltip label={deleteLabel}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label={deleteLabel}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TableActionTooltip>
      ) : null}
    </div>
  );
}
