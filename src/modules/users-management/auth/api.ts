import { apiClient, bffClient } from "@/shared/api/client";
import {
  ChangePasswordFormValues,
  ChangePasswordRequestSchema,
  ForgotPasswordFormValues,
  ForgotPasswordRequestSchema,
  LoginFormValues,
  LoginRequestSchema,
  MeSchema,
  ResetPasswordFormValues,
  ResetPasswordRequestSchema,
  type Me,
} from "@/modules/users-management/auth/schemas";

export const authApi = {
  login: async (values: LoginFormValues) => {
    const payload = LoginRequestSchema.parse({
      tenant_id: values.tenant_id,
      email: values.email,
      password: values.password,
    });
    await bffClient.post<null>("/login", {
      ...payload,
      remember_me: values.remember_me,
    });
  },
  logout: async () => {
    await bffClient.post<null>("/logout");
  },
  refresh: async () => {
    await bffClient.post<null>("/refresh");
  },
  changePassword: async (values: ChangePasswordFormValues) => {
    const payload = ChangePasswordRequestSchema.parse({
      current_password: values.current_password,
      new_password: values.new_password,
    });
    await bffClient.post<null>("/change-password", payload);
  },
  forgotPassword: async (values: ForgotPasswordFormValues) => {
    const payload = ForgotPasswordRequestSchema.parse(values);
    await bffClient.post<null>("/forgot-password", payload);
  },
  resetPassword: async (values: ResetPasswordFormValues & { token: string }) => {
    const payload = ResetPasswordRequestSchema.parse({
      token: values.token,
      new_password: values.new_password,
    });
    await bffClient.post<null>("/reset-password", payload);
  },
  me: async (): Promise<Me> => MeSchema.parse(await apiClient.get("/auth/me")),
};
