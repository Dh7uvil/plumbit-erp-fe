"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useResetPassword } from "@/modules/users-management/auth/mutations";
import {
  ResetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/modules/users-management/auth/schemas";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import { applyFieldErrors } from "@/shared/lib/form-errors";

const missingTokenError = new ApiError("AUTH_RESET_TOKEN_INVALID", "Invalid reset token", 400);

export function ResetPasswordForm({ token }: { token: string | null }) {
  const resetPassword = useResetPassword();
  const [formError, setFormError] = useState<string | null>(
    token ? null : getErrorMessage(missingTokenError),
  );

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) {
      setFormError(getErrorMessage(missingTokenError));
      return;
    }
    setFormError(null);
    try {
      await resetPassword.mutateAsync({ ...values, token });
      toast.success("Password reset successfully. Please sign in.");
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = resetPassword.isPending || form.formState.isSubmitting;
  const invalidToken = !token;

  return (
    <>
      <div className="mb-7">
        <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-full">
          <Lock className="text-primary size-5" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold">Set new password</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose a strong password for your account.
        </p>
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
            name="new_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    disabled={invalidToken}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    disabled={invalidToken}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={pending || invalidToken}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Reset Password
          </Button>
        </form>
      </Form>
      {invalidToken ? (
        <p className="text-muted-foreground mt-4 text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Request a new reset link
          </Link>
        </p>
      ) : null}
    </>
  );
}
