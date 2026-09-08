import { expect, test, type Locator, type Page } from "@playwright/test";

const TENANT = process.env.NEXT_PUBLIC_ORGANIZATION_NAME ?? "Plumbit";
const EMAIL = "ada@plumbit.com";
const PASSWORD = "correct-horse";
const LOCK_REASON = "Statutory month-end close";

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

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

async function chooseMenu(page: Page, locator: Locator, option: RegExp | string) {
  await page.keyboard.press("Escape");
  await locator.click();
  await page.getByRole("menu").last().getByRole("menuitem", { name: option }).click();
}

test.describe("period lock", () => {
  test("sets books close in Organization Settings and blocks posting a dated adjustment", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await signIn(page);

    await page.goto("/stock-adjustments/new");
    await expect(page.getByRole("heading", { name: "New stock adjustment" })).toBeVisible();
    await chooseMenu(page, page.getByLabel("Warehouse", { exact: true }), /MAIN/);
    await page.getByLabel("Reason").click();
    await page.getByRole("option", { name: "Opening stock" }).click();
    await page.getByRole("button", { name: "Select product" }).click();
    await page.getByRole("menuitem", { name: /PIPE-1/ }).click();
    await page.getByLabel("Line 1 adjust by").fill("10");
    await page.getByRole("button", { name: "Create adjustment" }).click();
    await expect(page).toHaveURL(/\/stock-adjustments\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "STA-0001" })).toBeVisible();
    const adjustmentUrl = page.url();

    const today = todayIsoDate();
    await page.goto("/organization-settings");
    await expect(page.getByRole("heading", { name: "Organization Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Transaction lock" })).toBeVisible();
    await page.getByLabel("Books close").fill(today);
    await page.getByLabel("Reason").fill(LOCK_REASON);
    await page.getByRole("button", { name: "Save lock" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByRole("heading", { name: "Apply period lock" })).toBeVisible();
    await expect(dialog.getByText(/cannot be posted through/i)).toBeVisible();
    await dialog.getByRole("button", { name: "Apply lock" }).click();
    await expect(page.getByText(LOCK_REASON)).toBeVisible();

    await page.goto(adjustmentUrl);
    await expect(page.getByRole("heading", { name: "STA-0001" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Post" })).toHaveCount(0);
    const formatted = await page.evaluate((iso) => {
      const [year, month, day] = iso.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }, today);
    await expect(page.getByRole("alert").first()).toContainText(/locked period/i);
    await expect(page.getByRole("alert").first()).toContainText(formatted);
  });
});
