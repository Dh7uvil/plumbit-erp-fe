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

async function dragTaskToColumn(page: Page, taskTitle: string, columnTitle: string) {
  const card = page.locator("[draggable=true]").filter({ hasText: taskTitle }).first();
  const column = page
    .locator(".min-w-72")
    .filter({ has: page.getByRole("heading", { name: new RegExp(`^${columnTitle}`) }) })
    .first();
  await card.dragTo(column);
}

test.describe("task management", () => {
  test("creates a task, moves it on the board, and completes it", async ({ page }) => {
    const title = `E2E task ${Date.now()}`;
    await signIn(page);
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();

    await page.getByRole("button", { name: "New task" }).click();
    await page.getByLabel("Title").fill(title);
    await page.getByRole("button", { name: "Create task" }).click();
    await expect(page.getByText("TASK-")).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();

    await page
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-layout-grid") })
      .click();
    await expect(page.getByRole("heading", { name: /^To do/ })).toBeVisible();

    await dragTaskToColumn(page, title, "In progress");
    await expect(page.getByText("Task moved")).toBeVisible();
    const inProgressColumn: Locator = page
      .locator(".min-w-72")
      .filter({ has: page.getByRole("heading", { name: /^In progress/ }) });
    await expect(inProgressColumn.getByText(title)).toBeVisible();

    await dragTaskToColumn(page, title, "Done");
    await expect(page.getByText("Task moved")).toBeVisible();
    const doneColumn: Locator = page
      .locator(".min-w-72")
      .filter({ has: page.getByRole("heading", { name: /^Done/ }) });
    await expect(doneColumn.getByText(title)).toBeVisible();
  });
});
