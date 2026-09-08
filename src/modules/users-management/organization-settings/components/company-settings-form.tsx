"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useForm, type Control, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { CurrencyFormDialog } from "@/modules/erp/currencies/components/currency-form-dialog";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import type { Currency } from "@/modules/erp/currencies/schemas";
import { CompanyLogoCard } from "@/modules/users-management/organization-settings/components/company-logo-card";
import { organizationSettingsPermissions } from "@/modules/users-management/organization-settings/permissions";
import { useUpdateCurrentTenant } from "@/modules/users-management/tenants/mutations";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import {
  CompanySettingsFormSchema,
  EMPTY_ADDRESS_FORM,
  emptyToNull,
  toAddressPayload,
  type AddressFormValues,
  type CompanySettingsFormValues,
  type TenantCurrent,
  type TenantCurrentUpdate,
} from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { AddressFields } from "@/shared/components/form/address-fields";
import { MasterSelect } from "@/shared/components/form/master-select";
import { TimezoneSelect } from "@/shared/components/form/timezone-select";
import { Button } from "@/shared/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useIsClient } from "@/shared/hooks/use-is-client";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

const EMPTY_FORM: CompanySettingsFormValues = {
  name: "",
  industry: "",
  website: "",
  contact_email: "",
  phone: "",
  founded: "",
  headquarters: EMPTY_ADDRESS_FORM,
  default_currency: "",
  default_currency_id: OPTIONAL_SELECT_NONE,
  quotation_requires_approval: true,
  allow_negative_stock: false,
  timezone: "",
  fiscal_year_start: "",
};

const EMPTY_CURRENCIES: Currency[] = [];

type CompanyTextFieldPath = Exclude<
  FieldPath<CompanySettingsFormValues>,
  "headquarters" | "quotation_requires_approval" | "allow_negative_stock"
>;

function toCurrencyCode(code: string | null | undefined): string | null {
  const normalized = (code ?? "").trim().toUpperCase();
  return normalized.length === 3 ? normalized : null;
}

function resolveDefaultCurrencyId(tenant: TenantCurrent, currencies: Currency[]): string {
  if (tenant.default_currency_id) {
    return tenant.default_currency_id;
  }
  const code = toCurrencyCode(tenant.default_currency);
  if (!code) {
    return OPTIONAL_SELECT_NONE;
  }
  return (
    currencies.find((currency) => currency.code.toUpperCase() === code)?.id ?? OPTIONAL_SELECT_NONE
  );
}

function toFormValues(
  tenant: TenantCurrent,
  currencies: Currency[] = [],
): CompanySettingsFormValues {
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
    default_currency_id: resolveDefaultCurrencyId(tenant, currencies),
    quotation_requires_approval: tenant.quotation_requires_approval,
    allow_negative_stock: tenant.allow_negative_stock,
    timezone: tenant.timezone ?? "",
    fiscal_year_start: tenant.fiscal_year_start ?? "",
  };
}

function currencySelectValue(
  selectedId: string | undefined,
  currencyCode: string,
  currencies: Currency[],
): string {
  if (selectedId && selectedId !== OPTIONAL_SELECT_NONE) {
    return selectedId;
  }
  const code = toCurrencyCode(currencyCode);
  if (!code) {
    return OPTIONAL_SELECT_NONE;
  }
  return (
    currencies.find((currency) => currency.code.toUpperCase() === code)?.id ?? OPTIONAL_SELECT_NONE
  );
}

function currencySelectLabel(
  selectValue: string,
  currencies: Currency[],
  fallbackCode: string,
): string {
  if (selectValue === OPTIONAL_SELECT_NONE) {
    return "None";
  }
  const selected = currencies.find((currency) => currency.id === selectValue);
  if (selected) {
    return `${selected.code} — ${selected.name}`;
  }
  return fallbackCode.trim() || "Current currency";
}

function sameText(left: string, right: string): boolean {
  return left.trim() === right.trim();
}

