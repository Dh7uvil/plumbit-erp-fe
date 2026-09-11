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

test.describe("quotation approval", () => {
  test("creates a draft, submits it, and approves it", async ({ page }) => {
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
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText("Pending approval", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Approve" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(
      confirm.getByRole("heading", { name: "Approve quotation QUO-0001" }),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Approve" }).click();

    await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  });

  test("converts an accepted quotation into a sales order", async ({ page }) => {
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

    await page.getByRole("button", { name: "Convert to sales order" }).click();
    confirm = page.getByRole("alertdialog");
    await expect(
      confirm.getByRole("heading", { name: "Convert to sales order quotation QUO-0001" }),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Convert to sales order" }).click();

    await expect(page).toHaveURL(/\/sales-orders\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "SO-0001" })).toBeVisible();
    await expect(page.getByText("Converted from")).toBeVisible();
  });

  test("creates a sales invoice directly from an accepted quotation", async ({ page }) => {
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

    await page.getByRole("button", { name: "Create sales invoice" }).click();
    confirm = page.getByRole("alertdialog");
    await expect(confirm.getByRole("heading", { name: "Create sales invoice" })).toBeVisible();
    await expect(
      confirm.getByText(
        "This quotation has not been converted to a Sales Order. Create Sales Invoice directly?",
      ),
    ).toBeVisible();
    await confirm.getByRole("button", { name: "Continue" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Create sales invoice" })).toBeVisible();
    await dialog.getByRole("button", { name: "Create invoice" }).click();

    await expect(page).toHaveURL(/\/sales-invoices\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "SI-0001" })).toBeVisible();
    await expect(page.getByRole("link", { name: "quotation" })).toBeVisible();

    await page.getByRole("link", { name: "quotation" }).click();
    await expect(page).toHaveURL(/\/quotations\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "Related documents" })).toBeVisible();
    await page.getByRole("link", { name: "SI-0001" }).click();
    await expect(page).toHaveURL(/\/sales-invoices\/[0-9a-f-]{36}$/i);
  });
});
