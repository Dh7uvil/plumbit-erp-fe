"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateTax, useUpdateTax } from "@/modules/erp/accounting/taxes/mutations";
import {
  TAX_CATEGORIES,
  TAX_CATEGORY_LABELS,
  TaxFormSchema,
  type Tax,
  type TaxCreateRequest,
  type TaxFormValues,
} from "@/modules/erp/accounting/taxes/schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { applyFieldErrors } from "@/shared/lib/form-errors";

function toFormValues(tax: Tax | null): TaxFormValues {
  return {
    name: tax?.name ?? "",
    tax_category: tax?.tax_category ?? "STANDARD",
    rate: tax?.rate ?? "",
    is_default: tax?.is_default ?? false,
    is_active: tax?.is_active ?? true,
  };
}

function toCreateRequest(values: TaxFormValues): TaxCreateRequest {
  return {
    name: values.name.trim(),
    tax_category: values.tax_category,
    rate: values.rate.trim(),
    is_default: values.is_default,
  };
}

export function TaxForm({
  tax,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  tax: Tax | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createTax = useCreateTax();
  const updateTax = useUpdateTax();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(tax);

  const form = useForm<TaxFormValues>({
    resolver: zodResolver(TaxFormSchema),
    values: toFormValues(tax),
  });

  async function onSubmit(values: TaxFormValues) {
    setFormError(null);
    try {
      if (tax) {
        await updateTax.mutateAsync({
          id: tax.id,
          values: {
            name: values.name.trim(),
            tax_category: values.tax_category,
            rate: values.rate.trim(),
            is_default: values.is_default,
            is_active: values.is_active,
          },
        });
        toast.success("Tax updated");
        onSuccess?.(tax);
      } else {
        const created = await createTax.mutateAsync(toCreateRequest(values));
        toast.success("Tax created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createTax.isPending || updateTax.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Standard VAT" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tax_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TAX_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {TAX_CATEGORY_LABELS[category]}
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
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate</FormLabel>
                <FormControl>
                  <Input placeholder="5" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-full flex flex-col gap-2">
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
                {isEdit ? "Save Changes" : "Create Tax"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
