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

test.describe("outbound inventory", () => {
  test("shows outbound nav and empty lists", async ({ page }) => {
    await signIn(page);
    const nav = page.locator("aside").getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Delivery notes" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Packages" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Shipments" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Sales returns" })).toBeVisible();

    await page.goto("/delivery-notes");
    await expect(page.getByRole("heading", { name: "Delivery notes" })).toBeVisible();
    await page.goto("/packages");
    await expect(page.getByRole("heading", { name: "Packages" })).toBeVisible();
    await page.goto("/shipments");
    await expect(page.getByRole("heading", { name: "Shipments" })).toBeVisible();
    await page.goto("/sales-returns");
    await expect(page.getByRole("heading", { name: "Sales returns" })).toBeVisible();
  });

  test("creates a delivery note from a confirmed sales order and posts it", async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page);

    await page.goto("/sales-orders/new");
    await expect(page.getByRole("heading", { name: "New sales order" })).toBeVisible();
    await page.getByLabel("Customer", { exact: true }).click();
    await page.getByRole("menuitem", { name: "Acme Trading" }).click();
    await expect(page.getByText("Loading customer defaults…")).toBeHidden();
    await page.getByLabel("Line 1 description").fill("Custom copper fitting");
    await page.getByLabel("Line 1 rate").fill("25.50");
    await page.getByRole("button", { name: "Create sales order" }).click();
    await expect(page).toHaveURL(/\/sales-orders\/[0-9a-f-]{36}$/i);
    await page.getByRole("button", { name: "Confirm" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Create delivery note" }).click();
    await expect(page.getByRole("heading", { name: "New delivery note" })).toBeVisible();
    await page.getByRole("button", { name: "Create delivery note" }).click();
    await expect(page).toHaveURL(/\/delivery-notes\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "DN-0001" })).toBeVisible();

    await page.getByRole("button", { name: "Post" }).click();
    const postConfirm = page.getByRole("alertdialog");
    await expect(postConfirm.getByText(/stock will move out/i)).toBeVisible();
    await expect(postConfirm.getByText(/cost will be consumed/i)).toBeVisible();
    await postConfirm.getByRole("button", { name: "Post" }).click();
    await expect(page.getByText("Posted", { exact: true })).toBeVisible();
  });
});
