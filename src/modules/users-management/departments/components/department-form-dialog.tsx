"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllBranches } from "@/modules/users-management/branches/queries";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/modules/users-management/departments/mutations";
import {
  DEPARTMENT_SELECT_NONE,
  DepartmentFormSchema,
  type Department,
  type DepartmentCreateRequest,
  type DepartmentFormValues,
} from "@/modules/users-management/departments/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import { useCan } from "@/shared/providers/session-provider";

function toFormValues(department: Department | null): DepartmentFormValues {
  return {
    name: department?.name ?? "",
    code: department?.code ?? "",
    branch_id: department?.branch_id ?? "",
    manager_id: department?.manager_id ?? DEPARTMENT_SELECT_NONE,
  };
}

function toRequest(values: DepartmentFormValues): DepartmentCreateRequest {
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
}: {
  open: boolean;
  department: Department | null;
  onOpenChange: (open: boolean) => void;
}) {
  const can = useCan();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const branchesQuery = useAllBranches(open);
  const usersQuery = useAllUsers(open && can(userPermissions.read));
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(department);
  const canPickManager = can(userPermissions.read);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(DepartmentFormSchema),
    values: toFormValues(department),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: DepartmentFormValues) {
    setFormError(null);
    const payload = toRequest(values);
    try {
      if (department) {
        await updateDepartment.mutateAsync({ id: department.id, values: payload });
        toast.success("Department updated");
      } else {
        await createDepartment.mutateAsync(payload);
        toast.success("Department created");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Department" : "New Department"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Department name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="OPS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={branchesQuery.isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {canPickManager ? (
                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Manager</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={usersQuery.isLoading}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Department"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
