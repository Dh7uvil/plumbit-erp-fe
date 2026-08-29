import { expect, test, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";

async function waitForFirstOrganization(page: Page) {
  await expect(page.getByRole("combobox", { name: "Organization" })).toHaveText(TENANT);
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

    await page.getByRole("combobox", { name: "Customer" }).click();
    await page.getByRole("option", { name: "Acme Trading" }).click();
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
    await expect(confirm.getByRole("heading", { name: "Approve quotation QUO-0001" })).toBeVisible();
    await confirm.getByRole("button", { name: "Approve" }).click();

    await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  });
});
