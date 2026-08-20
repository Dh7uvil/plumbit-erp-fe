"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { useForm, type Control, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { useUpdateCurrentTenant } from "@/modules/users-management/tenants/mutations";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import {
  CompanySettingsFormSchema,
  type AddressPayload,
  type CompanySettingsFormValues,
  type TenantCurrent,
  type TenantCurrentUpdate,
} from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useCan } from "@/shared/providers/session-provider";

const EMPTY_ADDRESS = {
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  country: "",
  country_code: "",
  postal_code: "",
};

const EMPTY_FORM: CompanySettingsFormValues = {
  name: "",
  industry: "",
  website: "",
  contact_email: "",
  phone: "",
  founded: "",
  headquarters: EMPTY_ADDRESS,
  default_currency: "",
  timezone: "",
  fiscal_year_start: "",
};

type CompanyTextFieldPath = Exclude<FieldPath<CompanySettingsFormValues>, "headquarters">;

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toFormValues(tenant: TenantCurrent): CompanySettingsFormValues {
  return {
    name: tenant.name,
    industry: tenant.industry ?? "",
    website: tenant.website ?? "",
    contact_email: tenant.contact_email ?? "",
    phone: tenant.phone ?? "",
    founded: tenant.founded ?? "",
    headquarters: {
      address_line_1: tenant.headquarters?.address_line_1 ?? "",
      address_line_2: tenant.headquarters?.address_line_2 ?? "",
      city: tenant.headquarters?.city ?? "",
      state: tenant.headquarters?.state ?? "",
      country: tenant.headquarters?.country ?? "",
      country_code: tenant.headquarters?.country_code ?? "",
      postal_code: tenant.headquarters?.postal_code ?? "",
    },
    default_currency: tenant.default_currency ?? "",
    timezone: tenant.timezone,
    fiscal_year_start: tenant.fiscal_year_start ?? "",
  };
}

function toAddressPayload(address: CompanySettingsFormValues["headquarters"]): AddressPayload | null {
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

function toUpdatePayload(values: CompanySettingsFormValues): TenantCurrentUpdate {
  return {
    name: values.name.trim(),
    timezone: values.timezone.trim(),
    industry: emptyToNull(values.industry),
    website: emptyToNull(values.website),
    contact_email: emptyToNull(values.contact_email),
    phone: emptyToNull(values.phone),
    founded: emptyToNull(values.founded),
    fiscal_year_start: emptyToNull(values.fiscal_year_start),
    default_currency: emptyToNull(values.default_currency.toUpperCase()),
    headquarters: toAddressPayload(values.headquarters),
  };
}

function TextField({
  control,
  name,
  label,
  disabled,
  className,
  ...inputProps
}: {
  control: Control<CompanySettingsFormValues>;
  name: CompanyTextFieldPath;
  label: string;
  disabled: boolean;
  className?: string;
} & Omit<ComponentProps<typeof Input>, "name" | "disabled">) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-muted-foreground text-xs font-medium">{label}</FormLabel>
          <FormControl>
            <Input disabled={disabled} {...inputProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function CompanySettingsForm() {
  const can = useCan();
  const canUpdate = can(organizationSettingsPermissions.update);
  const tenantQuery = useCurrentTenant();
  const updateTenant = useUpdateCurrentTenant();
  const [formError, setFormError] = useState<string | null>(null);
  const tenant = tenantQuery.data;

  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(CompanySettingsFormSchema),
    defaultValues: EMPTY_FORM,
    values: tenant ? toFormValues(tenant) : undefined,
  });

  async function onSubmit(values: CompanySettingsFormValues) {
    setFormError(null);
    try {
      await updateTenant.mutateAsync(toUpdatePayload(values));
      toast.success("Company settings saved");
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  if (tenantQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (tenantQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(tenantQuery.error)}
        onRetry={() => tenantQuery.refetch()}
      />
    );
  }

  const overview = [
    { label: "Total Users", value: tenant?.users_count ?? 0 },
    { label: "Departments", value: tenant?.departments_count ?? 0 },
    { label: "Branches", value: tenant?.branches_count ?? 0 },
  ];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="space-y-4 lg:col-span-2">
          {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField control={form.control} name="name" label="Company Name" disabled={!canUpdate} />
              <TextField control={form.control} name="industry" label="Industry" disabled={!canUpdate} />
              <TextField control={form.control} name="website" label="Website" disabled={!canUpdate} />
              <TextField
                control={form.control}
                name="contact_email"
                label="Contact Email"
                type="email"
                disabled={!canUpdate}
              />
              <TextField control={form.control} name="phone" label="Phone" disabled={!canUpdate} />
              <TextField control={form.control} name="founded" label="Founded" disabled={!canUpdate} />
              <TextField
                control={form.control}
                name="headquarters.address_line_1"
                label="Address line 1"
                disabled={!canUpdate}
              />
              <TextField
                control={form.control}
                name="headquarters.address_line_2"
                label="Address line 2"
                disabled={!canUpdate}
              />
              <TextField control={form.control} name="headquarters.city" label="City" disabled={!canUpdate} />
              <TextField control={form.control} name="headquarters.state" label="State" disabled={!canUpdate} />
              <TextField
                control={form.control}
                name="headquarters.country"
                label="Country"
                disabled={!canUpdate}
              />
              <TextField
                control={form.control}
                name="headquarters.country_code"
                label="Country code"
                disabled={!canUpdate}
              />
              <TextField
                control={form.control}
                name="headquarters.postal_code"
                label="Postal code"
                className="sm:col-span-2"
                disabled={!canUpdate}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="default_currency"
                label="Default Currency"
                maxLength={3}
                placeholder="USD"
                disabled={!canUpdate}
              />
              <TextField
                control={form.control}
                name="timezone"
                label="Timezone"
                placeholder="America/Los_Angeles"
                disabled={!canUpdate}
              />
              <TextField
                control={form.control}
                name="fiscal_year_start"
                label="Fiscal year start"
                className="sm:col-span-2"
                disabled={!canUpdate}
              />
            </CardContent>
            {canUpdate ? (
              <CardFooter className="justify-end">
                <Button type="submit" disabled={updateTenant.isPending}>
                  {updateTenant.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save Settings
                </Button>
              </CardFooter>
            ) : null}
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between border-b py-1.5 last:border-0"
                >
                  <span className="text-muted-foreground text-sm">{item.label}</span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}
