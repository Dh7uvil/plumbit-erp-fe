import { GlIntegrityResponseSchema, type GlIntegrityResponse } from "@/modules/erp/accounting/integrity/schemas";
import { apiClient } from "@/shared/api/client";

export async function fetchGlIntegrity(asOf: string): Promise<GlIntegrityResponse> {
  return GlIntegrityResponseSchema.parse(
    await apiClient.get("/utilities/gl-integrity", { params: { as_of: asOf } }),
  );
}