function isSameAddress(left: AddressFormValues, right: AddressFormValues): boolean {
  return (
    sameText(left.address_line_1, right.address_line_1) &&
    sameText(left.address_line_2, right.address_line_2) &&
    sameText(left.city, right.city) &&
    sameText(left.state, right.state) &&
    sameText(left.country, right.country) &&
    sameText(left.country_code, right.country_code) &&
    sameText(left.postal_code, right.postal_code)
  );
}

function isSameCompany(left: CompanySettingsFormValues, right: CompanySettingsFormValues): boolean {
  return (
    sameText(left.name, right.name) &&
    sameText(left.industry, right.industry) &&
    sameText(left.website, right.website) &&
    sameText(left.contact_email, right.contact_email) &&
    sameText(left.phone, right.phone) &&
    sameText(left.founded, right.founded) &&
    isSameAddress(left.headquarters, right.headquarters)
  );
}

function toCompanyPayload(values: CompanySettingsFormValues): TenantCurrentUpdate {
  return {
    name: values.name.trim(),
    industry: emptyToNull(values.industry),
    website: emptyToNull(values.website),
    contact_email: emptyToNull(values.contact_email),
    phone: emptyToNull(values.phone),
    founded: emptyToNull(values.founded),
    headquarters: toAddressPayload(values.headquarters),
  };
}

function toRegionalPayload(
  values: CompanySettingsFormValues,
  currencyCode: string | null,
): TenantCurrentUpdate {
  const selectedId = values.default_currency_id;
  const currencyId = !selectedId || selectedId === OPTIONAL_SELECT_NONE ? null : selectedId;
  const timezone = emptyToNull(values.timezone);
  return {
    ...(timezone ? { timezone } : {}),
    fiscal_year_start: emptyToNull(values.fiscal_year_start),
    default_currency: toCurrencyCode(currencyCode ?? values.default_currency),
    default_currency_id: currencyId,
    quotation_requires_approval: values.quotation_requires_approval,
    allow_negative_stock: values.allow_negative_stock,
  };
}

function EditSaveActions({
  pending,
  onCancel,
  onSave,
}: {
  pending: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" size="sm" disabled={pending} onClick={onSave}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Save
      </Button>
    </div>
  );
}

function SettingsFieldItem({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <FormItem className={className}>
      <FormLabel className="text-muted-foreground text-xs font-medium">{label}</FormLabel>
      <div className="relative">
        {children}
        <FormMessage className="absolute top-full right-0 mt-0.5 max-w-full text-right text-xs leading-3" />
      </div>
    </FormItem>
  );
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
        <SettingsFieldItem label={label} className={className}>
          <FormControl>
            <Input disabled={disabled} {...inputProps} {...field} />
          </FormControl>
        </SettingsFieldItem>
      )}
    />
  );
}

