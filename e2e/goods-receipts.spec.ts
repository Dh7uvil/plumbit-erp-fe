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

async function issuePurchaseOrderWithProduct(page: Page, product: RegExp) {
  await page.goto("/purchase-orders/new");
  await expect(page.getByRole("heading", { name: "New purchase order" })).toBeVisible();
  await page.getByRole("button", { name: "Supplier" }).click();
  await page.getByRole("menuitem", { name: "Gulf Pipes" }).click();
  await expect(page.getByText("Loading supplier defaults…")).toBeHidden();
  await page.getByRole("button", { name: "Select product" }).click();
  await page.getByRole("menuitem", { name: product }).click();
  await page.getByLabel("Line 1 rate").fill("8.00");
  await page.getByRole("button", { name: "Create purchase order" }).click();
  await expect(page).toHaveURL(/\/purchase-orders\/[0-9a-f-]{36}$/i);
  await expect(page.getByRole("heading", { name: "PO-0001" })).toBeVisible();
  await page.getByRole("button", { name: "Issue" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Issue" }).click();
  await expect(page.getByText("Issued", { exact: true })).toBeVisible();
}

test.describe("goods receipts and quality inspections", () => {
  test("issues a PO, posts a GRN, and raises available stock", async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page);

    const nav = page.locator("aside").getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Goods receipts" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Quality inspections" })).toBeVisible();

    await issuePurchaseOrderWithProduct(page, /PIPE-1/);

    await page.getByRole("button", { name: "Create goods receipt" }).click();
    await expect(page).toHaveURL(/\/goods-receipts\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "GRN-0001" })).toBeVisible();

    await page.getByRole("button", { name: "Post" }).click();
    const postConfirm = page.getByRole("alertdialog");
    await expect(postConfirm.getByText(/stock and cost layers will move/i)).toBeVisible();
    await expect(postConfirm.getByText(/AP will not/i)).toBeVisible();
    await postConfirm.getByRole("button", { name: "Post" }).click();
    await expect(page.getByText("Posted", { exact: true })).toBeVisible();

    await page.goto("/stock");
    await expect(page.getByRole("link", { name: "PIPE-1", exact: true })).toBeVisible();
    await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  });

  test("QC product stays unavailable until the inspection is approved", async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page);
    await issuePurchaseOrderWithProduct(page, /PIPE-QC/);
    await page.getByRole("button", { name: "Create goods receipt" }).click();
    await expect(page.getByRole("heading", { name: "GRN-0001" })).toBeVisible();
    await page.getByRole("button", { name: "Post" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Post" }).click();
    await expect(page.getByText("Posted", { exact: true })).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();

    await page.goto("/stock");
    await page.getByRole("link", { name: "PIPE-QC", exact: true }).click();
    await expect(page.getByRole("heading", { name: "QC copper pipe" })).toBeVisible();
    await expect(page.getByText("QC hold")).toBeVisible();
    await expect(page.locator("td").filter({ hasText: /^1$/ }).first()).toBeVisible();
    await expect(page.locator("td").filter({ hasText: /^0$/ }).first()).toBeVisible();

    await page.goto("/quality-inspections");
    await expect(page.getByRole("link", { name: "QCR-0001" })).toBeVisible();
    await page.getByRole("link", { name: "QCR-0001" }).click();
    await page.getByRole("button", { name: "Approve" }).click();
    const approveConfirm = page.getByRole("alertdialog");
    await expect(approveConfirm.getByText(/accepted quantity becomes available/i)).toBeVisible();
    await approveConfirm.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Approved", { exact: true })).toBeVisible();

    await page.goto("/stock");
    await expect(page.getByRole("link", { name: "PIPE-QC", exact: true })).toBeVisible();
    await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  });
});
