import { authBackendApi } from "@/modules/users-management/auth/backend-api";
import { ResetPasswordRequestSchema } from "@/modules/users-management/auth/schemas";
import { bffError, bffSuccess } from "@/app/api/auth/_lib/responses";

export async function POST(request: Request) {
  try {
    const body = ResetPasswordRequestSchema.parse(await request.json());
    await authBackendApi.resetPassword(body);
    return bffSuccess();
  } catch (error) {
    return bffError(error);
  }
}
