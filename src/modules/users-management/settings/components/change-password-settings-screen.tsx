"use client";

import { ChangePasswordForm } from "@/modules/users-management/auth/components/change-password-form";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ChangePasswordSettingsScreen() {
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader
        title="Change Password"
        subtitle="Choose a new password. Other sessions will be signed out."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
