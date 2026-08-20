"use client";

import { Edit2, Loader2, MapPin, Phone, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { BranchStatusBadge } from "@/modules/users-management/branches/components/branch-status-badge";
import { useDeleteBranch } from "@/modules/users-management/branches/mutations";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import type { Branch } from "@/modules/users-management/branches/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useCan } from "@/shared/providers/session-provider";

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

  function openCreate() {
    setEditing(null);
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
      {can(branchPermissions.create) ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            New Branch
          </Button>
        </div>
      ) : null}
      {branchesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      ) : null}
      {branchesQuery.isError ? (
        <DataTableError
          message={getErrorMessage(branchesQuery.error)}
          onRetry={() => branchesQuery.refetch()}
        />
      ) : null}
      {!branchesQuery.isLoading && !branchesQuery.isError && branches.length === 0 ? (
        <DataTableEmpty title="No branches" message="Create a branch to get started." />
      ) : null}
      {!branchesQuery.isLoading && !branchesQuery.isError ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{branch.name}</p>
                  <div className="flex items-center gap-1.5">
                    <BranchStatusBadge status={branch.status} />
                    {can(branchPermissions.update) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
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
                        className="text-destructive size-8"
                        aria-label={`Delete ${branch.name}`}
                        onClick={() => setDeleting(branch)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="text-muted-foreground space-y-1 text-xs">
                  <p className="flex items-center gap-1">
                    <MapPin className="size-2.5" /> {locationLabel(branch)}
                  </p>
                  <p className="flex items-center gap-1">
                    <Phone className="size-2.5" /> {branch.phone ?? "—"}
                  </p>
                  <p className="flex items-center gap-1">
                    <Users className="size-2.5" /> {branch.employee_count} employees
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
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
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete branch</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleting ? `"${deleting.name}"` : "this branch"}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBranch.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBranch.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteBranch.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
