import { z } from "zod";

export const TenantPublicSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string(),
});

export type TenantPublic = z.infer<typeof TenantPublicSchema>;

export const TenantListSchema = z.array(TenantPublicSchema);
