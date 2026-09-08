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

test.describe("purchase orders", () => {
  test("creates a draft and issues it", async ({ page }) => {
    await signIn(page);
    await page.goto("/purchase-orders/new");
    await expect(page.getByRole("heading", { name: "New purchase order" })).toBeVisible();

    await page.getByRole("button", { name: "Supplier" }).click();
    await page.getByRole("menuitem", { name: "Gulf Pipes" }).click();
    await expect(page.getByText("Loading supplier defaults…")).toBeHidden();

    await page.getByLabel("Line 1 description").fill("Copper pipe purchase");
    await page.getByLabel("Line 1 rate").fill("8.00");
    await page.getByRole("button", { name: "Create purchase order" }).click();

    await expect(page).toHaveURL(/\/purchase-orders\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "PO-0001" })).toBeVisible();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Issue" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(
      confirm.getByRole("heading", { name: "Issue purchase order PO-0001" }),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Issue" }).click();

    await expect(page.getByText("Issued", { exact: true })).toBeVisible();
  });
});
