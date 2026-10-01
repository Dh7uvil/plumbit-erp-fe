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

test.describe("communication extended", () => {
  test("global search dialog opens from chat sidebar", async ({ page }) => {
    await signIn(page);
    await page.goto("/chat");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("dialog")).toContainText("Search communication");
  });

  test("notification settings page loads", async ({ page }) => {
    await signIn(page);
    await page.goto("/chat/settings");
    await expect(page.getByText(/notification/i)).toBeVisible();
  });

  test("customer detail shows communication links", async ({ page }) => {
    await signIn(page);
    await page.goto("/customers");
    await page.getByRole("link", { name: /view/i }).first().click();
    await expect(page.getByRole("button", { name: /open chat|start chat|chat/i })).toBeVisible();
  });

  test("mobile chat layout shows conversation list", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: "Chat" })).toBeVisible();
  });

  test("call history page uses updated header", async ({ page }) => {
    await signIn(page);
    await page.goto("/video-calls");
    await expect(page.getByRole("heading", { name: "Call history" })).toBeVisible();
  });
});
