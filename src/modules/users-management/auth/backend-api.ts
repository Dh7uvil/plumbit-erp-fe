import "server-only";

import { serverRequest } from "@/shared/api/server-client";
import {
  ChangePasswordRequest,
  ChangePasswordRequestSchema,
  ForgotPasswordRequest,
  ForgotPasswordRequestSchema,
  LoginRequest,
  LoginRequestSchema,
  LogoutRequestSchema,
  MeSchema,
  RefreshRequestSchema,
  ResetPasswordRequest,
  ResetPasswordRequestSchema,
  TokenPairSchema,
  type Me,
  type TokenPair,
} from "@/modules/users-management/auth/schemas";

export const authBackendApi = {
  login: async (input: LoginRequest): Promise<TokenPair> =>
    TokenPairSchema.parse(
      await serverRequest("/auth/login", {
        method: "POST",
        body: LoginRequestSchema.parse(input),
        accessToken: null,
      }),
    ),
  refresh: async (refreshToken: string): Promise<TokenPair> =>
    TokenPairSchema.parse(
      await serverRequest("/auth/refresh", {
        method: "POST",
        body: RefreshRequestSchema.parse({ refresh_token: refreshToken }),
        accessToken: null,
      }),
    ),
  logout: async (refreshToken: string, accessToken: string): Promise<null> =>
    (await serverRequest("/auth/logout", {
      method: "POST",
      body: LogoutRequestSchema.parse({ refresh_token: refreshToken }),
      accessToken,
    })) as null,
  me: async (): Promise<Me> => MeSchema.parse(await serverRequest("/auth/me")),
  changePassword: async (input: ChangePasswordRequest): Promise<TokenPair> =>
    TokenPairSchema.parse(
      await serverRequest("/auth/change-password", {
        method: "POST",
        body: ChangePasswordRequestSchema.parse(input),
      }),
    ),
  forgotPassword: async (input: ForgotPasswordRequest): Promise<null> =>
    (await serverRequest("/auth/forgot-password", {
      method: "POST",
      body: ForgotPasswordRequestSchema.parse(input),
      accessToken: null,
    })) as null,
  resetPassword: async (input: ResetPasswordRequest): Promise<null> =>
    (await serverRequest("/auth/reset-password", {
      method: "POST",
      body: ResetPasswordRequestSchema.parse(input),
      accessToken: null,
    })) as null,
};
