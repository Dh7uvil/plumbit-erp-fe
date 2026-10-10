"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { AccountPicker } from "@/modules/erp/accounting/accounts/components/account-picker";
import {
  useCreateChargeType,
  useUpdateChargeType,
} from "@/modules/erp/accounting/charge-types/mutations";
import {
  CHARGE_ALLOCATION_METHOD_LABELS,
  CHARGE_ALLOCATION_METHODS,
  CHARGE_APPLIES_TO_LABELS,
  ChargeTypeFormSchema,
  type ChargeType,
  type ChargeTypeCreateRequest,
  type ChargeTypeFormValues,
  type ChargeTypeUpdateRequest,
} from "@/modules/erp/accounting/charge-types/schemas";
import { useAllTaxes } from "@/modules/erp/accounting/taxes/queries";
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
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { MasterSelect } from "@/shared/components/form/master-select";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useState } from "react";

function optionalUuid(value: string): string | null {
  return !value || value === OPTIONAL_SELECT_NONE ? null : value;
}

function toFormValues(chargeType: ChargeType | null): ChargeTypeFormValues {
  if (!chargeType) {
    return {
      code: "",
      name: "",
      sort_order: "0",
      is_inventoriable: false,
      default_account_id: OPTIONAL_SELECT_NONE,
      allocation_basis: OPTIONAL_SELECT_NONE,
      default_tax_id: OPTIONAL_SELECT_NONE,
      applies_to: "BOTH",
      is_active: true,
    };
  }
  return {
    code: chargeType.code,
    name: chargeType.name,
    sort_order: String(chargeType.sort_order),
    is_inventoriable: chargeType.is_inventoriable,
    default_account_id: chargeType.default_account_id,
    allocation_basis: chargeType.allocation_basis ?? OPTIONAL_SELECT_NONE,
    default_tax_id: chargeType.default_tax_id ?? OPTIONAL_SELECT_NONE,
    applies_to: chargeType.applies_to,
    is_active: chargeType.is_active,
  };
}

function toCreateRequest(values: ChargeTypeFormValues): ChargeTypeCreateRequest {
  const sortOrder = Number.parseInt(values.sort_order.trim() || "0", 10);
  return {
    code: values.code.trim().toUpperCase().replace(/\s+/g, "_"),
    name: values.name.trim(),
    sort_order: Number.isFinite(sortOrder) ? Math.max(0, sortOrder) : 0,
    is_inventoriable: values.is_inventoriable,
    default_account_id: values.default_account_id,
    allocation_basis:
      values.allocation_basis === OPTIONAL_SELECT_NONE
        ? null
        : (values.allocation_basis as ChargeTypeCreateRequest["allocation_basis"]),
    default_tax_id: optionalUuid(values.default_tax_id),
    applies_to: values.applies_to,
  };
}

function toUpdateRequest(values: ChargeTypeFormValues): ChargeTypeUpdateRequest {
  const created = toCreateRequest(values);
  return {
    name: created.name,
    sort_order: created.sort_order,
    is_inventoriable: created.is_inventoriable,
    default_account_id: created.default_account_id,
    allocation_basis: created.allocation_basis,
    default_tax_id: created.default_tax_id,
    applies_to: created.applies_to,
    is_active: values.is_active,
  };
}

export function ChargeTypeForm({
  chargeType,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  chargeType: ChargeType | null;
  disabled?: boolean;
  onSuccess?: (entity: ChargeType) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createChargeType = useCreateChargeType();
  const updateChargeType = useUpdateChargeType();
  const taxesQuery = useAllTaxes();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(chargeType);

  const form = useForm<ChargeTypeFormValues>({
    resolver: zodResolver(ChargeTypeFormSchema),
    values: toFormValues(chargeType),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: ChargeTypeFormValues) {
    setFormError(null);
    if (values.default_account_id === OPTIONAL_SELECT_NONE) {
      form.setError("default_account_id", { message: "Select a default GL account" });
      return;
    }
    try {
      if (chargeType) {
        const updated = await updateChargeType.mutateAsync({
          id: chargeType.id,
          payload: toUpdateRequest(values),
        });
        toast.success("Charge type updated");
        onSuccess?.(updated);
      } else {
        const created = await createChargeType.mutateAsync(toCreateRequest(values));
        toast.success("Charge type created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createChargeType.isPending || updateChargeType.isPending;
  const taxes = taxesQuery.data ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={disabled || isEdit}
                    className="font-mono uppercase"
                    placeholder="FREIGHT"
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
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} placeholder="Freight charges" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort order</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applies_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applies to</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["IMPORT", "EXPORT", "BOTH"] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {CHARGE_APPLIES_TO_LABELS[value]}
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
            name="default_account_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Default GL account</FormLabel>
                <AccountPicker
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  asFormControl={false}
                  placeholder="Select account"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="allocation_basis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Allocation basis</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  asFormControl={false}
                  placeholder="Follow charge allocation"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "Follow charge allocation" },
                    ...CHARGE_ALLOCATION_METHODS.map((method) => ({
                      value: method,
                      label: CHARGE_ALLOCATION_METHOD_LABELS[method],
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="default_tax_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default tax</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || taxesQuery.isLoading}
                  asFormControl={false}
                  placeholder="None"
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...taxes.map((tax) => ({
                      value: tax.id,
                      label: `${tax.name} (${tax.rate}%)`,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="is_inventoriable"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="charge-inventoriable"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={disabled}
                />
                <Label htmlFor="charge-inventoriable">Capitalize to stock (inventoriable)</Label>
              </div>
            </FormItem>
          )}
        />
        {isEdit ? (
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="charge-active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    disabled={disabled}
                  />
                  <Label htmlFor="charge-active">Active</Label>
                </div>
              </FormItem>
            )}
          />
        ) : null}
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className="flex justify-end gap-2">
          {showCancel ? (
            <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={disabled || pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? "Save charge type" : "Create charge type"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
