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

test.describe("trial balance", () => {
  test("loads posted balances from the server and drills through to the general ledger", async ({
    page,
  }) => {
    await signIn(page);
    const nav = page.locator("aside").getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Trial balance" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "General ledger" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Account statement" })).toBeVisible();

    await page.goto("/reports/trial-balance");
    await expect(page.getByRole("heading", { name: "Trial balance" })).toBeVisible();
    await page.getByLabel("From date").fill("2026-01-01");
    await page.getByLabel("To date").fill("2026-12-31");
    await expect(page.getByText("Cash on hand")).toBeVisible();
    await expect(page.getByText("Totals")).toBeVisible();
    await expect(
      page.getByText("This trial balance does not balance", { exact: false }),
    ).toHaveCount(0);

    await page.getByRole("row", { name: /Cash on hand/ }).click();
    await expect(page).toHaveURL(/\/reports\/general-ledger/);
    await expect(page.getByRole("heading", { name: "General ledger" })).toBeVisible();
    await expect(page.getByText("JV-0001")).toBeVisible();
  });
});
