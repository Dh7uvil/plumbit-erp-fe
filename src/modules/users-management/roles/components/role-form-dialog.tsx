"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateRole, useUpdateRole } from "@/modules/users-management/roles/mutations";
import { rolePermissions } from "@/modules/users-management/roles/permissions";
import {
  RoleFormSchema,
  type Role,
  type RoleFormValues,
} from "@/modules/users-management/roles/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogFooter } from "@/shared/components/form/form-dialog-footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";

export function RoleFormDialog({
  open,
  role,
  onOpenChange,
  forceReadOnly = false,
}: {
  open: boolean;
  role: Role | null;
  onOpenChange: (open: boolean) => void;
  forceReadOnly?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(rolePermissions);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const [formError, setFormError] = useState<string | null>(null);
  const hasRecord = Boolean(role);
  const { mode, readOnly, canSubmit } = resolveFormDialogMode({
    hasRecord,
    canCreate,
    canUpdate,
    forceReadOnly,
  });

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(RoleFormSchema),
    values: {
      name: role?.name ?? "",
      description: role?.description ?? "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: RoleFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    const payload = {
      name: values.name,
      description: values.description.trim() ? values.description.trim() : null,
    };
    try {
      if (role) {
        await updateRole.mutateAsync({ id: role.id, values: payload });
        toast.success("Role updated");
      } else {
        await createRole.mutateAsync(payload);
        toast.success("Role created");
      }
      onOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createRole.isPending || updateRole.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Role", mode)}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
            className="flex flex-col gap-3"
          >
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Role name" disabled={readOnly} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What this role can do" disabled={readOnly} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDialogFooter
              pending={pending}
              canSubmit={canSubmit}
              submitLabel={hasRecord ? "Save Changes" : "Create Role"}
              onClose={() => handleOpenChange(false)}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
