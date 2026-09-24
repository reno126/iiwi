import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import {
  createAuthenticatedSession,
  deleteTestUser,
  E2E_TEST_PREFIX,
  waitForHydration,
  type TestUser,
} from "./helpers/auth";
import { ADD_REVIEW_FLOW_MESSAGES } from "@/app/opinie/dodaj/_components/addReviewFlowMessages";
import { PRODUCT_DETAILS_MESSAGES } from "@/app/produkty/[id]/constants";
import { REVIEW_FIELDS_MESSAGES } from "@/components/reviews/reviewFieldsMessages";
import { REVIEW_FORM_MESSAGES } from "@/components/reviews/reviewFormMessages";
import { RATING_INPUT_MESSAGES } from "@/components/reviews/ratingInputMessages";

test.describe("Product Review Flows (Existing Product & In-Page)", () => {
  let authedUser: TestUser;

  test.beforeEach(async ({ context }) => {
    authedUser = await createAuthenticatedSession(context);
  });

  test.afterEach(async () => {
    if (authedUser?.id) {
      await deleteTestUser(authedUser.id);
    }
  });

  test("searches existing product on /opinie/dodaj and publishes a review", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const productName = `${E2E_TEST_PREFIX} Słuchawki Testowe ${timestamp}`;
    const productCode = `${E2E_TEST_PREFIX}HP-${timestamp.toString().slice(-6)}`;
    const reviewContent = "Bardzo czysty dźwięk i wygodne nauszniki polecam!";

    const product = await prisma.product.create({
      data: {
        name: productName,
        code: productCode,
        creatorId: authedUser.id,
        rate_avg: 0,
        rate_count: 0,
      },
    });

    try {
      await page.goto("/opinie/dodaj");
      await waitForHydration(page);

      const searchInput = page.getByPlaceholder(
        ADD_REVIEW_FLOW_MESSAGES.searchPlaceholder,
      );
      await searchInput.fill(productName);

      const option = page.getByRole("option", { name: productName });
      await expect(option).toBeVisible();
      await option.click();

      await expect(
        page.getByRole("heading", {
          name: ADD_REVIEW_FLOW_MESSAGES.formHeading,
        }),
      ).toBeVisible();

      await page
        .getByRole("radio", { name: RATING_INPUT_MESSAGES.starAriaLabel(4) })
        .click();

      await page
        .getByLabel(REVIEW_FIELDS_MESSAGES.descriptionLabel)
        .fill(reviewContent);

      await page
        .getByRole("button", { name: REVIEW_FORM_MESSAGES.submitButton })
        .click();

      await expect(page).toHaveURL(new RegExp(`/produkty/${product.id}`));
      await expect(
        page.getByRole("heading", { name: new RegExp(productName, "i") }),
      ).toBeVisible();
      await expect(page.getByText(reviewContent)).toBeVisible();
    } finally {
      await prisma.review.deleteMany({
        where: { productId: product.id },
      });
      await prisma.product.deleteMany({
        where: { id: product.id },
      });
    }
  });

  test("writes and publishes a review directly on the product details page", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const productName = `${E2E_TEST_PREFIX} Monitor Testowy ${timestamp}`;
    const productCode = `${E2E_TEST_PREFIX}MN-${timestamp.toString().slice(-6)}`;
    const reviewContent = "Świetna matryca IPS i wysokie odświeżanie 144Hz!";

    const product = await prisma.product.create({
      data: {
        name: productName,
        code: productCode,
        creatorId: authedUser.id,
        rate_avg: 0,
        rate_count: 0,
      },
    });

    try {
      await page.goto(`/produkty/${product.id}`);
      await waitForHydration(page);

      await expect(
        page.getByRole("heading", { name: new RegExp(productName, "i") }),
      ).toBeVisible();

      await page
        .getByRole("button", {
          name: PRODUCT_DETAILS_MESSAGES.addReviewButton,
        })
        .click();

      await expect(
        page.getByRole("heading", {
          name: PRODUCT_DETAILS_MESSAGES.formHeading,
        }),
      ).toBeVisible();

      await page
        .getByRole("radio", { name: RATING_INPUT_MESSAGES.starAriaLabel(5) })
        .click();

      await page
        .getByLabel(REVIEW_FIELDS_MESSAGES.descriptionLabel)
        .fill(reviewContent);

      await page
        .getByRole("button", { name: REVIEW_FORM_MESSAGES.submitButton })
        .click();

      await expect(page.getByText(reviewContent)).toBeVisible();
    } finally {
      await prisma.review.deleteMany({
        where: { productId: product.id },
      });
      await prisma.product.deleteMany({
        where: { id: product.id },
      });
    }
  });
});
