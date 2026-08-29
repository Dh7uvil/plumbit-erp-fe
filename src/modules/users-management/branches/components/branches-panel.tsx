"use client";

import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { BranchStatusBadge } from "@/modules/users-management/branches/components/branch-status-badge";
import { useDeleteBranch } from "@/modules/users-management/branches/mutations";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import type { Branch } from "@/modules/users-management/branches/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
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

const HEADERS = ["Code", "Name", "Location", "Phone", "Employees", "Status", "Actions"] as const;

function locationLabel(branch: Branch): string {
  const city = branch.address?.city?.trim();
  const country = branch.address?.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city || country || "—";
}

export function BranchesPanel() {
  const can = useCan();
  const canRead = can(branchPermissions.read);
  const branchesQuery = useAllBranches(canRead);
  const deleteBranch = useDeleteBranch();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  const branches = branchesQuery.data ?? [];

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteBranch.mutateAsync(deleting.id);
      toast.success("Branch deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (!canRead) {
    return (
      <DataTableEmpty
        title="Branches are not available"
        message="You do not have permission to view branches."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {can(branchPermissions.create) ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New Branch
          </Button>
        ) : null}
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            {HEADERS.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {branchesQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : branchesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(branchesQuery.error)}
                  onRetry={() => branchesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : branches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={HEADERS.length}>
                <DataTableEmpty title="No branches" message="Create a branch to get started." />
              </TableCell>
            </TableRow>
          ) : (
            branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-mono text-sm">{branch.code}</TableCell>
                <TableCell className="font-medium">{branch.name}</TableCell>
                <TableCell>{locationLabel(branch)}</TableCell>
                <TableCell>{branch.phone || "—"}</TableCell>
                <TableCell>{branch.employee_count}</TableCell>
                <TableCell>
                  <BranchStatusBadge status={branch.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {can(branchPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Edit ${branch.name}`}
                        onClick={() => {
                          setEditing(branch);
                          setFormOpen(true);
                        }}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    ) : null}
                    {can(branchPermissions.delete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-7"
                        aria-label={`Delete ${branch.name}`}
                        onClick={() => setDeleting(branch)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <BranchFormDialog
        open={formOpen}
        branch={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete branch"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this branch"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteBranch.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
