import { expect, test, type Locator, type Page } from "@playwright/test";

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

async function chooseMenu(page: Page, locator: Locator, option: RegExp | string) {
  await page.keyboard.press("Escape");
  await locator.click();
  await page.getByRole("menu").last().getByRole("menuitem", { name: option }).click();
}

test.describe("stock inventory", () => {
  test("places inventory masters under Inventory, posts opening stock, transfers, and surfaces stock errors", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await signIn(page);

    const nav = page.locator("aside").getByRole("navigation");
    await expect(nav.getByRole("button", { name: "Inventory" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Masters" })).toBeVisible();
    const inventory = await nav.getByRole("button", { name: "Inventory" }).boundingBox();
    const masters = await nav.getByRole("button", { name: "Masters" }).boundingBox();
    const units = await nav.getByRole("link", { name: "Units" }).boundingBox();
    const products = await nav.getByRole("link", { name: "Products" }).boundingBox();
    const warehouses = await nav.getByRole("link", { name: "Warehouses" }).boundingBox();
    expect(inventory && masters && units && products && warehouses).toBeTruthy();
    expect(units!.y).toBeGreaterThan(inventory!.y);
    expect(units!.y).toBeLessThan(masters!.y);
    expect(products!.y).toBeGreaterThan(inventory!.y);
    expect(products!.y).toBeLessThan(masters!.y);
    expect(warehouses!.y).toBeGreaterThan(inventory!.y);
    expect(warehouses!.y).toBeLessThan(masters!.y);
    await expect(nav.getByRole("link", { name: "Stock movements" })).toBeVisible();

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
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Post" }).click();
    const postConfirm = page.getByRole("alertdialog");
    await expect(
      postConfirm.getByRole("heading", { name: "Post stock adjustment STA-0001" }),
    ).toBeVisible();
    await expect(postConfirm.getByText(/stock will move/i)).toBeVisible();
    await postConfirm.getByRole("button", { name: "Post" }).click();
    await expect(page.getByText("Posted", { exact: true })).toBeVisible();

    await page.goto("/stock");
    await expect(page.getByRole("heading", { name: "Stock" })).toBeVisible();
    await expect(page.getByRole("button", { name: /More filters/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "PIPE-1", exact: true })).toBeVisible();
    await expect(page.getByText("10", { exact: true }).first()).toBeVisible();

    await page.goto("/stock-movements");
    await expect(page.getByRole("heading", { name: "Stock movements" })).toBeVisible();
    await expect(page.getByRole("button", { name: /More filters/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "PIPE-1", exact: true })).toBeVisible();

    await page.goto("/stock-transfers/new");
    await expect(page.getByRole("heading", { name: "New stock transfer" })).toBeVisible();
    await chooseMenu(page, page.getByLabel("From warehouse"), /MAIN/);
    await chooseMenu(page, page.getByLabel("To warehouse"), /SITE/);
    await page.getByRole("button", { name: "Select product" }).click();
    await page.getByRole("menuitem", { name: /PIPE-1/ }).click();
    await page.getByLabel("Line 1 quantity").fill("4");
    await page.getByRole("button", { name: "Create transfer" }).click();
    await expect(page).toHaveURL(/\/stock-transfers\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "STR-0001" })).toBeVisible();

    await page.getByRole("button", { name: "Post" }).click();
    const transferConfirm = page.getByRole("alertdialog");
    await expect(transferConfirm.getByText(/stock will move/i)).toBeVisible();
    await transferConfirm.getByRole("button", { name: "Post" }).click();
    await expect(page.getByText("Posted", { exact: true })).toBeVisible();

    await page.goto("/stock-transfers/new");
    await chooseMenu(page, page.getByLabel("From warehouse"), /MAIN/);
    await chooseMenu(page, page.getByLabel("To warehouse"), /SITE/);
    await page.getByRole("button", { name: "Select product" }).click();
    await page.getByRole("menuitem", { name: /PIPE-1/ }).click();
    await page.getByLabel("Line 1 quantity").fill("20");
    await page.getByRole("button", { name: "Create transfer" }).click();
    await expect(page.getByRole("heading", { name: "STR-0002" })).toBeVisible();
    await page.getByRole("button", { name: "Post" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Post" }).click();
    await expect(page.getByText(/Warehouse MAIN/)).toBeVisible();
    await expect(page.getByText(/Available 6/)).toBeVisible();
    await expect(page.getByText(/Requested 20/)).toBeVisible();

    await page.goto("/stock-adjustments/new");
    await chooseMenu(page, page.getByLabel("Warehouse", { exact: true }), /MAIN/);
    await page.getByLabel("Reason").click();
    await page.getByRole("option", { name: "Found" }).click();
    await page.getByRole("button", { name: "Select product" }).click();
    await page.getByRole("menuitem", { name: /PIPE-1/ }).click();
    await page.getByLabel("Line 1 adjust by").fill("1");
    await page.getByRole("button", { name: "Create adjustment" }).click();
    await expect(page.getByRole("heading", { name: /STA-/ })).toBeVisible();

    const adjustmentUrl = page.url();
    const id = adjustmentUrl.split("/").pop() ?? "";
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/edit$/);

    await page.evaluate(async (documentId) => {
      const current = await fetch(`/api/v1/stock-adjustments/${documentId}`, {
        credentials: "include",
      }).then((response) => response.json());
      await fetch(`/api/v1/stock-adjustments/${documentId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "If-Match": String(current.data.version),
        },
        body: JSON.stringify({ notes: "concurrent", version: current.data.version }),
      });
    }, id);

    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText(/changed since you opened it/i)).toBeVisible();
  });
});
