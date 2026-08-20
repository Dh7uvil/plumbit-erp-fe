import "server-only";

import { z } from "zod";

import { publicEnv } from "@/config/env.public";

const booleanFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const serverSchema = z.object({
  API_URL: z.string().url(),
  AUTH_ACCESS_COOKIE: z.string().min(1).default("pb_access"),
  AUTH_REFRESH_COOKIE: z.string().min(1).default("pb_refresh"),
  AUTH_REMEMBER_COOKIE: z.string().min(1).default("pb_remember"),
  AUTH_COOKIE_SECURE: booleanFromEnv,
  AUTH_COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  AUTH_REFRESH_MAX_AGE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = {
  ...parsed.data,
  ...publicEnv,
};
