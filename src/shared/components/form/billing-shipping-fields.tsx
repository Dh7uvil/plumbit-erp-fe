"use client";

import { useEffect } from "react";
import { useFormContext, useWatch, type FieldValues } from "react-hook-form";

import {
  addressesMatch,
  type AddressFormValues,
} from "@/modules/users-management/tenants/schemas";
import { AddressFields } from "@/shared/components/form/address-fields";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/shared/components/ui/form";

type BillingShippingFormValues = FieldValues & {
  billing_address: AddressFormValues;
  shipping_address: AddressFormValues;
  same_as_billing: boolean;
};

export function BillingShippingFields({ disabled }: { disabled?: boolean }) {
  const { control, getValues, setValue } = useFormContext<BillingShippingFormValues>();
  const sameAsBilling = useWatch({ control, name: "same_as_billing" });
  const billingAddress = useWatch({ control, name: "billing_address" });

  useEffect(() => {
    if (!sameAsBilling || !billingAddress) {
      return;
    }
    const shippingAddress = getValues("shipping_address");
    if (!shippingAddress || addressesMatch(billingAddress, shippingAddress)) {
      return;
    }
    setValue(
      "shipping_address",
      { ...billingAddress },
      { shouldDirty: true, shouldValidate: false },
    );
  }, [billingAddress, getValues, sameAsBilling, setValue]);

  return (
    <>
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium">Billing address</p>
        <AddressFields control={control} name="billing_address" disabled={disabled} />
      </section>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Shipping address</p>
          <FormField
            control={control}
            name="same_as_billing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    disabled={disabled}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel>Same as billing address</FormLabel>
              </FormItem>
            )}
          />
        </div>
        <AddressFields
          control={control}
          name="shipping_address"
          disabled={disabled || Boolean(sameAsBilling)}
        />
      </section>
    </>
  );
}
