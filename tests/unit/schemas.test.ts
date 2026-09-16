import { describe, it, expect } from "vitest";
import { registerSchema, REGISTER_ERRORS } from "@/schemas/register";
import { loginSchema, LOGIN_ERRORS } from "@/schemas/login";
import { productCreateSchema, PRODUCT_ERRORS } from "@/schemas/product";
import { reviewCreateSchema, REVIEW_ERRORS } from "@/schemas/review";
import { productScrapeSchema } from "@/schemas/productScrape";
import { shopSchema, shopCreateSchema } from "@/schemas/shop";

describe("schemas/register", () => {
  it("validates correct registration data", () => {
    const validData = {
      name: "Jan Kowalski",
      email: "jan.kowalski@example.com",
      password: "securePassword123",
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it("fails when email is invalid", () => {
    const invalidData = {
      name: "Jan Kowalski",
      email: "invalid-email-format",
      password: "securePassword123",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.format().email?._errors;
      expect(emailError).toContain(REGISTER_ERRORS.invalidEmail);
    }
  });

  it("fails when password is shorter than 6 characters", () => {
    const invalidData = {
      name: "Jan Kowalski",
      email: "jan@example.com",
      password: "12345",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.format().password?._errors;
      expect(passwordError).toContain(REGISTER_ERRORS.passwordMinLength);
    }
  });

  it("fails when name is shorter than 2 characters", () => {
    const invalidData = {
      name: "A",
      email: "jan@example.com",
      password: "securePassword123",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.format().name?._errors;
      expect(nameError).toContain(REGISTER_ERRORS.nameMinLength);
    }
  });
});

describe("schemas/login", () => {
  it("validates correct login credentials", () => {
    const validData = {
      email: "user@example.com",
      password: "secretPassword",
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it("fails when email has invalid format", () => {
    const invalidData = {
      email: "bad-email",
      password: "password123",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.format().email?._errors;
      expect(emailError).toContain(LOGIN_ERRORS.invalidEmail);
    }
  });

  it("fails when password is empty", () => {
    const invalidData = {
      email: "user@example.com",
      password: "",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.format().password?._errors;
      expect(passwordError).toContain(LOGIN_ERRORS.passwordRequired);
    }
  });
});

describe("schemas/product", () => {
  it("validates complete and valid product payload", () => {
    const validData = {
      name: "Bezprzewodowe słuchawki Sony WH-1000XM5",
      productUrl: "https://example.com/products/sony-xm5",
      imageUrl: "https://example.com/images/sony-xm5.jpg",
      code: "SONY-XM5-BLK",
    };

    const result = productCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("validates minimal product payload with optional fields empty or omitted", () => {
    const minimalData = {
      name: "Mysz bezprzewodowa",
      productUrl: "",
      imageUrl: "",
      code: "",
    };

    const result = productCreateSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  it("fails when product name is shorter than 3 characters", () => {
    const result = productCreateSchema.safeParse({
      name: "AB",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.format().name?._errors;
      expect(nameError).toContain(PRODUCT_ERRORS.nameMinLength);
    }
  });

  it("fails when product name exceeds 100 characters", () => {
    const longName = "A".repeat(101);
    const result = productCreateSchema.safeParse({
      name: longName,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.format().name?._errors;
      expect(nameError).toContain(PRODUCT_ERRORS.nameMaxLength);
    }
  });

  it("fails when productUrl is not a valid URL", () => {
    const result = productCreateSchema.safeParse({
      name: "Klawiatura mechaniczna",
      productUrl: "not-a-url",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const urlError = result.error.format().productUrl?._errors;
      expect(urlError).toContain(PRODUCT_ERRORS.productUrlInvalid);
    }
  });

  it("fails when productUrl contains whitespace", () => {
    const result = productCreateSchema.safeParse({
      name: "Klawiatura mechaniczna",
      productUrl: "https://example.com/item space",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const urlError = result.error.format().productUrl?._errors;
      expect(urlError).toContain(PRODUCT_ERRORS.productUrlNoSpaces);
    }
  });

  it("fails when imageUrl contains whitespace", () => {
    const result = productCreateSchema.safeParse({
      name: "Monitor 4K",
      imageUrl: "https://example.com/pic with space.jpg",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const imgError = result.error.format().imageUrl?._errors;
      expect(imgError).toContain(PRODUCT_ERRORS.imageUrlNoSpaces);
    }
  });

  it("fails when code exceeds 24 characters", () => {
    const longCode = "1234567890123456789012345";
    const result = productCreateSchema.safeParse({
      name: "Smartfon X",
      code: longCode,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const codeError = result.error.format().code?._errors;
      expect(codeError).toContain(PRODUCT_ERRORS.codeMaxLength);
    }
  });
});

describe("schemas/review", () => {
  it("validates complete and valid review payload", () => {
    const validData = {
      productId: "prod-12345",
      rate: 4.5,
      description: "Bardzo dobry produkt, spełnia wszystkie oczekiwania!",
    };

    const result = reviewCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it("fails when productId is empty", () => {
    const result = reviewCreateSchema.safeParse({
      productId: "",
      rate: 5,
      description: "Bardzo dobry produkt",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const productIdError = result.error.format().productId?._errors;
      expect(productIdError).toContain(REVIEW_ERRORS.productIdRequired);
    }
  });

  it("fails when rate is lower than 1", () => {
    const result = reviewCreateSchema.safeParse({
      productId: "prod-123",
      rate: 0,
      description: "Słaba jakość",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const rateError = result.error.format().rate?._errors;
      expect(rateError).toContain(REVIEW_ERRORS.rateMin);
    }
  });

  it("fails when rate exceeds 5", () => {
    const result = reviewCreateSchema.safeParse({
      productId: "prod-123",
      rate: 6,
      description: "Niesamowity produkt",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const rateError = result.error.format().rate?._errors;
      expect(rateError).toContain(REVIEW_ERRORS.rateMax);
    }
  });

  it("fails when description is shorter than 3 characters", () => {
    const result = reviewCreateSchema.safeParse({
      productId: "prod-123",
      rate: 4,
      description: "Ok",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.format().description?._errors;
      expect(descError).toContain(REVIEW_ERRORS.descriptionMinLength);
    }
  });

  it("fails when description exceeds 5000 characters", () => {
    const longDesc = "A".repeat(5001);
    const result = reviewCreateSchema.safeParse({
      productId: "prod-123",
      rate: 4,
      description: longDesc,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const descError = result.error.format().description?._errors;
      expect(descError).toContain(REVIEW_ERRORS.descriptionMaxLength);
    }
  });
});

describe("schemas/productScrape", () => {
  it("validates valid HTTP and HTTPS product URLs", () => {
    const valid = {
      productUrl: "https://www.action.com/pl-pl/p/3222380/ladowarka",
    };
    const result = productScrapeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("fails when productUrl contains whitespace", () => {
    const invalid = {
      productUrl: "https://example.com/item space",
    };
    const result = productScrapeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when productUrl is not a URL", () => {
    const invalid = {
      productUrl: "invalid-url",
    };
    const result = productScrapeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when protocol is not http or https", () => {
    const invalid = {
      productUrl: "ftp://example.com/item",
    };
    const result = productScrapeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("schemas/shop", () => {
  it("validates correct shop data", () => {
    const valid = {
      id: "shop-123",
      name: "Media Expert",
      logo: "https://example.com/logo.png",
    };
    const result = shopSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("validates shop with nullable/optional fields", () => {
    const valid = {
      id: "shop-123",
      name: null,
      logo: null,
    };
    expect(shopSchema.safeParse(valid).success).toBe(true);
    expect(shopSchema.safeParse({ id: "shop-123" }).success).toBe(true);
  });

  it("fails when shop name is shorter than 3 characters", () => {
    const invalid = {
      id: "shop-123",
      name: "AB",
    };
    const result = shopSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("fails when shop name exceeds 24 characters", () => {
    const invalid = {
      id: "shop-123",
      name: "Bardzo Długa Nazwa Sklepu Przekraczająca 24",
    };
    const result = shopSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("validates shopCreateSchema correctly", () => {
    expect(
      shopCreateSchema.safeParse({
        name: "Action",
        logo: "https://example.com/logo.svg",
      }).success
    ).toBe(true);

    expect(
      shopCreateSchema.safeParse({
        name: null,
        logo: null,
      }).success
    ).toBe(true);

    expect(
      shopCreateSchema.safeParse({
        name: "A",
      }).success
    ).toBe(false);
  });
});

describe("schemas/product - shopId field", () => {
  it("allows optional shopId as string, empty string, or undefined", () => {
    const base = {
      name: "Testowy Produkt",
    };

    expect(productCreateSchema.safeParse({ ...base, shopId: "shop-1" }).success).toBe(true);
    expect(productCreateSchema.safeParse({ ...base, shopId: "" }).success).toBe(true);
    expect(productCreateSchema.safeParse({ ...base }).success).toBe(true);
  });
});
