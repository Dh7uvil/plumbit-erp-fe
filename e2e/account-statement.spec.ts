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
  await page.getByRole("textbox", { name: "Company Email" }).fill(EMAIL);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.locator("aside").getByRole("navigation")).toBeVisible();
}

test.describe("account statement", () => {
  test("loads a GL account statement from the reports hub", async ({ page }) => {
    await signIn(page);
    await page.goto("/reports/account-statement");
    await expect(page.getByRole("heading", { name: "Account statement" })).toBeVisible();

    await page.getByRole("button", { name: "Account", exact: true }).click();
    await page.getByRole("menu").last().getByRole("menuitem", { name: /Cash on hand/ }).click();
    await expect(page.getByRole("button", { name: "Account", exact: true })).toContainText(
      "Cash on hand",
    );
    await page.getByLabel("From date").fill("2026-01-01");
    await page.getByLabel("To date").fill("2026-12-31");
    await expect(page.getByRole("link", { name: "JV26000001" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("1,000.00").first()).toBeVisible();
  });
});
