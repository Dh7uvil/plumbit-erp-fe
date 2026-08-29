"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, CheckCircle, ChevronLeft, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { COMPANY_EMAIL_PLACEHOLDER } from "@/config/constants";
import { useForgotPassword } from "@/modules/users-management/auth/mutations";
import {
  ForgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/modules/users-management/auth/schemas";
import { useAuthBrandSelection } from "@/modules/users-management/auth/components/auth-brand";
import { TenantOrgOption } from "@/modules/users-management/tenants/components/tenant-org-option";
import { findOrganizationTenantId } from "@/modules/users-management/tenants/organization";
import { useTenants } from "@/modules/users-management/tenants/queries";
import { Button } from "@/shared/components/ui/button";
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
import { getErrorMessage, isApiError } from "@/shared/api/errors";
import { useIsClient } from "@/shared/hooks/use-is-client";
import { applyFieldErrors } from "@/shared/lib/form-errors";

export function ForgotPasswordForm() {
  const tenantsQuery = useTenants();
  const isClient = useIsClient();
  const { setSelectedTenantId } = useAuthBrandSelection();
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: {
      tenant_id: "",
      email: "",
    },
  });

  useEffect(() => {
    const tenants = tenantsQuery.data;
    if (!tenants?.length || form.getValues("tenant_id")) {
      return;
    }
    const tenantId = findOrganizationTenantId(tenants);
    if (tenantId) {
      form.setValue("tenant_id", tenantId, { shouldValidate: true });
      setSelectedTenantId(tenantId);
    }
  }, [form, setSelectedTenantId, tenantsQuery.data]);

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null);
    try {
      await forgotPassword.mutateAsync(values);
      setSubmitted(true);
    } catch (error) {
      if (
        isApiError(error) &&
        error.code === "VALIDATION_ERROR" &&
        applyFieldErrors(error, form.setError)
      ) {
        return;
      }
      if (isApiError(error) && error.status >= 500) {
        setFormError(getErrorMessage(error));
        return;
      }
      setSubmitted(true);
    }
  }

  const tenants = tenantsQuery.data ?? [];
  const tenantsLoading = !isClient || tenantsQuery.isLoading;
  const pending = forgotPassword.isPending || form.formState.isSubmitting;

  return (
    <>
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Back to sign in
      </Link>
      <div className="mb-7">
        <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-full">
          <KeyRound className="text-primary size-5" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold">Forgot your password?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your organization and company email. If an account exists, we will send reset
          instructions.
        </p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle className="text-chart-2 size-9" aria-hidden="true" />
          <p className="text-center text-sm font-medium">
            If an account exists for that email, we sent reset instructions.
          </p>
          <p className="text-muted-foreground text-center text-xs">
            Check your inbox and follow the link to choose a new password.
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}

            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedTenantId(value);
                    }}
                    value={field.value}
                    disabled={tenantsLoading}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Organization">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                          <TenantOrgOption name={tenant.name} logoUrl={tenant.logo_url} />
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email</FormLabel>
                  <div className="relative">
                    <AtSign
                      className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder={COMPANY_EMAIL_PLACEHOLDER}
                        className="pl-9"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Send Reset Link
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
