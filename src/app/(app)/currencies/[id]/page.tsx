import { z } from "zod";

import { CurrencyDetailScreen } from "@/modules/erp/currencies/components/currency-detail-screen";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const IdSchema = z.string().uuid();

export default async function CurrencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = IdSchema.safeParse(id);

  return (
    <PermissionGate permission={currencyPermissions.read}>
      {parsed.success ? (
        <CurrencyDetailScreen currencyId={parsed.data} mode="view" />
      ) : (
        <p className="text-muted-foreground text-sm">Currency not found.</p>
      )}
    </PermissionGate>
  );
}
