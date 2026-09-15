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

test.describe("masters currencies", () => {
  test("lists AED as the base currency", async ({ page }) => {
    await signIn(page);
    await page.goto("/currencies");
    await expect(page.getByRole("heading", { name: "Currencies" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AED" }).first()).toBeVisible();
    await expect(page.getByText("Base").first()).toBeVisible();
  });

  test("taxes page can sort by category", async ({ page }) => {
    await signIn(page);
    await page.goto("/taxes");
    await expect(page.getByRole("heading", { name: "Taxes" })).toBeVisible();
    await page.getByRole("button", { name: "Category" }).click();
    await expect(page.getByRole("cell", { name: "Standard" }).first()).toBeVisible();
  });
});
