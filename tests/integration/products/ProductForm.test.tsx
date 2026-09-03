import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/app/(protected)/products/_components/ProductForm";

const mockBack = vi.fn();
const mockExecute = vi.fn();
let mockIsPending = false;

interface MockValidationErrors {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}

let mockResult: {
  data?: { id: string; name: string };
  serverError?: string;
  validationErrors?: MockValidationErrors;
} = {};

interface ActionOptions {
  onSuccess?: (args: { data?: { id: string; name: string } }) => void;
  onError?: (args: {
    error: {
      validationErrors?: MockValidationErrors;
      serverError?: string;
    };
  }) => void;
}

let capturedActionOptions: ActionOptions = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next-safe-action/hooks", () => ({
  useAction: (_action: unknown, options?: ActionOptions) => {
    capturedActionOptions = options || {};
    return {
      execute: (...args: unknown[]) => mockExecute(...args),
      isPending: mockIsPending,
      result: mockResult,
      reset: vi.fn(),
    };
  },
}));

describe("app/(protected)/products/_components/ProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    mockResult = {};
    capturedActionOptions = {};
  });

  it("renders product form fields and controls", () => {
    render(<ProductForm />);

    expect(
      screen.getByText("Szczegóły produktu", {
        selector: "[data-slot='card-title']",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nazwa produktu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres URL produktu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kod produktu \/ SKU/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Utwórz produkt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anuluj" })).toBeInTheDocument();
  });

  it("displays client validation errors when name is invalid", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    const nameInput = screen.getByLabelText(/Nazwa produktu/i);
    await user.type(nameInput, "AB"); // less than 3 chars

    const submitBtn = screen.getByRole("button", { name: "Utwórz produkt" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Nazwa produktu musi mieć co najmniej 3 znaki"),
      ).toBeInTheDocument();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("submits valid product data through safe action execute", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.type(
      screen.getByLabelText(/Nazwa produktu/i),
      "Głośnik Bluetooth JBL Flip 6",
    );
    await user.type(
      screen.getByLabelText(/Adres URL produktu/i),
      "https://example.com/jbl-flip-6",
    );
    await user.type(screen.getByLabelText(/Kod produktu \/ SKU/i), "JBL-FLIP-6-BLK");

    const submitBtn = screen.getByRole("button", { name: "Utwórz produkt" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith({
        name: "Głośnik Bluetooth JBL Flip 6",
        productUrl: "https://example.com/jbl-flip-6",
        code: "JBL-FLIP-6-BLK",
      });
    });
  });

  it("calls router.back when clicking Anuluj button", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    const cancelBtn = screen.getByRole("button", { name: "Anuluj" });
    await user.click(cancelBtn);

    expect(mockBack).toHaveBeenCalled();
  });

  it("renders success alert and triggers onSuccess callback when result.data is present", () => {
    const onSuccessMock = vi.fn();
    mockResult = {
      data: { id: "p-123", name: "Kamera 4K" },
    };

    render(<ProductForm onSuccess={onSuccessMock} />);

    expect(
      screen.getByText(
        'Produkt "Kamera 4K" został pomyślnie utworzony! Trwa przekierowywanie...',
      ),
    ).toBeInTheDocument();

    // Trigger onSuccess callback through safe-action handler
    act(() => {
      capturedActionOptions.onSuccess?.({ data: mockResult.data });
    });

    expect(onSuccessMock).toHaveBeenCalledWith(mockResult.data);
  });

  it("renders error alert when result.serverError is present", () => {
    mockResult = {
      serverError: "Nie udało się utworzyć produktu. Spróbuj ponownie później.",
    };

    render(<ProductForm />);

    expect(
      screen.getByText(
        "Nie udało się utworzyć produktu. Spróbuj ponownie później.",
      ),
    ).toBeInTheDocument();
  });

  it("handles validationErrors from action onError and maps them to fields and root", () => {
    render(<ProductForm />);

    act(() => {
      capturedActionOptions.onError?.({
        error: {
          validationErrors: {
            fieldErrors: {
              name: ["Błąd walidacji nazwy z serwera"],
            },
            formErrors: ["Błąd formularza na serwerze"],
          },
        },
      });
    });

    expect(
      screen.getByText("Błąd walidacji nazwy z serwera"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Błąd formularza na serwerze"),
    ).toBeInTheDocument();
  });
});
