import { authBackendApi } from "@/modules/users-management/auth/backend-api";
import { bffSuccess } from "@/app/api/auth/_lib/responses";
import { clearTokenCookies, readAccessToken, readRefreshToken } from "@/shared/auth/cookies";

export async function POST() {
  const refreshToken = await readRefreshToken();
  const accessToken = await readAccessToken();

  try {
    if (refreshToken && accessToken) {
      await authBackendApi.logout(refreshToken, accessToken);
    }
  } catch {
    // Always clear the local session so the user can leave.
  }

  const response = bffSuccess();
  clearTokenCookies(response);
  return response;
}
