import { Suspense } from "react";

import { ResetPasswordForm } from "@/modules/users-management/auth/components/reset-password-form";
import { ResetTokenSearchSchema } from "@/modules/users-management/auth/schemas";

async function ResetPasswordContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const parsed = ResetTokenSearchSchema.safeParse({ token });

  return <ResetPasswordForm token={parsed.success ? parsed.data.token : null} />;
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading reset form…</p>}>
      <ResetPasswordContent searchParams={searchParams} />
    </Suspense>
  );
}
