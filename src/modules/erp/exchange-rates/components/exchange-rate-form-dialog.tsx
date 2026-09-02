"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useUpsertExchangeRate } from "@/modules/erp/exchange-rates/mutations";
import { exchangeRatePermissions } from "@/modules/erp/exchange-rates/permissions";
import {
  ExchangeRateFormSchema,
  type ExchangeRate,
  type ExchangeRateFormValues,
  type ExchangeRateUpsertRequest,
} from "@/modules/erp/exchange-rates/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogFooter } from "@/shared/components/form/form-dialog-footer";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
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
import { useCan } from "@/shared/providers/session-provider";

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
  forceReadOnly = false,
}: {
  open: boolean;
  rate: ExchangeRate | null;
  onOpenChange: (open: boolean) => void;
  forceReadOnly?: boolean;
}) {
  const can = useCan();
  const { canCreate, canUpdate } = useCrudPermissions(exchangeRatePermissions);
  const upsertExchangeRate = useUpsertExchangeRate();
  const currenciesQuery = useAllCurrencies(open);
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingCurrency, setCreatingCurrency] = useState(false);
  const hasRecord = Boolean(rate);
  const { mode, readOnly, canSubmit } = resolveFormDialogMode({
    hasRecord,
    canCreate,
    canUpdate,
    forceReadOnly,
  });
  const currencies = currenciesQuery.data ?? [];

  const form = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(ExchangeRateFormSchema),
    values: toFormValues(rate),
  });
  useDirtyFormGuard(open && canSubmit && form.formState.isDirty);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: ExchangeRateFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      await upsertExchangeRate.mutateAsync(toUpsertRequest(values));
      toast.success(hasRecord ? "Exchange rate updated" : "Exchange rate saved");
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
          <DialogTitle>{formDialogTitle("Exchange Rate", mode)}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
            className="flex flex-col gap-3"
          >
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="currency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <MasterSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={currenciesQuery.isLoading || readOnly}
                      placeholder="Select a currency"
                      searchPlaceholder="Search currency…"
                      createLabel="Create currency"
                      onCreate={
                        can(currencyPermissions.create) && !readOnly
                          ? () => setCreatingCurrency(true)
                          : undefined
                      }
                      options={currencies.map((currency) => ({
                        value: currency.id,
                        label: `${currency.code} · ${currency.name}`,
                      }))}
                    />
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
                      <Input placeholder="1" disabled={readOnly} {...field} />
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
                      <Input type="date" disabled={readOnly} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormDialogFooter
              pending={pending}
              canSubmit={canSubmit}
              submitLabel={hasRecord ? "Save Changes" : "Save Exchange Rate"}
              onClose={() => handleOpenChange(false)}
            />
          </form>
        </Form>
        <CurrencyFormDialog
          open={creatingCurrency}
          currency={null}
          nested
          onCreated={(entity) => form.setValue("currency_id", entity.id)}
          onOpenChange={setCreatingCurrency}
        />
      </DialogContent>
    </Dialog>
  );
}
