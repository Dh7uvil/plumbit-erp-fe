"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useCreateDunningRule,
  useUpdateDunningRule,
} from "@/modules/erp/accounting/dunning-rules/mutations";
import {
  DUNNING_TEMPLATE_KEYS,
  DUNNING_TEMPLATE_LABELS,
  DunningRuleFormSchema,
  type DunningRule,
  type DunningRuleCreateRequest,
  type DunningRuleFormValues,
} from "@/modules/erp/accounting/dunning-rules/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function toFormValues(rule: DunningRule | null): DunningRuleFormValues {
  return {
    name: rule?.name ?? "",
    days_offset: rule?.days_offset ?? 0,
    template_key: rule?.template_key ?? "PAYMENT_OVERDUE",
    escalate: rule?.escalate ?? false,
    description: rule?.description ?? "",
    is_active: rule?.is_active ?? true,
  };
}

function toCreateRequest(values: DunningRuleFormValues): DunningRuleCreateRequest {
  const description = values.description.trim();
  return {
    name: values.name.trim(),
    days_offset: values.days_offset,
    template_key: values.template_key,
    escalate: values.escalate,
    description: description ? description : null,
    is_active: values.is_active,
  };
}

export function DunningRuleForm({
  rule,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  rule: DunningRule | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createRule = useCreateDunningRule();
  const updateRule = useUpdateDunningRule();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<DunningRuleFormValues>({
    resolver: zodResolver(DunningRuleFormSchema),
    values: toFormValues(rule),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: DunningRuleFormValues) {
    setFormError(null);
    const payload = toCreateRequest(values);
    try {
      if (rule) {
        await updateRule.mutateAsync({
          id: rule.id,
          values: payload,
        });
        toast.success("Dunning rule updated");
        onSuccess?.(rule);
      } else {
        const created = await createRule.mutateAsync(payload);
        toast.success("Dunning rule created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createRule.isPending || updateRule.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="days_offset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days from due date</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                Negative values send before the due date; positive values send after it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="template_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email template</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DUNNING_TEMPLATE_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {DUNNING_TEMPLATE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="escalate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Escalation tone</FormLabel>
                <FormDescription>Uses stronger wording in the escalation template.</FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={disabled} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {rule ? (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
                <FormLabel>Active</FormLabel>
              </FormItem>
            )}
          />
        ) : null}
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="flex justify-end gap-2">
          {showCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={disabled || pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : rule ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
