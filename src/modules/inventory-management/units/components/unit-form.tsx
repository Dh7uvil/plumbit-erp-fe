"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateUnit, useUpdateUnit } from "@/modules/inventory-management/units/mutations";
import {
  UnitFormSchema,
  type Unit,
  type UnitCreateRequest,
  type UnitFormValues,
} from "@/modules/inventory-management/units/schemas";
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

function toFormValues(unit: Unit | null): UnitFormValues {
  return {
    code: unit?.code ?? "",
    name: unit?.name ?? "",
    is_active: unit?.is_active ?? true,
  };
}

function toCreateRequest(values: UnitFormValues): UnitCreateRequest {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
  };
}

export function UnitForm({
  unit,
  disabled = false,
  onSuccess,
  showCancel = false,
  onCancel,
}: {
  unit: Unit | null;
  disabled?: boolean;
  onSuccess?: (entity: { id: string }) => void;
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(unit);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(UnitFormSchema),
    values: toFormValues(unit),
  });
  useDirtyFormGuard(form.formState.isDirty && !disabled);

  async function onSubmit(values: UnitFormValues) {
    setFormError(null);
    try {
      if (unit) {
        await updateUnit.mutateAsync({
          id: unit.id,
          values: {
            name: values.name.trim(),
            is_active: values.is_active,
          },
        });
        toast.success("Unit updated");
        onSuccess?.(unit);
      } else {
        const created = await createUnit.mutateAsync(toCreateRequest(values));
        toast.success("Unit created");
        onSuccess?.(created);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createUnit.isPending || updateUnit.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={disabled ? (event) => event.preventDefault() : form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
        <div className={isEdit ? "flex flex-col gap-3" : "grid grid-cols-1 gap-3 sm:grid-cols-2"}>
          {!isEdit ? (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="KG" maxLength={20} disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Kilogram" maxLength={100} disabled={disabled} {...field} />
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
                {isEdit ? "Save Changes" : "Create Unit"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </form>
    </Form>
  );
}
