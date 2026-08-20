import { authBackendApi } from "@/modules/users-management/auth/backend-api";
import { ForgotPasswordRequestSchema } from "@/modules/users-management/auth/schemas";
import {
  bffError,
  bffSuccess,
  isBenignForgotFailure,
  isValidationError,
} from "@/app/api/auth/_lib/responses";

export async function POST(request: Request) {
  try {
    const body = ForgotPasswordRequestSchema.parse(await request.json());
    try {
      await authBackendApi.forgotPassword(body);
    } catch (error) {
      if (isValidationError(error) || !isBenignForgotFailure(error)) {
        throw error;
      }
    }
    return bffSuccess();
  } catch (error) {
    return bffError(error);
  }
}
