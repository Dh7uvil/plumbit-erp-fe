"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useCreatePaymentTerm,
  useUpdatePaymentTerm,
} from "@/modules/erp/accounting/payment-terms/mutations";
import {
  PaymentTermFormSchema,
  type PaymentTerm,
  type PaymentTermCreateRequest,
  type PaymentTermFormValues,
} from "@/modules/erp/accounting/payment-terms/schemas";
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

function toFormValues(term: PaymentTerm | null): PaymentTermFormValues {
  return {
    name: term?.name ?? "",
    days: term?.days ?? 0,
    description: term?.description ?? "",
    is_active: term?.is_active ?? true,
  };
}

function toCreateRequest(values: PaymentTermFormValues): PaymentTermCreateRequest {
  const description = values.description.trim();
  return {
    name: values.name.trim(),
    days: values.days,
    description: description ? description : null,
  };
}

export function PaymentTermForm({
  term,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  term: PaymentTerm | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createPaymentTerm = useCreatePaymentTerm();
  const updatePaymentTerm = useUpdatePaymentTerm();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(term);

  const form = useForm<PaymentTermFormValues>({
    resolver: zodResolver(PaymentTermFormSchema),
    values: toFormValues(term),
  });

  async function onSubmit(values: PaymentTermFormValues) {
    setFormError(null);
    const payload = toCreateRequest(values);
    try {
      if (term) {
        await updatePaymentTerm.mutateAsync({
          id: term.id,
          values: {
            ...payload,
            is_active: values.is_active,
          },
        });
        toast.success("Payment term updated");
        onSuccess?.(term);
      } else {
        const created = await createPaymentTerm.mutateAsync(payload);
        toast.success("Payment term created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createPaymentTerm.isPending || updatePaymentTerm.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Net 30" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Days</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={3650}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    disabled={disabled}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
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
                  <Input placeholder="Optional" disabled={disabled} {...field} />
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
                {isEdit ? "Save Changes" : "Create Payment Term"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
