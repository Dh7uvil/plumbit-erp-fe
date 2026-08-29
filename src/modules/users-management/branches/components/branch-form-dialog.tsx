"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCreateBranch, useUpdateBranch } from "@/modules/users-management/branches/mutations";
import {
  BranchFormSchema,
  type Branch,
  type BranchCreateRequest,
  type BranchFormValues,
} from "@/modules/users-management/branches/schemas";
import {
  addressToFormValues,
  emptyToNull,
  toAddressPayload,
} from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { AddressFields } from "@/shared/components/form/address-fields";
import { SearchableSelect } from "@/shared/components/form/searchable-select";
import { TimezoneSelect } from "@/shared/components/form/timezone-select";
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
import { useCan } from "@/shared/providers/session-provider";

function toFormValues(branch: Branch | null): BranchFormValues {
  return {
    name: branch?.name ?? "",
    code: branch?.code ?? "",
    status: branch?.status ?? "ACTIVE",
    phone: branch?.phone ?? "",
    timezone: branch?.timezone ?? "",
    default_currency_id: branch?.default_currency_id ?? OPTIONAL_SELECT_NONE,
    address: addressToFormValues(branch?.address),
  };
}

function toRequest(values: BranchFormValues): BranchCreateRequest {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    status: values.status,
    phone: emptyToNull(values.phone),
    timezone: emptyToNull(values.timezone),
    default_currency_id:
      values.default_currency_id === OPTIONAL_SELECT_NONE ? null : values.default_currency_id,
    address: toAddressPayload(values.address),
  };
}

export function BranchFormDialog({
  open,
  branch,
  onOpenChange,
}: {
  open: boolean;
  branch: Branch | null;
  onOpenChange: (open: boolean) => void;
}) {
  const can = useCan();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const currenciesQuery = useAllCurrencies(open && can(currencyPermissions.read));
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(branch);
  const currencies = currenciesQuery.data ?? [];

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(BranchFormSchema),
    values: toFormValues(branch),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: BranchFormValues) {
    setFormError(null);
    const payload = toRequest(values);
    try {
      if (branch) {
        await updateBranch.mutateAsync({ id: branch.id, values: payload });
        toast.success("Branch updated");
      } else {
        await createBranch.mutateAsync(payload);
        toast.success("Branch created");
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createBranch.isPending || updateBranch.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Branch" : "New Branch"}</DialogTitle>
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
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. West Coast Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="WCO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1-555-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <TimezoneSelect value={field.value} onValueChange={field.onChange} allowEmpty />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {can(currencyPermissions.read) ? (
                <FormField
                  control={form.control}
                  name="default_currency_id"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Default currency</FormLabel>
                      <SearchableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={currenciesQuery.isLoading}
                        placeholder="Optional"
                        searchPlaceholder="Search currency…"
                        options={[
                          { value: OPTIONAL_SELECT_NONE, label: "None" },
                          ...currencies.map((currency) => ({
                            value: currency.id,
                            label: `${currency.code} — ${currency.name}`,
                          })),
                        ]}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <AddressFields control={form.control} name="address" />
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
                {isEdit ? "Save Changes" : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {branch ? <EntityAttachmentsPanel entityType="BRANCH" entityId={branch.id} /> : null}
      </DialogContent>
    </Dialog>
  );
}
