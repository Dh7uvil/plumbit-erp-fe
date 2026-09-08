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

test.describe("sales orders", () => {
  test("creates a draft and confirms it", async ({ page }) => {
    await signIn(page);
    await page.goto("/sales-orders/new");
    await expect(page.getByRole("heading", { name: "New sales order" })).toBeVisible();

    await page.getByLabel("Customer").click();
    await page.getByRole("menuitem", { name: "Acme Trading" }).click();
    await expect(page.getByText("Loading customer defaults…")).toBeHidden();

    await page.getByLabel("Line 1 description").fill("Custom copper fitting");
    await page.getByLabel("Line 1 rate").fill("25.50");
    await page.getByRole("button", { name: "Create sales order" }).click();

    await expect(page).toHaveURL(/\/sales-orders\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "SO-0001" })).toBeVisible();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Confirm" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(
      confirm.getByRole("heading", { name: "Confirm sales order SO-0001" }),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  });
});
