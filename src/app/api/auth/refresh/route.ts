import { authBackendApi } from "@/modules/users-management/auth/backend-api";
import { bffError, bffSuccess } from "@/app/api/auth/_lib/responses";
import { applyTokenCookies, readRememberFlag, readRefreshToken } from "@/shared/auth/cookies";
import { ApiError } from "@/shared/api/errors";

export async function POST() {
  try {
    const refreshToken = await readRefreshToken();
    if (!refreshToken) {
      throw new ApiError("AUTH_TOKEN_EXPIRED", "Session expired", 401);
    }
    const tokens = await authBackendApi.refresh(refreshToken);
    const remember = await readRememberFlag();
    const response = bffSuccess();
    applyTokenCookies(response, tokens, remember);
    return response;
  } catch (error) {
    return bffError(error);
  }
}
