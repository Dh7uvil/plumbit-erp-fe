import { authBackendApi } from "@/modules/users-management/auth/backend-api";
import { ForgotPasswordRequestSchema } from "@/modules/users-management/auth/schemas";
import { bffError, bffSuccess } from "@/app/api/auth/_lib/responses";

export async function POST(request: Request) {
  try {
    const body = ForgotPasswordRequestSchema.parse(await request.json());
    await authBackendApi.forgotPassword(body);
    return bffSuccess();
  } catch (error) {
    return bffError(error);
  }
}
