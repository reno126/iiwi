import { describe, it, expect } from "vitest";
import { registerSchema } from "@/schemas/register";
import { loginSchema } from "@/schemas/login";
import { productCreateSchema } from "@/schemas/product";

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
      expect(emailError).toContain("Podaj prawidłowy adres e-mail");
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
      expect(passwordError).toContain("Hasło musi mieć co najmniej 6 znaków");
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
      expect(nameError).toContain("Imię musi mieć co najmniej 2 znaki");
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
      expect(emailError).toContain("Podaj prawidłowy adres e-mail");
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
      expect(passwordError).toContain("Wprowadź hasło");
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
      expect(nameError).toContain("Nazwa produktu musi mieć co najmniej 3 znaki");
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
      expect(nameError).toContain("Nazwa produktu nie może przekraczać 100 znaków");
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
      expect(urlError).toContain("Podaj prawidłowy adres URL produktu");
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
      expect(urlError).toContain("Adres URL nie może zawierać spacji");
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
      expect(imgError).toContain("Adres URL nie może zawierać spacji");
    }
  });

  it("fails when code exceeds 24 characters", () => {
    const longCode = "1234567890123456789012345"; // 25 characters
    const result = productCreateSchema.safeParse({
      name: "Smartfon X",
      code: longCode,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const codeError = result.error.format().code?._errors;
      expect(codeError).toContain("Kod produktu nie może przekraczać 24 znaków");
    }
  });
});
