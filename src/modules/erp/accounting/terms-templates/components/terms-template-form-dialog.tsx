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
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";

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

export function TermsTemplateFormDialog({
  open,
  template,
  onOpenChange,
}: {
  open: boolean;
  template: TermsTemplate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createTermsTemplate = useCreateTermsTemplate();
  const updateTermsTemplate = useUpdateTermsTemplate();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(template);

  const form = useForm<TermsTemplateFormValues>({
    resolver: zodResolver(TermsTemplateFormSchema),
    values: toFormValues(template),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

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
      } else {
        await createTermsTemplate.mutateAsync(toCreateRequest(values));
        toast.success("Terms template created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createTermsTemplate.isPending || updateTermsTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Terms Template" : "New Terms Template"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Standard terms" {...field} />
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
                    <Textarea rows={8} placeholder="Terms and conditions" {...field} />
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
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
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
                {isEdit ? "Save Changes" : "Create Terms Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
