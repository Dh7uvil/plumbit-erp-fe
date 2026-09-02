"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateCurrency, useUpdateCurrency } from "@/modules/erp/currencies/mutations";
import {
  CurrencyFormSchema,
  type Currency,
  type CurrencyCreateRequest,
  type CurrencyFormValues,
} from "@/modules/erp/currencies/schemas";
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

function toFormValues(currency: Currency | null): CurrencyFormValues {
  return {
    code: currency?.code ?? "",
    name: currency?.name ?? "",
    symbol: currency?.symbol ?? "",
    decimal_places: currency?.decimal_places ?? 2,
    is_base: currency?.is_base ?? false,
    is_active: currency?.is_active ?? true,
  };
}

function toCreateRequest(values: CurrencyFormValues): CurrencyCreateRequest {
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    symbol: values.symbol.trim(),
    decimal_places: values.decimal_places,
    is_base: values.is_base,
  };
}

export function CurrencyForm({
  currency,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  currency: Currency | null;
  disabled?: boolean;
  onSuccess?: (entity: Currency) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createCurrency = useCreateCurrency();
  const updateCurrency = useUpdateCurrency();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(currency);
  const isBase = currency?.is_base === true;

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(CurrencyFormSchema),
    values: toFormValues(currency),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: CurrencyFormValues) {
    setFormError(null);
    try {
      if (currency) {
        await updateCurrency.mutateAsync({
          id: currency.id,
          values: {
            name: values.name.trim(),
            symbol: values.symbol.trim(),
            decimal_places: values.decimal_places,
            is_base: isBase ? true : values.is_base,
            is_active: values.is_active,
          },
        });
        toast.success("Currency updated");
        onSuccess?.(currency);
      } else {
        const created = await createCurrency.mutateAsync(toCreateRequest(values));
        toast.success("Currency created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createCurrency.isPending || updateCurrency.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div
          className={
            isEdit
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
              : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {!isEdit ? (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="AED" maxLength={3} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input placeholder="د.إ" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="decimal_places"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decimal places</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={6}
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
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-full">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="UAE Dirham" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-full flex flex-col gap-2">
            <FormField
              control={form.control}
              name="is_base"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={isBase || disabled}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel>Base currency</FormLabel>
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
                {isEdit ? "Save Changes" : "Create Currency"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
