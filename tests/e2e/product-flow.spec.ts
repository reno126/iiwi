import { test, expect } from "@playwright/test";
import {
  createAuthenticatedSession,
  deleteTestUser,
  E2E_TEST_PREFIX,
  waitForHydration,
  type TestUser,
} from "./helpers/auth";

test.describe("Product Creation Flow (End-to-End)", () => {
  let authedUser: TestUser;

  test.beforeEach(async ({ context }) => {
    authedUser = await createAuthenticatedSession(context);
  });

  test.afterEach(async () => {
    if (authedUser?.id) {
      await deleteTestUser(authedUser.id);
    }
  });

  test("authenticated user can navigate to /opinie/dodaj, fill form, and create product", async ({
    page,
  }) => {
    const timestamp = Date.now();

    await page.goto("/opinie/dodaj");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/opinie\/dodaj/);

    await page.getByRole("button", { name: /dodaj nowy produkt/i }).click();

    await expect(
      page.getByRole("heading", { name: /masz link do oferty produktu\?/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/wklej go poniżej, to pójdzie szybko!/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /dodaj produkt ręcznie/i }).click();

    const productName = `${E2E_TEST_PREFIX} Produkt E2E ${timestamp}`;
    await page.getByLabel(/Nazwa produktu/i).fill(productName);
    await page
      .getByLabel(/Kod produktu \/ EAN/i)
      .fill(`${E2E_TEST_PREFIX}SKU-${timestamp.toString().slice(-6)}`);

    await page.getByRole("radio", { name: /5 z 5 gwiazdek/i }).click();
    await page
      .getByLabel(/Treść recenzji/i)
      .fill("Świetny testowy produkt E2E!");

    await page.getByRole("button", { name: /dodaj produkt i opinię/i }).click();

    await expect(page).toHaveURL(/\/produkty\/.+/);
    await expect(
      page.getByRole("heading", { name: new RegExp(productName, "i") }),
    ).toBeVisible();
  });

  test("shows client validation errors when trying to create product with invalid name", async ({
    page,
  }) => {
    await page.goto("/opinie/dodaj");
    await waitForHydration(page);
    await page.getByRole("button", { name: /dodaj nowy produkt/i }).click();

    await page.getByRole("button", { name: /dodaj produkt ręcznie/i }).click();

    await page.getByLabel(/Nazwa produktu/i).fill("AB");
    await page.getByRole("button", { name: /dodaj produkt i opinię/i }).click();

    await expect(page.getByLabel(/Nazwa produktu/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
