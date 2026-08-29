"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useUpsertExchangeRate } from "@/modules/erp/exchange-rates/mutations";
import {
  ExchangeRateFormSchema,
  type ExchangeRate,
  type ExchangeRateFormValues,
  type ExchangeRateUpsertRequest,
} from "@/modules/erp/exchange-rates/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { applyFieldErrors } from "@/shared/lib/form-errors";

function toFormValues(rate: ExchangeRate | null): ExchangeRateFormValues {
  return {
    currency_id: rate?.from_currency_id ?? "",
    rate_to_base: rate?.rate ?? "",
    effective_date: rate?.effective_date ?? "",
  };
}

function toUpsertRequest(values: ExchangeRateFormValues): ExchangeRateUpsertRequest {
  const effectiveDate = values.effective_date.trim();
  return {
    currency_id: values.currency_id,
    rate_to_base: values.rate_to_base.trim(),
    effective_date: effectiveDate ? effectiveDate : null,
  };
}

export function ExchangeRateFormDialog({
  open,
  rate,
  onOpenChange,
}: {
  open: boolean;
  rate: ExchangeRate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const upsertExchangeRate = useUpsertExchangeRate();
  const currenciesQuery = useAllCurrencies(open);
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(rate);
  const currencies = currenciesQuery.data ?? [];

  const form = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(ExchangeRateFormSchema),
    values: toFormValues(rate),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: ExchangeRateFormValues) {
    setFormError(null);
    try {
      await upsertExchangeRate.mutateAsync(toUpsertRequest(values));
      toast.success(isEdit ? "Exchange rate updated" : "Exchange rate saved");
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = upsertExchangeRate.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Exchange Rate" : "New Exchange Rate"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={currenciesQuery.isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} · {currency.name}
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
              name="rate_to_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate to base</FormLabel>
                  <FormControl>
                    <Input placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effective_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {isEdit ? "Save Changes" : "Save Exchange Rate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
