import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { E2E_TEST_PREFIX, waitForHydration } from "./helpers/auth";
import { SIGN_IN_MESSAGES } from "@/app/login/constants";
import { ADD_REVIEW_FLOW_MESSAGES } from "@/app/opinie/dodaj/_components/addReviewFlowMessages";
import { COMBINED_FORM_MESSAGES } from "@/app/opinie/dodaj/_components/combinedFormMessages";
import { URL_PROMPT_MESSAGES } from "@/app/opinie/dodaj/_components/urlPromptMessages";
import { PRODUCT_FIELDS_MESSAGES } from "@/app/opinie/dodaj/_components/productFieldsMessages";
import { RATING_INPUT_MESSAGES } from "@/components/reviews/ratingInputMessages";
import { REVIEW_FIELDS_MESSAGES } from "@/components/reviews/reviewFieldsMessages";

test.describe("Guest Review Draft and Auth-Gated Submission Flow", () => {
  test("unauthenticated guest fills review, gets redirected to login, logs in, and draft is restored and published", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const guestEmail = `${E2E_TEST_PREFIX}guest_${timestamp}@example.com`;
    const password = "bezpieczneHaslo123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: guestEmail,
        name: `${E2E_TEST_PREFIX} Guest Reviewer`,
        password: hashedPassword,
      },
    });

    const productName = `${E2E_TEST_PREFIX} Klawiatura Mechaniczna ${timestamp}`;
    const productCode = `${E2E_TEST_PREFIX}KB-${timestamp.toString().slice(-6)}`;
    const reviewContent = "Doskonała jakość wykonania i świetny skok klawiszy!";

    try {
      await page.goto("/opinie/dodaj");
      await waitForHydration(page);

      await page
        .getByRole("button", {
          name: ADD_REVIEW_FLOW_MESSAGES.addNewProductButton,
        })
        .click();

      await page
        .getByRole("button", { name: URL_PROMPT_MESSAGES.manualButton })
        .click();

      await page
        .getByLabel(PRODUCT_FIELDS_MESSAGES.nameLabel)
        .fill(productName);
      await page
        .getByLabel(PRODUCT_FIELDS_MESSAGES.codeLabel)
        .fill(productCode);

      await page
        .getByRole("radio", { name: RATING_INPUT_MESSAGES.starAriaLabel(5) })
        .click();

      await page
        .getByLabel(REVIEW_FIELDS_MESSAGES.descriptionLabel)
        .fill(reviewContent);

      await page
        .getByRole("button", { name: COMBINED_FORM_MESSAGES.submitLabel })
        .click();

      await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fopinie%2Fdodaj/);

      await page.getByLabel(SIGN_IN_MESSAGES.emailLabel).fill(guestEmail);
      await page.getByLabel(SIGN_IN_MESSAGES.passwordLabel).fill(password);
      await page
        .getByRole("button", {
          name: SIGN_IN_MESSAGES.submitButton,
          exact: true,
        })
        .click();

      await expect(page).toHaveURL(/\/opinie\/dodaj/);
      await waitForHydration(page);

      await expect(
        page.getByText(COMBINED_FORM_MESSAGES.draftRestored),
      ).toBeVisible();

      await expect(
        page.getByLabel(PRODUCT_FIELDS_MESSAGES.nameLabel),
      ).toHaveValue(productName);
      await expect(
        page.getByLabel(REVIEW_FIELDS_MESSAGES.descriptionLabel),
      ).toHaveValue(reviewContent);

      await page
        .getByRole("button", { name: COMBINED_FORM_MESSAGES.submitLabel })
        .click();

      await expect(page).toHaveURL(/\/produkty\/.+/);
      await expect(
        page.getByRole("heading", { name: new RegExp(productName, "i") }),
      ).toBeVisible();
      await expect(page.getByText(reviewContent)).toBeVisible();
    } finally {
      await prisma.review.deleteMany({
        where: { userId: user.id },
      });
      await prisma.product.deleteMany({
        where: { name: productName },
      });
      await prisma.user.deleteMany({
        where: { id: user.id },
      });
    }
  });
});
