"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateBranch, useUpdateBranch } from "@/modules/users-management/branches/mutations";
import {
  BranchFormSchema,
  type Branch,
  type BranchCreateRequest,
  type BranchFormValues,
} from "@/modules/users-management/branches/schemas";
import type { AddressFormValues, AddressPayload } from "@/modules/users-management/tenants/schemas";
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

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toAddressPayload(address: AddressFormValues): AddressPayload | null {
  const payload: AddressPayload = {
    address_line_1: emptyToNull(address.address_line_1),
    address_line_2: emptyToNull(address.address_line_2),
    city: emptyToNull(address.city),
    state: emptyToNull(address.state),
    country: emptyToNull(address.country),
    country_code: emptyToNull(address.country_code),
    postal_code: emptyToNull(address.postal_code),
  };
  return Object.values(payload).some(Boolean) ? payload : null;
}

function toFormValues(branch: Branch | null): BranchFormValues {
  return {
    name: branch?.name ?? "",
    code: branch?.code ?? "",
    status: branch?.status ?? "ACTIVE",
    phone: branch?.phone ?? "",
    timezone: branch?.timezone ?? "",
    address: {
      address_line_1: branch?.address?.address_line_1 ?? "",
      address_line_2: branch?.address?.address_line_2 ?? "",
      city: branch?.address?.city ?? "",
      state: branch?.address?.state ?? "",
      country: branch?.address?.country ?? "",
      country_code: branch?.address?.country_code ?? "",
      postal_code: branch?.address?.postal_code ?? "",
    },
  };
}

function toRequest(values: BranchFormValues): BranchCreateRequest {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    status: values.status,
    phone: emptyToNull(values.phone),
    timezone: emptyToNull(values.timezone),
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
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const [formError, setFormError] = useState<string | null>(null);
  const isEdit = Boolean(branch);

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
      <DialogContent className="sm:max-w-lg">
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
                    <FormControl>
                      <Input placeholder="America/Los_Angeles" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.address_line_1"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.address_line_2"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite, floor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code</FormLabel>
                    <FormControl>
                      <Input placeholder="Postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.country_code"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Country code</FormLabel>
                    <FormControl>
                      <Input placeholder="US" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
      </DialogContent>
    </Dialog>
  );
}
