"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useCreatePriceList } from "@/modules/inventory-management/price-lists/mutations";
import {
  PRICE_LIST_TYPE_LABELS,
  PRICE_LIST_TYPES,
  PriceListFormSchema,
  type PriceListCreateRequest,
  type PriceListFormValues,
} from "@/modules/inventory-management/price-lists/schemas";
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createPriceList = useCreatePriceList();
  const currenciesQuery = useAllCurrencies(open);
  const [formError, setFormError] = useState<string | null>(null);
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
    setFormError(null);
    try {
      await createPriceList.mutateAsync(toCreateRequest(values));
      toast.success("Price list created");
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Price List</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Retail" maxLength={150} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                            {currency.code} — {currency.name}
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
                name="list_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
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
              {listType === "PERCENT" ? (
                <FormField
                  control={form.control}
                  name="percent"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Percent</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
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
                Create Price List
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
