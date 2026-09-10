"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type TreeViewNode<T = unknown> = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  children?: TreeViewNode<T>[];
  data?: T;
};

function collectIds(nodes: TreeViewNode[], into: string[] = []): string[] {
  for (const node of nodes) {
    into.push(node.id);
    if (node.children?.length) {
      collectIds(node.children, into);
    }
  }
  return into;
}

function findNode<T>(nodes: TreeViewNode<T>[], id: string): TreeViewNode<T> | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children?.length) {
      const found = findNode(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function parentIdOf<T>(nodes: TreeViewNode<T>[], id: string): string | null {
  for (const node of nodes) {
    if (node.children?.some((child) => child.id === id)) {
      return node.id;
    }
    if (node.children?.length) {
      const nested = parentIdOf(node.children, id);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function TreeView<T = unknown>({
  nodes,
  selectedId,
  onSelect,
  expandedIds,
  onExpandedChange,
  defaultExpanded = true,
  className,
}: {
  nodes: TreeViewNode<T>[];
  selectedId?: string | null;
  onSelect?: (node: TreeViewNode<T>) => void;
  expandedIds?: ReadonlySet<string> | readonly string[];
  onExpandedChange?: (ids: Set<string>) => void;
  defaultExpanded?: boolean;
  className?: string;
}) {
  const treeId = useId();
  const allGroupIds = useMemo(() => {
    const ids: string[] = [];
    function walk(items: TreeViewNode[]) {
      for (const item of items) {
        if (item.children?.length) {
          ids.push(item.id);
          walk(item.children);
        }
      }
    }
    walk(nodes);
    return ids;
  }, [nodes]);
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<Set<string>>(
    () => new Set(defaultExpanded ? allGroupIds : []),
  );
  const expanded = useMemo(() => {
    if (expandedIds) {
      return expandedIds instanceof Set ? expandedIds : new Set(expandedIds);
    }
    return uncontrolledExpanded;
  }, [expandedIds, uncontrolledExpanded]);
  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    function walk(items: TreeViewNode[]) {
      for (const item of items) {
        ids.push(item.id);
        if (item.children?.length && expanded.has(item.id)) {
          walk(item.children);
        }
      }
    }
    walk(nodes);
    return ids;
  }, [expanded, nodes]);

  const setExpanded = useCallback(
    (next: Set<string>) => {
      if (onExpandedChange) {
        onExpandedChange(next);
        return;
      }
      setUncontrolledExpanded(next);
    },
    [onExpandedChange],
  );

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const id = target.dataset.treeId;
    if (!id) {
      return;
    }
    const index = visibleIds.indexOf(id);
    const node = findNode(nodes, id);
    if (!node) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextId = visibleIds[index + 1];
      if (nextId) {
        document.getElementById(`${treeId}-${nextId}`)?.focus();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevId = visibleIds[index - 1];
      if (prevId) {
        document.getElementById(`${treeId}-${prevId}`)?.focus();
      }
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (node.children?.length && !expanded.has(id)) {
        toggle(id);
      } else if (node.children?.length) {
        const first = node.children[0];
        if (first) {
          document.getElementById(`${treeId}-${first.id}`)?.focus();
        }
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (node.children?.length && expanded.has(id)) {
        toggle(id);
      } else {
        const parent = parentIdOf(nodes, id);
        if (parent) {
          document.getElementById(`${treeId}-${parent}`)?.focus();
        }
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!node.disabled) {
        onSelect?.(node);
      }
    } else if (event.key === "Home") {
      event.preventDefault();
      const first = visibleIds[0];
      if (first) {
        document.getElementById(`${treeId}-${first}`)?.focus();
      }
    } else if (event.key === "End") {
      event.preventDefault();
      const last = visibleIds[visibleIds.length - 1];
      if (last) {
        document.getElementById(`${treeId}-${last}`)?.focus();
      }
    }
  }

  return (
    <div
      role="tree"
      aria-label="Tree"
      className={cn("flex flex-col", className)}
      onKeyDown={onKeyDown}
    >
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          treeId={treeId}
          node={node}
          depth={0}
          expanded={expanded}
          selectedId={selectedId}
          onToggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function TreeNode<T>({
  treeId,
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
}: {
  treeId: string;
  node: TreeViewNode<T>;
  depth: number;
  expanded: ReadonlySet<string>;
  selectedId?: string | null;
  onToggle: (id: string) => void;
  onSelect?: (node: TreeViewNode<T>) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expanded.has(node.id);
  const selected = selectedId === node.id;

  return (
    <div>
      <div
        id={`${treeId}-${node.id}`}
        role="treeitem"
        tabIndex={0}
        data-tree-id={node.id}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={selected}
        aria-disabled={node.disabled || undefined}
        style={{ paddingLeft: `${depth * 1.25 + 0.25}rem` }}
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded-md py-1 pr-2 text-sm outline-none",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          selected ? "bg-accent text-accent-foreground" : "hover:bg-muted/60",
          node.disabled && "text-muted-foreground",
        )}
        onClick={() => {
          if (!node.disabled) {
            onSelect?.(node);
          }
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            className="text-muted-foreground hover:text-foreground inline-flex size-5 cursor-pointer items-center justify-center rounded-sm"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        ) : (
          <span className="inline-flex size-5" />
        )}
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
      </div>
      {hasChildren && isExpanded
        ? node.children?.map((child) => (
            <TreeNode
              key={child.id}
              treeId={treeId}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export function flattenTreeIds<T>(nodes: TreeViewNode<T>[]): string[] {
  return collectIds(nodes);
}
