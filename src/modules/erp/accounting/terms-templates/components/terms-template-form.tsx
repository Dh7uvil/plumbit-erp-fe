"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useCreateTermsTemplate,
  useUpdateTermsTemplate,
} from "@/modules/erp/accounting/terms-templates/mutations";
import {
  TermsTemplateFormSchema,
  type TermsTemplate,
  type TermsTemplateCreateRequest,
  type TermsTemplateFormValues,
} from "@/modules/erp/accounting/terms-templates/schemas";
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

function toFormValues(template: TermsTemplate | null): TermsTemplateFormValues {
  return {
    name: template?.name ?? "",
    body: template?.body ?? "",
    is_default: template?.is_default ?? false,
    is_active: template?.is_active ?? true,
  };
}

function toCreateRequest(values: TermsTemplateFormValues): TermsTemplateCreateRequest {
  return {
    name: values.name.trim(),
    body: values.body.trim(),
    is_default: values.is_default,
  };
}

export function TermsTemplateForm({
  template,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  template: TermsTemplate | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createTermsTemplate = useCreateTermsTemplate();
  const updateTermsTemplate = useUpdateTermsTemplate();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(template);

  const form = useForm<TermsTemplateFormValues>({
    resolver: zodResolver(TermsTemplateFormSchema),
    values: toFormValues(template),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: TermsTemplateFormValues) {
    setFormError(null);
    try {
      if (template) {
        await updateTermsTemplate.mutateAsync({
          id: template.id,
          values: {
            name: values.name.trim(),
            body: values.body.trim(),
            is_default: values.is_default,
            is_active: values.is_active,
          },
        });
        toast.success("Terms template updated");
        onSuccess?.(template);
      } else {
        const created = await createTermsTemplate.mutateAsync(toCreateRequest(values));
        toast.success("Terms template created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createTermsTemplate.isPending || updateTermsTemplate.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
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
                <Input placeholder="Standard terms" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body</FormLabel>
              <FormControl>
                <Textarea
                  rows={8}
                  placeholder="Terms and conditions"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2">
          <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={disabled}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel>Default</FormLabel>
              </FormItem>
            )}
          />
          {isEdit ? (
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
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
                {isEdit ? "Save Changes" : "Create Terms Template"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
