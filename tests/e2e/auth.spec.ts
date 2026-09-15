import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { E2E_TEST_PREFIX } from "./helpers/auth";

test.describe("Authentication and Route Protection Flows", () => {
  test("redirects unauthenticated user from /dashboard to /login with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
    await expect(page.locator("[data-slot='card-title']")).toContainText(
      "Zaloguj się",
    );
  });

  test("redirects unauthenticated user from /products/new to /login with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/products/new");

    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fproducts%2Fnew/);
    await expect(page.locator("[data-slot='card-title']")).toContainText(
      "Zaloguj się",
    );
  });

  test("shows client-side validation errors on /register when submitting empty form", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByRole("button", { name: "Zarejestruj się" }).click();

    await expect(
      page.getByText("Imię musi mieć co najmniej 2 znaki"),
    ).toBeVisible();
    await expect(
      page.getByText("Podaj prawidłowy adres e-mail"),
    ).toBeVisible();
    await expect(
      page.getByText("Hasło musi mieć co najmniej 6 znaków"),
    ).toBeVisible();
  });

  test("completes registration flow and automatically logs in to dashboard", async ({
    page,
  }) => {
    const uniqueEmail = `${E2E_TEST_PREFIX}user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

    try {
      await page.goto("/register");

      await page.getByLabel(/Imię/i).fill(`${E2E_TEST_PREFIX} Testowy Użytkownik`);
      await page.getByLabel(/Adres e-mail/i).fill(uniqueEmail);
      await page.getByLabel(/Hasło/i).fill("bezpieczneHaslo123");

      await page.getByRole("button", { name: "Zarejestruj się" }).click();

      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator("[data-slot='card-title']")).toContainText(
        "Panel główny",
      );
    } finally {
      await prisma.user.deleteMany({
        where: { email: uniqueEmail },
      });
    }
  });

  test("shows conflict error when attempting to register with already registered email", async ({
    page,
  }) => {
    const duplicateEmail = `${E2E_TEST_PREFIX}dup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;

    try {
      await prisma.user.create({
        data: {
          email: duplicateEmail,
          name: `${E2E_TEST_PREFIX} Istniejący Użytkownik`,
          password: "bezpieczneHaslo123",
        },
      });

      await page.goto("/register");
      await page.getByLabel(/Imię/i).fill(`${E2E_TEST_PREFIX} Drugi Użytkownik`);
      await page.getByLabel(/Adres e-mail/i).fill(duplicateEmail);
      await page.getByLabel(/Hasło/i).fill("inneHaslo12345");
      await page.getByRole("button", { name: "Zarejestruj się" }).click();

      await expect(
        page.getByText(
          "Ten adres e-mail jest już zajęty. Zaloguj się na swoje konto.",
        ),
      ).toBeVisible();
    } finally {
      await prisma.user.deleteMany({
        where: { email: duplicateEmail },
      });
    }
  });

  test("shows validation errors on /login when submitting empty fields", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();

    await expect(
      page.getByText("Podaj prawidłowy adres e-mail"),
    ).toBeVisible();
    await expect(page.getByText("Wprowadź hasło")).toBeVisible();
  });
});
