import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const startPoint = "Waterfront Station";
const destination = "UBC Exchange";

async function openHome(page: Page) {
  await page.goto("/");
}

async function fillTrip(page: Page) {
  await page.getByRole("textbox", { name: "Starting point" }).fill(startPoint);
  await page.getByRole("textbox", { name: "Destination" }).fill(destination);
}

async function searchForRoutes(page: Page) {
  await fillTrip(page);
  await page.getByRole("button", { name: "Find Routes" }).click();
  await expect(page.getByRole("heading", { name: "Route options" })).toBeVisible();
}

test.describe("core route search flows", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
  });

  test("enters start and destination", async ({ page }) => {
    await fillTrip(page);

    await expect(page.getByRole("textbox", { name: "Starting point" })).toHaveValue(
      startPoint
    );
    await expect(page.getByRole("textbox", { name: "Destination" })).toHaveValue(
      destination
    );
  });

  test("searches routes through the app backend", async ({ page }) => {
    await searchForRoutes(page);

    await expect(page.getByText("Best route")).toBeVisible();
  });

  test("displays at least one ranked route option", async ({ page }) => {
    await searchForRoutes(page);

    await expect(page.locator("article").filter({ hasText: "Best route" })).toHaveCount(
      1
    );
    await expect(page.getByText("SeaBus + R2 RapidBus")).toBeVisible();
  });

  test("expands step-by-step instructions and fare", async ({ page }) => {
    await searchForRoutes(page);
    const bestRoute = page.locator("article").filter({ hasText: "Best route" });

    await bestRoute.getByText("View steps and fare").click();

    await expect(bestRoute.getByText("Estimated fare")).toBeVisible();
    await expect(bestRoute.getByText("CA$3.20")).toBeVisible();
    await expect(
      bestRoute.getByText("Board SeaBus at Waterfront Station.")
    ).toBeVisible();
    await expect(bestRoute.getByText("Ride SeaBus for 1 stops.")).toBeVisible();
  });

  test("swaps start and destination", async ({ page }) => {
    await fillTrip(page);
    await page.getByRole("button", { name: "Swap start and destination" }).click();

    await expect(page.getByRole("textbox", { name: "Starting point" })).toHaveValue(
      destination
    );
    await expect(page.getByRole("textbox", { name: "Destination" })).toHaveValue(
      startPoint
    );
  });
});
