import { expect, test, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";

async function signIn(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveText(TENANT, {
    timeout: 20_000,
  });
  await page.getByLabel("Company Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test.describe("communication", () => {
  test("opens chat, sends a message, and shows video calls", async ({ page }) => {
    await signIn(page);
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: "Chat" })).toBeVisible();
    await page.getByRole("link", { name: /Direct message/i }).click();
    await expect(page.getByText("Welcome to chat")).toBeVisible();

    await page.getByPlaceholder("Write a message…").fill("Hello from e2e");
    await page.getByRole("button").filter({ has: page.locator("svg.lucide-send") }).click();
    await expect(page.getByText("Hello from e2e")).toBeVisible();

    await page.goto("/video-calls");
    await expect(page.getByRole("heading", { name: "Video Calls" })).toBeVisible();
  });
});
