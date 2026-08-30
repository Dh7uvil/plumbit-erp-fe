"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useCreatePriceList } from "@/modules/inventory-management/price-lists/mutations";
import { priceListPermissions } from "@/modules/inventory-management/price-lists/permissions";
import {
  PRICE_LIST_TYPE_LABELS,
  PRICE_LIST_TYPES,
  PriceListFormSchema,
  type PriceListCreateRequest,
  type PriceListFormValues,
} from "@/modules/inventory-management/price-lists/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useCan } from "@/shared/providers/session-provider";

const EMPTY_FORM: PriceListFormValues = {
  name: "",
  currency_id: "",
  list_type: "PERCENT",
  percent: "",
  is_active: true,
};

function toCreateRequest(values: PriceListFormValues): PriceListCreateRequest {
  return {
    name: values.name.trim(),
    currency_id: values.currency_id,
    list_type: values.list_type,
    percent: values.list_type === "PERCENT" ? values.percent.trim() : null,
  };
}

export function PriceListFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
}) {
  const can = useCan();
  const { canCreate } = useCrudPermissions(priceListPermissions);
  const createPriceList = useCreatePriceList();
  const currenciesQuery = useAllCurrencies(open);
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingCurrency, setCreatingCurrency] = useState(false);
  const currencies = currenciesQuery.data ?? [];

  const form = useForm<PriceListFormValues>({
    resolver: zodResolver(PriceListFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const listType = useWatch({ control: form.control, name: "list_type" });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
      form.reset(EMPTY_FORM);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: PriceListFormValues) {
    if (!canCreate) {
      return;
    }
    setFormError(null);
    try {
      const created = await createPriceList.mutateAsync(toCreateRequest(values));
      toast.success("Price list created");
      onCreated?.(created);
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createPriceList.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent nested={nested} className="overflow-visible sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Price List</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={canCreate ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
            className="flex flex-col gap-3"
          >
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className={listType !== "PERCENT" ? "sm:col-span-2" : undefined}>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Retail"
                        maxLength={150}
                        disabled={!canCreate}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {listType === "PERCENT" ? (
                <FormField
                  control={form.control}
                  name="percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percent</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="decimal"
                          placeholder="10"
                          disabled={!canCreate}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <FormField
                control={form.control}
                name="currency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <MasterSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={currenciesQuery.isLoading || !canCreate}
                      placeholder="Select a currency"
                      searchPlaceholder="Search currency…"
                      createLabel="Create currency"
                      onCreate={
                        can(currencyPermissions.create) && canCreate
                          ? () => setCreatingCurrency(true)
                          : undefined
                      }
                      options={currencies.map((currency) => ({
                        value: currency.id,
                        label: `${currency.code} — ${currency.name}`,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="list_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!canCreate}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRICE_LIST_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {PRICE_LIST_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormDialogFooter
              pending={pending}
              canSubmit={canCreate}
              submitLabel="Create Price List"
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
