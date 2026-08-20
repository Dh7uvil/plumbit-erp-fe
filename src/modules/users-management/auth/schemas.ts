import { z } from "zod";

import { SessionUserSchema } from "@/shared/auth/session-schema";

export const MeSchema = SessionUserSchema;
export type Me = z.infer<typeof MeSchema>;

export const TokenPairSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  token_type: z.string().default("bearer"),
  expires_in: z.number().int(),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

export const LoginRequestSchema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().min(3).max(255),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginFormSchema = LoginRequestSchema.extend({
  remember_me: z.boolean(),
});
export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const ChangePasswordRequestSchema = z.object({
  current_password: z.string().min(1, "Enter your current password"),
  new_password: z.string().min(8, "Use at least 8 characters").max(72),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const ChangePasswordFormSchema = ChangePasswordRequestSchema.extend({
  confirm_password: z.string().min(1, "Confirm your new password"),
}).refine((value) => value.new_password === value.confirm_password, {
  path: ["confirm_password"],
  message: "Passwords do not match.",
});
export type ChangePasswordFormValues = z.infer<typeof ChangePasswordFormSchema>;

export const RefreshRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

export const LogoutRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

// Assumed endpoints — isolate until OpenAPI documents forgot/reset password.
export const ForgotPasswordRequestSchema = z.object({
  tenant_id: z.string().uuid(),
  email: z.string().min(3).max(255),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ForgotPasswordFormSchema = ForgotPasswordRequestSchema;
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordFormSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8, "Use at least 8 characters").max(72),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const ResetPasswordFormSchema = z
  .object({
    new_password: z.string().min(8, "Use at least 8 characters").max(72),
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordFormSchema>;

export const ResetTokenSearchSchema = z.object({
  token: z.string().min(1),
});
