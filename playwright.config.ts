import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const MOCK_API_PORT = 4010;
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Plumbit";
const ORGANIZATION_NAME = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";

process.env.NEXT_PUBLIC_APP_NAME = APP_NAME;
process.env.NEXT_PUBLIC_ORGANIZATION_NAME = ORGANIZATION_NAME;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-backend.mjs",
      url: `http://127.0.0.1:${MOCK_API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        MOCK_API_PORT: String(MOCK_API_PORT),
        NEXT_PUBLIC_ORGANIZATION_NAME: ORGANIZATION_NAME,
      },
    },
    {
      command: "npm run dev -- --port 3100 --hostname 127.0.0.1",
      url: `http://127.0.0.1:${PORT}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        API_URL: `http://127.0.0.1:${MOCK_API_PORT}`,
        NEXT_PUBLIC_APP_NAME: APP_NAME,
        NEXT_PUBLIC_ORGANIZATION_NAME: ORGANIZATION_NAME,
        NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${PORT}`,
        NEXT_PUBLIC_ENVIRONMENT: "testing",
        AUTH_COOKIE_SECURE: "false",
        AUTH_COOKIE_SAMESITE: "lax",
        AUTH_ACCESS_COOKIE: "pb_access",
        AUTH_REFRESH_COOKIE: "pb_refresh",
        AUTH_REMEMBER_COOKIE: "pb_remember",
        AUTH_REFRESH_MAX_AGE_SECONDS: "2592000",
      },
    },
  ],
});
