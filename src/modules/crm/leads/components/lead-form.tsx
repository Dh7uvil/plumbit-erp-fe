"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllLeadSources } from "@/modules/crm/lead-sources/queries";
import { useCreateLead, useUpdateLead } from "@/modules/crm/leads/mutations";
import {
  LeadFormSchema,
  defaultLeadFormValues,
  type Lead,
  type LeadCreateRequest,
  type LeadFormValues,
} from "@/modules/crm/leads/schemas";
import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
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

function toFormValues(lead: Lead | null): LeadFormValues {
  if (!lead) {
    return defaultLeadFormValues();
  }
  return {
    first_name: lead.first_name ?? "",
    last_name: lead.last_name ?? "",
    company_name: lead.company_name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    title: lead.title ?? "",
    rating: lead.rating ?? "",
    source_id: lead.source_id ?? OPTIONAL_SELECT_NONE,
    notes: lead.notes ?? "",
  };
}

function toPayload(values: LeadFormValues): LeadCreateRequest {
  const sourceId = values.source_id === OPTIONAL_SELECT_NONE ? null : values.source_id;
  return {
    first_name: values.first_name.trim() || null,
    last_name: values.last_name.trim() || null,
    company_name: values.company_name.trim() || null,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    title: values.title.trim() || null,
    rating: values.rating.trim() || null,
    source_id: sourceId,
    notes: values.notes.trim() || null,
  };
}

export function LeadForm({
  lead,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  lead: Lead | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const sourcesQuery = useAllLeadSources();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(lead);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(LeadFormSchema),
    values: toFormValues(lead),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: LeadFormValues) {
    setFormError(null);
    const payload = toPayload(values);
    try {
      if (lead) {
        const updated = await updateLead.mutateAsync({
          id: lead.id,
          version: lead.version,
          ...payload,
        });
        toast.success("Lead updated");
        onSuccess?.(updated);
      } else {
        const created = await createLead.mutateAsync(payload);
        toast.success("Lead created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createLead.isPending || updateLead.isPending;
  const sources = sourcesQuery.data ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input disabled={disabled} maxLength={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input disabled={disabled} maxLength={200} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input disabled={disabled} type="email" maxLength={255} {...field} />
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
                  <Input disabled={disabled} maxLength={50} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="source_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead source</FormLabel>
              <Select disabled={disabled} onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} rows={4} maxLength={4000} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!disabled ? (
          <div className="flex justify-end gap-2">
            {showCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {isEdit ? "Save changes" : "Create lead"}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
