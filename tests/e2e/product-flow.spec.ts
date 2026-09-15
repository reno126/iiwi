import { test, expect } from "@playwright/test";
import {
  createAuthenticatedSession,
  deleteTestUser,
  E2E_TEST_PREFIX,
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
    await expect(page).toHaveURL(/\/opinie\/dodaj/);

    await page.getByRole("button", { name: "Dodaj nowy produkt" }).click();

    await expect(
      page.getByText("Masz link do oferty produktu?"),
    ).toBeVisible();
    await expect(
      page.getByText("wklej go poniżej, to pójdzie szybko!"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Dodaj produkt ręcznie" }).click();

    const productName = `${E2E_TEST_PREFIX} Produkt E2E ${timestamp}`;
    await page.getByLabel(/Nazwa produktu/i).fill(productName);
    await page
      .getByLabel(/Kod produktu \/ EAN/i)
      .fill(`${E2E_TEST_PREFIX}SKU-${timestamp.toString().slice(-6)}`);

    await page.getByRole("radio", { name: "5 z 5 gwiazdek" }).click();
    await page
      .getByLabel(/Treść recenzji/i)
      .fill("Świetny testowy produkt E2E!");

    await page.getByRole("button", { name: "Dodaj produkt i opinię" }).click();

    await expect(page).toHaveURL(/\/produkty\/.+/);
    await expect(
      page.getByRole("heading", { name: productName }),
    ).toBeVisible();
  });

  test("shows client validation errors when trying to create product with invalid name", async ({
    page,
  }) => {
    await page.goto("/opinie/dodaj");
    await page.getByRole("button", { name: "Dodaj nowy produkt" }).click();

    await page.getByRole("button", { name: "Dodaj produkt ręcznie" }).click();

    await page.getByLabel(/Nazwa produktu/i).fill("AB");
    await page.getByRole("button", { name: "Dodaj produkt i opinię" }).click();

    await expect(
      page.getByText("Nazwa produktu musi mieć co najmniej 3 znaki"),
    ).toBeVisible();
  });
});
