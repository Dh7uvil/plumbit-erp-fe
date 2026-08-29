import { publicEnv } from "@/config/env.public";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_LOGO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const OPTIONAL_SELECT_NONE = "none";
export const API_VERSION_PREFIX = "/api/v1";
export const BFF_AUTH_PREFIX = "/api/auth";

export const APP_NAME = publicEnv.NEXT_PUBLIC_APP_NAME;
export const ORGANIZATION_NAME = publicEnv.NEXT_PUBLIC_ORGANIZATION_NAME;
export const COMPANY_EMAIL_PLACEHOLDER = `name@${ORGANIZATION_NAME.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
