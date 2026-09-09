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

test.describe("supplier catalog", () => {
  test("creates, links and unlinks a supplier SKU", async ({ page }) => {
    await signIn(page);
    await page.goto("/supplier-products");
    await expect(page.getByRole("heading", { name: "Supplier catalog" })).toBeVisible();

    await page.getByRole("button", { name: "New catalog item" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "New catalog item" })).toBeVisible();

    await dialog.getByRole("button", { name: "Supplier", exact: true }).click();
    await page.getByRole("menuitem", { name: "Gulf Pipes" }).click();
    await dialog.getByLabel("Supplier SKU").fill("789");
    await dialog.getByLabel("Supplier item name").fill("Cu pipe 15mm");
    await dialog.getByRole("button", { name: "Create catalog item" }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("cell", { name: "789", exact: true })).toBeVisible();
    await expect(page.locator("tbody").getByText("Unmapped")).toBeVisible();

    await page.getByRole("button", { name: "Link 789" }).click();
    await expect(page.getByRole("heading", { name: "Link a product" })).toBeVisible();
    await page.getByRole("button", { name: "Product", exact: true }).click();
    await page.getByRole("menuitem", { name: "PIPE-1 — Copper pipe" }).click();
    await page.getByRole("button", { name: "Link product" }).click();

    await expect(page.getByRole("link", { name: "PIPE-1 — Copper pipe" })).toBeVisible();

    await page.getByRole("button", { name: "Unlink 789" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByRole("heading", { name: "Unlink product" })).toBeVisible();
    await confirm.getByRole("button", { name: "Unlink" }).click();

    await expect(page.locator("tbody").getByText("Unmapped")).toBeVisible();
  });
});
