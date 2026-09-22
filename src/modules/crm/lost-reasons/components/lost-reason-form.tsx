"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateLostReason, useUpdateLostReason } from "@/modules/crm/lost-reasons/mutations";
import {
  LostReasonFormSchema,
  type LostReason,
  type LostReasonCreateRequest,
  type LostReasonFormValues,
} from "@/modules/crm/lost-reasons/schemas";
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

function toFormValues(reason: LostReason | null): LostReasonFormValues {
  return {
    name: reason?.name ?? "",
    description: reason?.description ?? "",
    is_active: reason?.is_active ?? true,
  };
}

function toCreateRequest(values: LostReasonFormValues): LostReasonCreateRequest {
  const description = values.description.trim();
  return {
    name: values.name.trim(),
    description: description ? description : null,
  };
}

export function LostReasonForm({
  reason,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  reason: LostReason | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createLostReason = useCreateLostReason();
  const updateLostReason = useUpdateLostReason();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(reason);

  const form = useForm<LostReasonFormValues>({
    resolver: zodResolver(LostReasonFormSchema),
    values: toFormValues(reason),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: LostReasonFormValues) {
    setFormError(null);
    const payload = toCreateRequest(values);
    try {
      if (reason) {
        await updateLostReason.mutateAsync({
          id: reason.id,
          values: {
            ...payload,
            is_active: values.is_active,
          },
        });
        toast.success("Lost reason updated");
        onSuccess?.(reason);
      } else {
        const created = await createLostReason.mutateAsync(payload);
        toast.success("Lost reason created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createLostReason.isPending || updateLostReason.isPending;

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
