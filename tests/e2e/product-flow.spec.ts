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

  test("authenticated user can navigate to /products/new, fill form, and create product", async ({
    page,
  }) => {
    const timestamp = Date.now();

    // 1. Navigate directly to /products/new (session cookie already injected)
    await page.goto("/products/new");
    await expect(page).toHaveURL(/\/products\/new/);
    await expect(
      page.getByRole("heading", { name: "Utwórz nowy produkt" }),
    ).toBeVisible();

    // 2. Fill in product details
    const productName = `${E2E_TEST_PREFIX} Produkt E2E ${timestamp}`;
    await page.getByLabel(/Nazwa produktu/i).fill(productName);
    await page
      .getByLabel(/Adres URL produktu/i)
      .fill("https://example.com/products/test-item");
    await page
      .getByLabel(/Kod produktu \/ SKU/i)
      .fill(`${E2E_TEST_PREFIX}SKU-${timestamp.toString().slice(-6)}`);

    // 3. Submit product creation form
    await page.getByRole("button", { name: "Utwórz produkt" }).click();

    // 4. Assert success alert is rendered
    await expect(
      page.getByText(
        new RegExp(`Produkt "${productName}" został pomyślnie utworzony!`, "i"),
      ),
    ).toBeVisible();
  });

  test("shows client validation errors when trying to create product with invalid name", async ({
    page,
  }) => {
    // 1. Navigate directly to /products/new (session cookie already injected)
    await page.goto("/products/new");

    // 2. Enter name with only 2 chars
    await page.getByLabel(/Nazwa produktu/i).fill("AB");
    await page.getByRole("button", { name: "Utwórz produkt" }).click();

    // 3. Expect validation message
    await expect(
      page.getByText("Nazwa produktu musi mieć co najmniej 3 znaki"),
    ).toBeVisible();
  });
});
