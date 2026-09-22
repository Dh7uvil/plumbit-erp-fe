"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateLeadSource, useUpdateLeadSource } from "@/modules/crm/lead-sources/mutations";
import {
  LeadSourceFormSchema,
  type LeadSource,
  type LeadSourceCreateRequest,
  type LeadSourceFormValues,
} from "@/modules/crm/lead-sources/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function toFormValues(source: LeadSource | null): LeadSourceFormValues {
  return {
    name: source?.name ?? "",
    description: source?.description ?? "",
    is_active: source?.is_active ?? true,
  };
}

function toCreateRequest(values: LeadSourceFormValues): LeadSourceCreateRequest {
  const description = values.description.trim();
  return {
    name: values.name.trim(),
    description: description ? description : null,
  };
}

export function LeadSourceForm({
  source,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  source: LeadSource | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createLeadSource = useCreateLeadSource();
  const updateLeadSource = useUpdateLeadSource();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(source);

  const form = useForm<LeadSourceFormValues>({
    resolver: zodResolver(LeadSourceFormSchema),
    values: toFormValues(source),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: LeadSourceFormValues) {
    setFormError(null);
    const payload = toCreateRequest(values);
    try {
      if (source) {
        await updateLeadSource.mutateAsync({
          id: source.id,
          values: {
            ...payload,
            is_active: values.is_active,
          },
        });
        toast.success("Lead source updated");
        onSuccess?.(source);
      } else {
        const created = await createLeadSource.mutateAsync(payload);
        toast.success("Lead source created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createLeadSource.isPending || updateLeadSource.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div data-slot="form-grid" className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Website" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Optional" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEdit ? (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )}
            />
          ) : null}
        </div>
        {showCancel || !disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                {disabled ? "Close" : "Cancel"}
              </Button>
            ) : null}
            {!disabled ? (
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Create Lead Source"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
