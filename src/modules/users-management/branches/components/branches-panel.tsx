"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { BranchStatusBadge } from "@/modules/users-management/branches/components/branch-status-badge";
import { useDeleteBranch } from "@/modules/users-management/branches/mutations";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import type { Branch } from "@/modules/users-management/branches/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
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

const COLUMN_HEADERS = ["Code", "Name", "Location", "Phone", "Employees", "Status"] as const;

function locationLabel(branch: Branch): string {
  const city = branch.address?.city?.trim();
  const country = branch.address?.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city || country || "—";
}

export function BranchesPanel() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(branchPermissions);
  const branchesQuery = useAllBranches(canRead);
  const deleteBranch = useDeleteBranch();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const branches = branchesQuery.data ?? [];

  function openCreate() {
    setSelected(null);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  function openView(branch: Branch) {
    setSelected(branch);
    setForceReadOnly(true);
    setFormOpen(true);
  }

  function openEdit(branch: Branch) {
    setSelected(branch);
    setForceReadOnly(false);
    setFormOpen(true);
  }

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
        {canCreate ? (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            New Branch
          </Button>
        ) : null}
      </div>
      <DataTable>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {branchesQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : branchesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(branchesQuery.error)}
                  onRetry={() => branchesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : branches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No branches"
                  message={emptyListMessage(canCreate, "Create a branch to get started.")}
                />
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
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={branch.name}
                      onView={canRead ? () => openView(branch) : undefined}
                      onEdit={canUpdate ? () => openEdit(branch) : undefined}
                      onDelete={canDelete ? () => setDeleting(branch) : undefined}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <BranchFormDialog
        open={formOpen}
        branch={selected}
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelected(null);
            setForceReadOnly(false);
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
