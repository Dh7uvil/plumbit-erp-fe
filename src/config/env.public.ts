import { z } from "zod";

const booleanFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const publicSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1),
  NEXT_PUBLIC_ORGANIZATION_NAME: z.string().trim().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(["development", "testing", "staging", "production"]),
  NEXT_PUBLIC_FEATURE_AI_ASSISTANT_ENABLED: booleanFromEnv,
  NEXT_PUBLIC_AGORA_APP_ID: z.string().trim().optional().default(""),
  NEXT_PUBLIC_REALTIME_WS_URL: z.string().trim().optional().default(""),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_ORGANIZATION_NAME: process.env.NEXT_PUBLIC_ORGANIZATION_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  NEXT_PUBLIC_FEATURE_AI_ASSISTANT_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AI_ASSISTANT_ENABLED,
  NEXT_PUBLIC_AGORA_APP_ID: process.env.NEXT_PUBLIC_AGORA_APP_ID,
  NEXT_PUBLIC_REALTIME_WS_URL: process.env.NEXT_PUBLIC_REALTIME_WS_URL,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid public environment configuration: ${details}`);
}

export const publicEnv = parsed.data;
