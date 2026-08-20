"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AtSign, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { COMPANY_EMAIL_PLACEHOLDER } from "@/config/constants";
import { useLogin } from "@/modules/users-management/auth/mutations";
import { LoginFormSchema, type LoginFormValues } from "@/modules/users-management/auth/schemas";
import { findOrganizationTenantId } from "@/modules/users-management/tenants/organization";
import { useTenants } from "@/modules/users-management/tenants/queries";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getErrorMessage, isApiError } from "@/shared/api/errors";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { resolvePostLoginPath } from "@/shared/lib/redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantsQuery = useTenants();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      tenant_id: "",
      email: "",
      password: "",
      remember_me: false,
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
    }
  }, [form, tenantsQuery.data]);

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      router.replace(resolvePostLoginPath(searchParams.get("next")));
      router.refresh();
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
      if (isApiError(error) && error.code === "AUTH_INVALID_CREDENTIALS") {
        form.setFocus("password");
      }
    }
  }

  const tenants = tenantsQuery.data ?? [];
  const pending = login.isPending || form.formState.isSubmitting;

  return (
    <>
      <div className="mb-7">
        <h2 className="text-foreground text-xl font-semibold">Sign in to your account</h2>
        <p className="text-muted-foreground mt-1 text-sm">Authorized employees only</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {formError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField
            control={form.control}
            name="tenant_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={tenantsQuery.isLoading}
                >
                  <FormControl>
                    <SelectTrigger aria-label="Organization">
                      <SelectValue
                        placeholder={
                          tenantsQuery.isLoading
                            ? "Loading organizations…"
                            : tenantsQuery.isError
                              ? "Unable to load organizations"
                              : "Select organization"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {tenantsQuery.isError ? (
            <p className="text-muted-foreground text-sm">
              Organizations could not be loaded.{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => tenantsQuery.refetch()}
              >
                Try again
              </button>
            </p>
          ) : null}

          {tenantsQuery.isSuccess && tenants.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No organizations are available to sign in to.
            </p>
          ) : null}

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="pr-9"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="remember_me"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-label="Remember me"
                    />
                  </FormControl>
                  <FormLabel className="text-muted-foreground cursor-pointer text-sm font-normal">
                    Remember me
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link href="/forgot-password" className="text-primary text-sm hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Sign In
          </Button>
        </form>
      </Form>
    </>
  );
}
