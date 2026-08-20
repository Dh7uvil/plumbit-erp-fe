import { authBackendApi } from "@/modules/users-management/auth/backend-api";
import { ChangePasswordRequestSchema } from "@/modules/users-management/auth/schemas";
import { bffError, bffSuccess } from "@/app/api/auth/_lib/responses";
import { applyTokenCookies, readRememberFlag } from "@/shared/auth/cookies";

export async function POST(request: Request) {
  try {
    const body = ChangePasswordRequestSchema.parse(await request.json());
    const tokens = await authBackendApi.changePassword(body);
    const remember = await readRememberFlag();
    const response = bffSuccess();
    applyTokenCookies(response, tokens, remember);
    return response;
  } catch (error) {
    return bffError(error);
  }
}