export function CompanySettingsForm() {
  const can = useCan();
  const canUpdate = can(organizationSettingsPermissions.update);
  const canReadCurrencies = can(currencyPermissions.read);
  const tenantQuery = useCurrentTenant();
  const currenciesQuery = useAllCurrencies(canReadCurrencies);
  const updateTenant = useUpdateCurrentTenant();
  const isClient = useIsClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingRegional, setIsEditingRegional] = useState(false);
  const [currencyDraft, setCurrencyDraft] = useState(OPTIONAL_SELECT_NONE);
  const [creatingCurrency, setCreatingCurrency] = useState(false);
  const tenant = tenantQuery.data;
  const currencies = currenciesQuery.data ?? EMPTY_CURRENCIES;
  const isEditing = isEditingCompany || isEditingRegional;

  const form = useForm<CompanySettingsFormValues>({
    resolver: zodResolver(CompanySettingsFormSchema),
    defaultValues: EMPTY_FORM,
  });
  useDirtyFormGuard(isEditing && form.formState.isDirty);

  useEffect(() => {
    if (!tenant || isEditing) {
      return;
    }
    form.reset(toFormValues(tenant, currencies));
  }, [currencies, form, isEditing, tenant]);

  async function submitUpdate(payload: TenantCurrentUpdate) {
    setFormError(null);
    try {
      await updateTenant.mutateAsync(payload);
      const saved = form.getValues();
      if (payload.default_currency_id !== undefined) {
        saved.default_currency_id = payload.default_currency_id ?? OPTIONAL_SELECT_NONE;
      }
      if (payload.default_currency !== undefined) {
        saved.default_currency = payload.default_currency ?? "";
      }
      form.reset(saved);
      setCurrencyDraft(saved.default_currency_id);
      setIsEditingCompany(false);
      setIsEditingRegional(false);
      toast.success("Company settings saved");
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  function cancelCompany() {
    setFormError(null);
    if (tenant) {
      const current = form.getValues();
      const original = toFormValues(tenant, currencies);
      form.reset({
        ...current,
        name: original.name,
        industry: original.industry,
        website: original.website,
        contact_email: original.contact_email,
        phone: original.phone,
        founded: original.founded,
        headquarters: original.headquarters,
      });
    }
    setIsEditingCompany(false);
  }

  function cancelRegional() {
    setFormError(null);
    if (tenant) {
      const current = form.getValues();
      const original = toFormValues(tenant, currencies);
      form.reset({
        ...current,
        default_currency: original.default_currency,
        default_currency_id: original.default_currency_id,
        quotation_requires_approval: original.quotation_requires_approval,
        allow_negative_stock: original.allow_negative_stock,
        timezone: original.timezone,
        fiscal_year_start: original.fiscal_year_start,
      });
      setCurrencyDraft(original.default_currency_id);
    }
    setIsEditingRegional(false);
  }

  function saveCompany() {
    const values = form.getValues();
    if (tenant && isSameCompany(values, toFormValues(tenant, currencies))) {
      setIsEditingCompany(false);
      setFormError(null);
      return;
    }
    if (!values.name.trim()) {
      form.setError("name", { type: "manual", message: "Enter a company name" });
      return;
    }
    void submitUpdate(toCompanyPayload(values));
  }

  function saveRegional() {
    const selected = currencies.find((currency) => currency.id === currencyDraft);
    const values = {
      ...form.getValues(),
      default_currency_id: currencyDraft,
      default_currency: selected?.code ?? "",
    };
    form.setValue("default_currency_id", values.default_currency_id);
    form.setValue("default_currency", values.default_currency);
    void submitUpdate(toRegionalPayload(values, selected?.code ?? null));
  }

  if (!isClient || tenantQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64 lg:col-span-2" />
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
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
        }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {formError ? <p className="text-destructive col-span-full text-sm">{formError}</p> : null}
        <Card className="lg:col-span-2">
          <CardHeader className="items-center">
            <CardTitle className="text-base">Company Information</CardTitle>
            {canUpdate ? (
              <CardAction className="self-center">
                {isEditingCompany ? (
                  <EditSaveActions
                    pending={updateTenant.isPending}
                    onCancel={cancelCompany}
                    onSave={saveCompany}
                  />
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormError(null);
                      setIsEditingCompany(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                control={form.control}
                name="name"
                label="Company Name"
                disabled={!canUpdate || !isEditingCompany}
              />
              <TextField
                control={form.control}
                name="industry"
                label="Industry"
                disabled={!canUpdate || !isEditingCompany}
              />
              <TextField
                control={form.control}
                name="website"
                label="Website"
                disabled={!canUpdate || !isEditingCompany}
              />
              <TextField
                control={form.control}
                name="contact_email"
                label="Contact Email"
                type="email"
                disabled={!canUpdate || !isEditingCompany}
              />
              <TextField
                control={form.control}
                name="phone"
                label="Phone"
                disabled={!canUpdate || !isEditingCompany}
              />
              <TextField
                control={form.control}
                name="founded"
                label="Founded"
                disabled={!canUpdate || !isEditingCompany}
              />
            </div>
            <p className="text-sm font-medium">Headquarters</p>
            <AddressFields
              control={form.control}
              name="headquarters"
              disabled={!canUpdate || !isEditingCompany}
            />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <CompanyLogoCard />
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
        <Card className="lg:col-span-2">
          <CardHeader className="items-center">
            <CardTitle className="text-base">Regional Settings</CardTitle>
            {canUpdate ? (
              <CardAction className="self-center">
                {isEditingRegional ? (
                  <EditSaveActions
                    pending={updateTenant.isPending}
                    onCancel={cancelRegional}
                    onSave={saveRegional}
                  />
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormError(null);
                      setCurrencyDraft(
                        currencySelectValue(
                          form.getValues("default_currency_id"),
                          form.getValues("default_currency"),
                          currencies,
                        ),
                      );
                      setIsEditingRegional(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {canReadCurrencies && !currenciesQuery.isError ? (
              <FormField
                control={form.control}
                name="default_currency_id"
                render={({ field }) => {
                  const selectValue = currencySelectValue(
                    isEditingRegional ? currencyDraft : field.value,
                    form.getValues("default_currency"),
                    currencies,
                  );
                  const missingCurrent =
                    selectValue !== OPTIONAL_SELECT_NONE &&
                    !currencies.some((currency) => currency.id === selectValue);
                  const selectLabel = currencySelectLabel(
                    selectValue,
                    currencies,
                    form.getValues("default_currency"),
                  );
                  return (
                    <SettingsFieldItem label="Default Currency">
                      <MasterSelect
                        value={selectValue}
                        onValueChange={(id) => {
                          setCurrencyDraft(id);
                          field.onChange(id);
                          const selected = currencies.find((currency) => currency.id === id);
                          form.setValue("default_currency", selected?.code ?? "", {
                            shouldDirty: true,
                          });
                        }}
                        disabled={!canUpdate || !isEditingRegional || currenciesQuery.isLoading}
                        placeholder={selectLabel}
                        searchPlaceholder="Search currency…"
                        createLabel="Create currency"
                        onCreate={
                          can(currencyPermissions.create)
                            ? () => setCreatingCurrency(true)
                            : undefined
                        }
                        options={[
                          { value: OPTIONAL_SELECT_NONE, label: "None" },
                          ...(missingCurrent ? [{ value: selectValue, label: selectLabel }] : []),
                          ...currencies.map((currency) => ({
                            value: currency.id,
                            label: `${currency.code} — ${currency.name}`,
                          })),
                        ]}
                      />
                    </SettingsFieldItem>
                  );
                }}
              />
            ) : (
              <TextField
                control={form.control}
                name="default_currency"
                label="Default Currency"
                maxLength={3}
                placeholder="AED"
                disabled={!canUpdate || !isEditingRegional}
              />
            )}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <SettingsFieldItem label="Timezone">
                  <TimezoneSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canUpdate || !isEditingRegional}
                  />
                </SettingsFieldItem>
              )}
            />
            <TextField
              control={form.control}
              name="fiscal_year_start"
              label="Fiscal year start"
              disabled={!canUpdate || !isEditingRegional}
            />
            <FormField
              control={form.control}
              name="quotation_requires_approval"
              render={({ field }) => (
                <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={!canUpdate || !isEditingRegional}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel className="text-muted-foreground text-xs font-medium">
                    Quotations require approval before sending
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allow_negative_stock"
              render={({ field }) => (
                <FormItem className="col-span-full flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      disabled={!canUpdate || !isEditingRegional}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <FormLabel className="text-muted-foreground text-xs font-medium">
                    Allow negative stock
                  </FormLabel>
                </FormItem>
              )}
            />
            {tenant?.lock_date || tenant?.hard_lock_date ? (
              <p className="text-muted-foreground col-span-full text-xs">
                Period lock date {tenant.lock_date ?? "—"}
                {tenant.hard_lock_date ? ` · hard lock ${tenant.hard_lock_date}` : ""}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </form>
      <CurrencyFormDialog
        open={creatingCurrency}
        currency={null}
        nested
        onCreated={(entity) => {
          setCurrencyDraft(entity.id);
          form.setValue("default_currency_id", entity.id, { shouldDirty: true });
          form.setValue("default_currency", entity.code, { shouldDirty: true });
        }}
        onOpenChange={setCreatingCurrency}
      />
    </Form>
  );
}
