"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/modules/users-management/departments/mutations";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import {
  DEPARTMENT_SELECT_NONE,
  DepartmentFormSchema,
  type Department,
  type DepartmentCreateRequest,
  type DepartmentFormValues,
  type DepartmentUpdateRequest,
} from "@/modules/users-management/departments/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogFooter } from "@/shared/components/form/form-dialog-footer";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function toFormValues(
  department: Department | null,
  defaultBranchId?: string,
): DepartmentFormValues {
  return {
    name: department?.name ?? "",
    code: department?.code ?? "",
    branch_id: department?.branch_id ?? defaultBranchId ?? "",
    manager_id: department?.manager_id ?? DEPARTMENT_SELECT_NONE,
  };
}

function toCreateRequest(values: DepartmentFormValues): DepartmentCreateRequest {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    branch_id: values.branch_id,
    manager_id: values.manager_id === DEPARTMENT_SELECT_NONE ? null : values.manager_id,
  };
}

export function DepartmentFormDialog({
  open,
  department,
  onOpenChange,
  onCreated,
  nested = false,
  defaultBranchId,
  forceReadOnly = false,
}: {
  open: boolean;
  department: Department | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  defaultBranchId?: string;
  forceReadOnly?: boolean;
}) {
  const can = useCan();
  const { canCreate, canUpdate } = useCrudPermissions(departmentPermissions);
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const branchesQuery = useAllBranches(open);
  const usersQuery = useAllUsers(open && can(userPermissions.read));
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const hasRecord = Boolean(department);
  const { mode, readOnly, canSubmit } = resolveFormDialogMode({
    hasRecord,
    canCreate,
    canUpdate,
    forceReadOnly,
  });
  const canPickManager = can(userPermissions.read);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(DepartmentFormSchema),
    values: toFormValues(department, defaultBranchId),
  });
  useDirtyFormGuard(open && canSubmit && form.formState.isDirty);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: DepartmentFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (department) {
        const payload: DepartmentUpdateRequest = {
          name: values.name.trim(),
          branch_id: values.branch_id,
          manager_id: values.manager_id === DEPARTMENT_SELECT_NONE ? null : values.manager_id,
        };
        await updateDepartment.mutateAsync({ id: department.id, values: payload });
        toast.success("Department updated");
      } else {
        const created = await createDepartment.mutateAsync(toCreateRequest(values));
        toast.success("Department created");
        onCreated?.(created);
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createDepartment.isPending || updateDepartment.isPending;
  const branches = branchesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent nested={nested} className="sm:max-w-lg">
        <FormDialogHeader
          title={formDialogTitle("Department", mode)}
          entity="Department"
          code={department?.code}
        />
        <Form {...form}>
          <form
            onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
            className="flex flex-col gap-3"
          >
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div
              className={
                hasRecord
                  ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                  : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Department name" disabled={readOnly} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!hasRecord ? (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="OPS" disabled={readOnly} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <FormField
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <MasterSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={branchesQuery.isLoading || readOnly}
                      placeholder="Select a branch"
                      searchPlaceholder="Search branch…"
                      createLabel="Create branch"
                      onCreate={
                        can(branchPermissions.create) && !readOnly
                          ? () => setCreatingBranch(true)
                          : undefined
                      }
                      options={branches.map((branch) => ({
                        value: branch.id,
                        label: branch.name,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {canPickManager ? (
                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Manager</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={usersQuery.isLoading || readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Optional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DEPARTMENT_SELECT_NONE}>None</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <FormDialogFooter
              pending={pending}
              canSubmit={canSubmit}
              submitLabel={hasRecord ? "Save Changes" : "Create Department"}
              onClose={() => handleOpenChange(false)}
            />
          </form>
        </Form>
        <BranchFormDialog
          open={creatingBranch}
          branch={null}
          nested
          onCreated={(entity) => form.setValue("branch_id", entity.id)}
          onOpenChange={setCreatingBranch}
        />
      </DialogContent>
    </Dialog>
  );
}
