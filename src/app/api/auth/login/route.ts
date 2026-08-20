import { z } from "zod";

import { authBackendApi } from "@/modules/users-management/auth/backend-api";
import { LoginRequestSchema } from "@/modules/users-management/auth/schemas";
import { bffError, bffSuccess } from "@/app/api/auth/_lib/responses";
import { applyTokenCookies } from "@/shared/auth/cookies";

const LoginBffSchema = LoginRequestSchema.extend({
  remember_me: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const body = LoginBffSchema.parse(await request.json());
    const tokens = await authBackendApi.login({
      tenant_id: body.tenant_id,
      email: body.email,
      password: body.password,
    });
    const response = bffSuccess();
    applyTokenCookies(response, tokens, body.remember_me);
    return response;
  } catch (error) {
    return bffError(error);
  }
}
