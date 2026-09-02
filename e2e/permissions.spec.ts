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

test.describe("permissions", () => {
  test("shows Superadmin reset for the seeded system role", async ({ page }) => {
    await signIn(page);
    await page.goto("/permissions");
    await expect(page.getByRole("heading", { name: "Permissions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Role" })).toHaveText("Superadmin");
    await expect(page.getByRole("button", { name: "Reset to Default" }).first()).toBeVisible();
  });

  test("filters the matrix by module", async ({ page }) => {
    await signIn(page);
    await page.goto("/permissions");
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(3);
    await page.getByRole("button", { name: "Module" }).click();
    await page.getByRole("menuitem", { name: "identity" }).click();
    await expect(rows).toHaveCount(2);
  });

  test("hides sidebar modules the user cannot read", async ({ page }) => {
    await page.goto("/login");
    await waitForFirstOrganization(page);
    await page.getByLabel("Company Email").fill("reader@plumbit.com");
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const nav = page.locator("aside").getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Units" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Inventory" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Masters" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Customers" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Quotations" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Users" })).toHaveCount(0);
    await expect(nav.getByText("CRM")).toHaveCount(0);
    await expect(nav.getByText("ERP")).toHaveCount(0);
    await expect(nav.getByText("Administration")).toHaveCount(0);

    await page.goto("/units");
    await expect(page.getByRole("heading", { name: "Units" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Unit" })).toHaveCount(0);
  });
});
