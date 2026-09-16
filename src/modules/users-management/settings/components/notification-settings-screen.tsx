"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateNotificationPreferences } from "@/modules/users-management/settings/mutations";
import { useNotificationPreferences } from "@/modules/users-management/settings/queries";
import type { NotificationPreferenceUpdate } from "@/modules/users-management/settings/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { toolbarLabelClass } from "@/shared/components/data-table/toolbar";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

const DEFAULTS: NotificationPreferenceUpdate = {
  email_enabled: true,
  in_app_enabled: true,
  whatsapp_enabled: false,
};

export function NotificationSettingsScreen() {
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<NotificationPreferenceUpdate>({
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }
    form.reset({
      email_enabled: query.data.email_enabled,
      in_app_enabled: query.data.in_app_enabled,
      whatsapp_enabled: query.data.whatsapp_enabled,
    });
  }, [form, query.data]);

  useDirtyFormGuard(form.formState.isDirty);

  async function onSave(values: NotificationPreferenceUpdate) {
    setFormError(null);
    try {
      await update.mutateAsync(values);
      toast.success("Notification preferences saved");
      form.reset(values);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  if (query.isLoading && !query.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Notification Settings" subtitle="Choose how you want to be notified" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Notification Settings" subtitle="Choose how you want to be notified" />
        <ErrorState
          message={getErrorMessage(query.error) || "Unable to load notification preferences."}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const pending = update.isPending;

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="Notification Settings" subtitle="Choose how you want to be notified" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)}>
          <Card>
            <CardHeader className="items-center">
              <CardTitle className="text-base">Channels</CardTitle>
              <CardAction className="self-center">
                <Button type="submit" size="sm" disabled={pending || !form.formState.isDirty}>
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  Save
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <FormField
                control={form.control}
                name="email_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <FormLabel className={toolbarLabelClass}>Email notifications</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        disabled={pending}
                        aria-label="Email notifications"
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="in_app_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <FormLabel className={toolbarLabelClass}>In-app notifications</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        disabled={pending}
                        aria-label="In-app notifications"
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <FormLabel className={toolbarLabelClass}>WhatsApp notifications</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        disabled={pending}
                        aria-label="WhatsApp notifications"
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
