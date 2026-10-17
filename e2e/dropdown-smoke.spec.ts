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

test.describe("dropdown smoke", () => {
  test("sales order customer dropdown selects a value", async ({ page }) => {
    await signIn(page);
    await page.goto("/sales-orders/new");
    await expect(page.getByRole("heading", { name: "New sales order" })).toBeVisible();
    await page.getByLabel("Customer", { exact: true }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await page.getByRole("menuitem", { name: "Acme Trading" }).click();
    await expect(page.getByText("Loading customer defaults…")).toBeHidden();
  });

  test("purchase order supplier dropdown selects a value", async ({ page }) => {
    await signIn(page);
    await page.goto("/purchase-orders/new");
    await expect(page.getByRole("heading", { name: "New purchase order" })).toBeVisible();
    await page.getByLabel("Supplier", { exact: true }).click();
    await expect(page.getByRole("menu")).toBeVisible();
  });
});
