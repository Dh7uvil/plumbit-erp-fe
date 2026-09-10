import { expect, test, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";

async function waitForFirstOrganization(page: Page) {
  await expect(async () => {
    const combo = page.getByRole("combobox", { name: "Organization" });
    const text = (await combo.textContent())?.replace(/\s+/g, " ").trim() ?? "";
    if (text === "Select organization") {
      await page.reload();
    }
    await expect(combo).toHaveText(TENANT);
  }).toPass({ timeout: 20_000 });
}

async function signIn(page: Page) {
  await page.goto("/login");
  await waitForFirstOrganization(page);
  await page.getByLabel("Company Email").fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test.describe("chart of accounts", () => {
  test("shows accounting nav, tree, list, and system mapping", async ({ page }) => {
    await signIn(page);
    const nav = page.locator("aside").getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Chart of accounts" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Journals" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Opening balances" })).toBeVisible();

    await page.goto("/accounts");
    await expect(page.getByRole("heading", { name: "Chart of accounts" })).toBeVisible();
    await expect(page.getByText("Cash on hand")).toBeVisible();
    await expect(page.getByRole("heading", { name: "System accounts" })).toBeVisible();

    await page.getByRole("tab", { name: "List" }).click();
    await expect(page.getByRole("link", { name: "1010" })).toBeVisible();
    await page.getByRole("link", { name: "Cash on hand" }).click();
    await expect(page).toHaveURL(/\/accounts\/[0-9a-f-]{36}$/i);
    await expect(page.getByText("Cash on hand").first()).toBeVisible();
  });
});
