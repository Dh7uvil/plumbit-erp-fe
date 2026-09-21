"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreatePipeline, useUpdatePipeline } from "@/modules/crm/pipelines/mutations";
import {
  PipelineFormSchema,
  type Pipeline,
  type PipelineCreateRequest,
  type PipelineFormValues,
} from "@/modules/crm/pipelines/schemas";
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
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function toFormValues(pipeline: Pipeline | null): PipelineFormValues {
  return {
    name: pipeline?.name ?? "",
    is_default: pipeline?.is_default ?? false,
    is_active: pipeline?.is_active ?? true,
  };
}

function toCreateRequest(values: PipelineFormValues): PipelineCreateRequest {
  return {
    name: values.name.trim(),
    is_default: values.is_default,
  };
}

export function PipelineForm({
  pipeline,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  pipeline: Pipeline | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createPipeline = useCreatePipeline();
  const updatePipeline = useUpdatePipeline();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(pipeline);

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(PipelineFormSchema),
    values: toFormValues(pipeline),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: PipelineFormValues) {
    setFormError(null);
    const payload = toCreateRequest(values);
    try {
      if (pipeline) {
        await updatePipeline.mutateAsync({
          id: pipeline.id,
          values: {
            ...payload,
            is_active: values.is_active,
          },
        });
        toast.success("Pipeline updated");
        onSuccess?.(pipeline);
      } else {
        const created = await createPipeline.mutateAsync(payload);
        toast.success("Pipeline created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createPipeline.isPending || updatePipeline.isPending;

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
                  <Input placeholder="Standard Sales" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={disabled || (isEdit && pipeline?.is_default)}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel>Default pipeline</FormLabel>
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
                {isEdit ? "Save Changes" : "Create Pipeline"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
