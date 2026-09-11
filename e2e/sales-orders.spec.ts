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

    await page.getByLabel("Customer", { exact: true }).click();
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

  test("creates a proforma invoice from a confirmed sales order", async ({ page }) => {
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
    await expect(page.getByRole("heading", { name: "SO-0001" })).toBeVisible();

    await page.getByRole("button", { name: "Confirm" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(
      confirm.getByRole("heading", { name: "Confirm sales order SO-0001" }),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create proforma invoice" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Create proforma invoice" })).toBeVisible();
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(page).toHaveURL(/\/proforma-invoices\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "PFI-0001" })).toBeVisible();
    await expect(page.getByRole("link", { name: "sales order" })).toBeVisible();
  });

  test("clones a sales order from the list without consuming remaining quantity", async ({
    page,
  }) => {
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
    await expect(page.getByRole("heading", { name: "SO-0001" })).toBeVisible();

    await page.goto("/sales-orders");
    await page.getByRole("button", { name: "Convert from" }).click();
    await page.getByRole("menuitem", { name: "Sales order" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Clone sales order" })).toBeVisible();
    await dialog.getByLabel("Sales order").click();
    await page.getByRole("menuitem", { name: /SO-0001/ }).click();
    await dialog.getByRole("button", { name: "Clone" }).click();

    await expect(page).toHaveURL(/\/sales-orders\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "SO-0002" })).toBeVisible();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  });

  test("converts an accepted quotation to a sales order from the list", async ({ page }) => {
    await signIn(page);
    await page.goto("/quotations/new");
    await expect(page.getByRole("heading", { name: "New quotation" })).toBeVisible();

    await page.getByLabel("Customer").click();
    await page.getByRole("menuitem", { name: "Acme Trading" }).click();
    await expect(page.getByText("Loading customer defaults…")).toBeHidden();

    await page.getByLabel("Line 1 description").fill("Custom copper fitting");
    await page.getByLabel("Line 1 rate").fill("25.50");
    await page.getByRole("button", { name: "Create quotation" }).click();

    await expect(page).toHaveURL(/\/quotations\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "QUO-0001" })).toBeVisible();

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Pending approval", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Approve" }).click();
    let confirm = page.getByRole("alertdialog");
    await expect(
      confirm.getByRole("heading", { name: "Approve quotation QUO-0001" }),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Approved", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Send" }).click();
    confirm = page.getByRole("alertdialog");
    await expect(confirm.getByRole("heading", { name: "Send quotation QUO-0001" })).toBeVisible();
    await confirm.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Sent", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Accept" }).click();
    confirm = page.getByRole("alertdialog");
    await expect(confirm.getByRole("heading", { name: "Accept quotation QUO-0001" })).toBeVisible();
    await confirm.getByRole("button", { name: "Accept" }).click();
    await expect(page.getByText("Accepted", { exact: true })).toBeVisible();

    await page.goto("/sales-orders");
    await page.getByRole("button", { name: "Convert from" }).click();
    await page.getByRole("menuitem", { name: "Quotation", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Convert quotation to sales order" }),
    ).toBeVisible();
    await dialog.getByLabel("Quotation").click();
    await page.getByRole("menuitem", { name: /QUO-0001/ }).click();
    await expect(dialog.getByLabel("Order date")).toBeVisible();
    await dialog.getByRole("button", { name: "Convert" }).click();

    await expect(page).toHaveURL(/\/sales-orders\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "SO-0001" })).toBeVisible();
    await expect(page.getByText("Converted from")).toBeVisible();
  });
});
