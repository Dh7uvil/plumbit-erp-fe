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

test.describe("journal posting", () => {
  test("creates a balanced journal and posts it to the ledger", async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page);

    await page.goto("/journals/new");
    await expect(page.getByRole("heading", { name: "New journal" })).toBeVisible();

    await page.getByLabel("Line 1 account").click();
    await page.getByRole("menuitem", { name: "1010 — Cash on hand" }).click();
    await page.getByLabel("Line 1 debit").fill("250.00");

    await page.getByLabel("Line 2 account").click();
    await page.getByRole("menuitem", { name: "1020 — Bank" }).click();
    await page.getByLabel("Line 2 credit").fill("250.00");

    await page.getByRole("button", { name: "Create journal" }).click();
    await expect(page).toHaveURL(/\/journals\/[0-9a-f-]{36}$/i);

    await page.getByRole("button", { name: "Post" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByText(/writes this entry to the general ledger/i)).toBeVisible();
    await confirm.getByRole("button", { name: "Post" }).click();
    await expect(page.getByText("Posted", { exact: true })).toBeVisible();
  });
});
