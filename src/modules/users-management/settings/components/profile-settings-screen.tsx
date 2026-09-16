"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useMe } from "@/modules/users-management/auth/queries";
import { useUpdateMe } from "@/modules/users-management/settings/mutations";
import {
  ProfileFormSchema,
  type ProfileFormValues,
} from "@/modules/users-management/settings/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { formatDateTime, humanizeEnum } from "@/shared/lib/format";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { toolbarLabelClass } from "@/shared/components/data-table/toolbar";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={toolbarLabelClass}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function ProfileSettingsScreen() {
  const meQuery = useMe();
  const updateMe = useUpdateMe();
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const me = meQuery.data;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (!me) {
      return;
    }
    form.reset({ name: me.name, phone: me.phone ?? "" });
  }, [form, me]);

  useDirtyFormGuard(isEditing && form.formState.isDirty);

  async function onSave() {
    setFormError(null);
    const valid = await form.trigger();
    if (!valid) {
      return;
    }
    const values = form.getValues();
    try {
      await updateMe.mutateAsync({
        name: values.name.trim(),
        phone: values.phone.trim() === "" ? null : values.phone.trim(),
      });
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  function onCancel() {
    if (!me) {
      return;
    }
    form.reset({ name: me.name, phone: me.phone ?? "" });
    setFormError(null);
    setIsEditing(false);
  }

  if (meQuery.isLoading && !me) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="My Profile" subtitle="View and edit your personal details" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (meQuery.isError || !me) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="My Profile" subtitle="View and edit your personal details" />
        <ErrorState
          message={getErrorMessage(meQuery.error) || "Unable to load your profile."}
          onRetry={() => void meQuery.refetch()}
        />
      </div>
    );
  }

  const pending = updateMe.isPending;
  const roleNames = me.roles.map((role) => role.name).join(", ") || "—";

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="My Profile" subtitle="View and edit your personal details" />
      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <Card>
            <CardHeader className="items-center">
              <CardTitle className="text-base">Profile</CardTitle>
              <CardAction className="self-center">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={onCancel}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={pending}>
                      {pending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : null}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                )}
              </CardAction>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
              {formError ? (
                <p className="text-destructive col-span-full text-sm">{formError}</p>
              ) : null}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled={!isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input disabled={!isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ReadOnlyField label="Email" value={me.email} />
              <ReadOnlyField label="Status" value={humanizeEnum(me.status)} />
              <ReadOnlyField label="Roles" value={roleNames} />
              <ReadOnlyField label="Last login" value={formatDateTime(me.last_login_at)} />
              {me.employee ? (
                <>
                  <ReadOnlyField label="Employee code" value={me.employee.employee_code} />
                  <ReadOnlyField label="Designation" value={me.employee.designation ?? "—"} />
                </>
              ) : null}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
