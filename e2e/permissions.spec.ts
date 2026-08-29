import { expect, test, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";

async function signIn(page: Page) {
  await page.goto("/login");
  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveText(TENANT);
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
    await expect(page.getByRole("combobox", { name: "Role" })).toHaveText("Superadmin");
    await expect(page.getByRole("button", { name: "Reset to Default" }).first()).toBeVisible();
  });

  test("filters the matrix by module", async ({ page }) => {
    await signIn(page);
    await page.goto("/permissions");
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(3);
    await page.getByRole("combobox", { name: "Module" }).click();
    await page.getByRole("option", { name: "identity" }).click();
    await expect(rows).toHaveCount(2);
  });
});
