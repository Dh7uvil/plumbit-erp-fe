"use client";

import { ChevronRight, Columns3, GripVertical, Lock } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  columnPickerDraft,
  type ColumnPickerItem,
  type ColumnPreferencePatch,
  type DataTableColumn,
  type TableColumnPreference,
} from "@/shared/components/data-table/columns";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Switch } from "@/shared/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

function patchFrom(items: ColumnPickerItem[]): ColumnPreferencePatch {
  return {
    visible_columns: items.filter((item) => item.visible).map((item) => item.id),
    column_order: items.map((item) => item.id),
  };
}

function moveItem(items: ColumnPickerItem[], fromId: string, toId: string): ColumnPickerItem[] {
  if (fromId === toId) {
    return items;
  }
  const from = items.findIndex((item) => item.id === fromId);
  const to = items.findIndex((item) => item.id === toId);
  if (from < 0 || to < 0) {
    return items;
  }
  if (items[from]?.pinned || items[to]?.pinned) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ColumnsDialog<T>({
  columns,
  preference,
  pending = false,
  onApply,
  onReset,
}: {
  columns: readonly DataTableColumn<T>[];
  preference: TableColumnPreference | null;
  pending?: boolean;
  onApply: (next: ColumnPreferencePatch) => Promise<void> | void;
  onReset: () => Promise<void> | void;
}) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ColumnPickerItem[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const customized = Boolean(preference && !preference.is_default);

  const visibleItems = useMemo(
    () => draft.filter((item) => !item.extra || item.visible || showExtras),
    [draft, showExtras],
  );
  const hiddenExtraCount = draft.filter((item) => item.extra && !item.visible).length;

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(columnPickerDraft(columns, preference));
      setShowExtras(false);
    }
    setOpen(next);
  }

  async function persist(next: ColumnPickerItem[]) {
    if (next.every((item) => !item.visible)) {
      toast.error("Keep at least one column visible.");
      return;
    }
    setDraft(next);
    try {
      await onApply(patchFrom(next));
    } catch {
      setDraft(columnPickerDraft(columns, preference));
    }
  }

  async function reset() {
    try {
      await onReset();
      setDraft(columnPickerDraft(columns, null));
      setShowExtras(false);
    } catch {
      // Toast is handled by the caller.
    }
  }

  return (
    <div className="ml-auto order-last shrink-0">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                id={triggerId}
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Customize columns"
                aria-pressed={open}
                className={cn(
                  "bg-background",
                  (open || customized) && "border-primary text-primary",
                )}
              >
                <Columns3 className="size-3.5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Customize columns</TooltipContent>
        </Tooltip>
        <PopoverContent
          align="end"
          className="w-80 p-0"
          onPointerDownOutside={(event) => {
            if (draggingId) {
              event.preventDefault();
            }
          }}
        >
          <div className="px-3 py-2.5">
            <p className="text-sm font-medium">Customize list view</p>
          </div>
          <ul className="max-h-80 overflow-y-auto px-1 pb-1">
            {visibleItems.map((item) => (
              <li
                key={item.id}
                onDragOver={(event) => {
                  if (item.pinned) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (item.pinned) {
                    return;
                  }
                  const fromId = event.dataTransfer.getData("text/plain") || draggingId;
                  if (!fromId) {
                    return;
                  }
                  void persist(moveItem(draft, fromId, item.id));
                  setDraggingId(null);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5",
                  draggingId === item.id && "bg-muted",
                )}
              >
                {item.pinned ? (
                  <span
                    className="text-muted-foreground inline-flex shrink-0"
                    title="Always visible"
                  >
                    <Lock className="size-4" />
                  </span>
                ) : (
                  <span
                    draggable
                    className="text-muted-foreground inline-flex shrink-0 cursor-grab active:cursor-grabbing"
                    aria-hidden="true"
                    onDragStart={(event) => {
                      setDraggingId(item.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", item.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                  >
                    <GripVertical className="size-4" />
                  </span>
                )}
                <span className="min-w-0 flex-1 text-sm leading-5 break-words whitespace-normal">
                  {item.header}
                </span>
                {item.pinned ? null : (
                  <div
                    className="shrink-0"
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <Switch
                      checked={item.visible}
                      disabled={pending}
                      aria-label={`Show ${item.header} column`}
                      onCheckedChange={(checked) => {
                        void persist(
                          draft.map((entry) =>
                            entry.id === item.id ? { ...entry, visible: checked } : entry,
                          ),
                        );
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
            {!showExtras && hiddenExtraCount > 0 ? (
              <li className="px-2 py-1">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                  onClick={() => setShowExtras(true)}
                >
                  <ChevronRight className="size-3.5" />
                  Show {hiddenExtraCount} more
                </button>
              </li>
            ) : null}
          </ul>
          {customized ? (
            <div className="border-t px-2 py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                disabled={pending}
                onClick={() => void reset()}
              >
                Reset to default
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
