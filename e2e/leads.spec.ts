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

test.describe("crm leads", () => {
  test("creates and qualifies a lead", async ({ page }) => {
    await signIn(page);
    await page.goto("/leads");
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
    await page.getByRole("button", { name: "New lead" }).click();
    await page.getByLabel("First name").fill("Playwright");
    await page.getByLabel("Last name").fill("Lead");
    await page.getByLabel("Company").fill("E2E Corp");
    await page.getByRole("button", { name: "Create lead" }).click();
    await expect(page.getByText("LEAD-")).toBeVisible();
    await page.getByRole("button", { name: "Mark qualified" }).click();
    await expect(page.getByText("Qualified")).toBeVisible();
  });
});
