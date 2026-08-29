"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  useCreatePaymentTerm,
  useUpdatePaymentTerm,
} from "@/modules/erp/accounting/payment-terms/mutations";
import {
  PaymentTermFormSchema,
  type PaymentTerm,
  type PaymentTermCreateRequest,
  type PaymentTermFormValues,
} from "@/modules/erp/accounting/payment-terms/schemas";
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

function toFormValues(term: PaymentTerm | null): PaymentTermFormValues {
  return {
    name: term?.name ?? "",
    days: term?.days ?? 0,
    description: term?.description ?? "",
    is_active: term?.is_active ?? true,
  };
}

function toCreateRequest(values: PaymentTermFormValues): PaymentTermCreateRequest {
  const description = values.description.trim();
  return {
    name: values.name.trim(),
    days: values.days,
    description: description ? description : null,
  };
}

export function PaymentTermFormDialog({
  open,
  term,
  onOpenChange,
}: {
  open: boolean;
  term: PaymentTerm | null;
  onOpenChange: (open: boolean) => void;
}) {
  const createPaymentTerm = useCreatePaymentTerm();
  const updatePaymentTerm = useUpdatePaymentTerm();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(term);

  const form = useForm<PaymentTermFormValues>({
    resolver: zodResolver(PaymentTermFormSchema),
    values: toFormValues(term),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: PaymentTermFormValues) {
    setFormError(null);
    const payload = toCreateRequest(values);
    try {
      if (term) {
        await updatePaymentTerm.mutateAsync({
          id: term.id,
          values: {
            ...payload,
            is_active: values.is_active,
          },
        });
        toast.success("Payment term updated");
      } else {
        await createPaymentTerm.mutateAsync(payload);
        toast.success("Payment term created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createPaymentTerm.isPending || updatePaymentTerm.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Payment Term" : "New Payment Term"}</DialogTitle>
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
                      <Input placeholder="Net 30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={3650}
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
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
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
                {isEdit ? "Save Changes" : "Create Payment Term"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
