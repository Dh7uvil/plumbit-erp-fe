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

export function UnitFormDialog({
  open,
  unit,
  onOpenChange,
}: {
  open: boolean;
  unit: Unit | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(unit);

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(UnitFormSchema),
    values: toFormValues(unit),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

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
      } else {
        await createUnit.mutateAsync(toCreateRequest(values));
        toast.success("Unit created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createUnit.isPending || updateUnit.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Unit" : "New Unit"}</DialogTitle>
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
                      <Input placeholder="KG" maxLength={20} disabled={isEdit} {...field} />
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
                      <Input placeholder="Kilogram" maxLength={100} {...field} />
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
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-2">
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
                {isEdit ? "Save Changes" : "Create Unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
