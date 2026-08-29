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
import { applyFieldErrors } from "@/shared/lib/form-errors";

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

export function CurrencyFormDialog({
  open,
  currency,
  onOpenChange,
}: {
  open: boolean;
  currency: Currency | null;
  onOpenChange: (open: boolean) => void;
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

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

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
      } else {
        await createCurrency.mutateAsync(toCreateRequest(values));
        toast.success("Currency created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createCurrency.isPending || updateCurrency.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Currency" : "New Currency"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="AED" maxLength={3} disabled={isEdit} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="د.إ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="UAE Dirham" {...field} />
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
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2 sm:col-span-2">
                <FormField
                  control={form.control}
                  name="is_base"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          disabled={isBase}
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
                {isEdit ? "Save Changes" : "Create Currency"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
