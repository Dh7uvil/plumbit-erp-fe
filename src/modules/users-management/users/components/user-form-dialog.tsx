"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllRoles } from "@/modules/users-management/roles/queries";
import { UserEmployeeFields } from "@/modules/users-management/users/components/user-employee-fields";
import {
  useAssignUserRoles,
  useCreateUser,
  useUpdateUser,
} from "@/modules/users-management/users/mutations";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useUser } from "@/modules/users-management/users/queries";
import {
  emptyEmployeeFormValues,
  employeeFormValuesFromUser,
  toEmployeeUpsert,
  UserCreateFormSchema,
  UserUpdateFormSchema,
  type UserCreateFormValues,
  type UserStatus,
  type UserUpdateFormValues,
} from "@/modules/users-management/users/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
import { MultiSelect } from "@/shared/components/ui/multi-select";
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

const STATUSES: UserStatus[] = ["ACTIVE", "INVITED", "DISABLED"];

function RolesField({
  value,
  onChange,
  roles,
  disabled,
}: {
  value: string[];
  onChange: (roleIds: string[]) => void;
  roles: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const selectedRoles = roles.filter((role) => value.includes(role.id));

  return (
    <FormItem>
      <FormLabel>Roles</FormLabel>
      <FormControl>
        <MultiSelect
          options={roles.map((role) => ({ value: role.id, label: role.name }))}
          value={value}
          onValueChange={onChange}
          placeholder="Select roles"
          emptyText="No roles available."
          showSelectedSummary={false}
          disabled={disabled}
        />
      </FormControl>
      {selectedRoles.length > 0 ? (
        <div className="space-y-2 rounded-md border p-3">
          {selectedRoles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked
                disabled={disabled}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    onChange(value.filter((id) => id !== role.id));
                  }
                }}
              />
              {role.name}
            </label>
          ))}
        </div>
      ) : null}
      <FormMessage />
    </FormItem>
  );
}

export function UserFormDialog({
  open,
  userId,
  onOpenChange,
}: {
  open: boolean;
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = Boolean(userId);
  const can = useCan();
  const { canCreate, canUpdate } = useCrudPermissions(userPermissions);
  const canSubmit = isEdit ? canUpdate : canCreate;
  const rolesQuery = useAllRoles();
  const detailQuery = useUser(userId);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const assignRoles = useAssignUserRoles();
  const [formError, setFormError] = useState<string | null>(null);
  const canAssignRoles = can(userPermissions.assignRoles);

  const createForm = useForm<UserCreateFormValues>({
    resolver: zodResolver(UserCreateFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      status: "ACTIVE",
      role_ids: [],
      ...emptyEmployeeFormValues(),
    },
  });

  const updateForm = useForm<UserUpdateFormValues>({
    resolver: zodResolver(UserUpdateFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: "ACTIVE",
      role_ids: [],
      ...emptyEmployeeFormValues(),
    },
    values: detailQuery.data
      ? {
          name: detailQuery.data.name,
          email: detailQuery.data.email,
          phone: detailQuery.data.phone ?? "",
          status: detailQuery.data.status,
          role_ids: detailQuery.data.roles.map((role) => role.id),
          ...employeeFormValuesFromUser(detailQuery.data),
        }
      : undefined,
  });
  useDirtyFormGuard(
    open && canSubmit && (createForm.formState.isDirty || updateForm.formState.isDirty),
  );

  function handleOpenChange(next: boolean) {
    if (!next) {
      createForm.reset();
      setFormError(null);
    }
    onOpenChange(next);
  }

  function close() {
    handleOpenChange(false);
  }

  async function onCreate(values: UserCreateFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      await createUser.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone.trim() ? values.phone.trim() : null,
        status: values.status,
        role_ids: canAssignRoles ? values.role_ids : undefined,
        employee: toEmployeeUpsert(values),
      });
      toast.success("User created");
      close();
    } catch (error) {
      if (applyFieldErrors(error, createForm.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  async function onUpdate(values: UserUpdateFormValues) {
    if (!userId || !canSubmit) {
      return;
    }
    setFormError(null);
    try {
      await updateUser.mutateAsync({
        id: userId,
        values: {
          name: values.name,
          email: values.email,
          phone: values.phone.trim() ? values.phone.trim() : null,
          status: values.status,
          employee: toEmployeeUpsert(values),
        },
      });
      if (canAssignRoles) {
        await assignRoles.mutateAsync({ id: userId, roleIds: values.role_ids });
      }
      toast.success("User updated");
      close();
    } catch (error) {
      if (applyFieldErrors(error, updateForm.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createUser.isPending || updateUser.isPending || assignRoles.isPending;
  const roles = rolesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "New User"}</DialogTitle>
        </DialogHeader>
        {isEdit ? (
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdate)} className="flex flex-col gap-3">
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={updateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status === "ACTIVE"
                                ? "Active"
                                : status === "INVITED"
                                  ? "Invited"
                                  : "Disabled"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <UserEmployeeFields />
              {canAssignRoles ? (
                <FormField
                  control={updateForm.control}
                  name="role_ids"
                  render={({ field }) => (
                    <RolesField
                      value={field.value}
                      onChange={field.onChange}
                      roles={roles}
                      disabled={rolesQuery.isLoading}
                    />
                  )}
                />
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close} disabled={pending}>
                  Cancel
                </Button>
                {canSubmit ? (
                  <Button type="submit" disabled={pending || (isEdit && detailQuery.isLoading)}>
                    {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                ) : null}
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreate)} className="flex flex-col gap-3">
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status === "ACTIVE"
                                ? "Active"
                                : status === "INVITED"
                                  ? "Invited"
                                  : "Disabled"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="col-span-full">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Temporary password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <UserEmployeeFields />
              {canAssignRoles ? (
                <FormField
                  control={createForm.control}
                  name="role_ids"
                  render={({ field }) => (
                    <RolesField
                      value={field.value}
                      onChange={field.onChange}
                      roles={roles}
                      disabled={rolesQuery.isLoading}
                    />
                  )}
                />
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close} disabled={pending}>
                  Cancel
                </Button>
                {canSubmit ? (
                  <Button type="submit" disabled={pending}>
                    {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Create User
                  </Button>
                ) : null}
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
