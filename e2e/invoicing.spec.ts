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

test.describe("invoicing", () => {
  test("nav entries load list screens", async ({ page }) => {
    await signIn(page);
    const nav = page.locator("aside").getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Sales invoices" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Purchase invoices" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Credit notes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Debit notes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Export evidence exceptions" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Invoiced not dispatched" })).toBeVisible();

    await page.goto("/sales-invoices");
    await expect(page.getByRole("heading", { name: "Sales invoices" })).toBeVisible();

    await page.goto("/purchase-invoices");
    await expect(page.getByRole("heading", { name: "Purchase invoices" })).toBeVisible();

    await page.goto("/credit-notes");
    await expect(page.getByRole("heading", { name: "Credit notes" })).toBeVisible();

    await page.goto("/debit-notes");
    await expect(page.getByRole("heading", { name: "Debit notes" })).toBeVisible();

    await page.goto("/reports/export-evidence-exceptions");
    await expect(page.getByRole("heading", { name: "Export evidence exceptions" })).toBeVisible();

    await page.goto("/reports/invoiced-not-dispatched");
    await expect(page.getByRole("heading", { name: "Invoiced not dispatched" })).toBeVisible();
  });
});
