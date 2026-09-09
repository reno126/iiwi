import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { ProductFields } from "@/components/products/ProductFields";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import type { ProductCreateInput } from "@/schemas/product";

// Mock productScrapeMetadata server action
vi.mock("@/serverActions/productScrapeMetadata", () => ({
  productScrapeMetadata: vi.fn(),
}));

vi.mock("@/serverActions/shopMatchByUrlAction", () => ({
  shopMatchByUrlAction: vi.fn().mockResolvedValue(null),
}));

interface WrapperProps {
  defaultValues?: Partial<ProductCreateInput>;
  hideProductUrl?: boolean;
}

function FormWrapper({ defaultValues, hideProductUrl }: WrapperProps) {
  const methods = useForm<ProductCreateInput>({
    defaultValues: {
      name: "",
      productUrl: "",
      imageUrl: "",
      code: "",
      ...defaultValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <form>
        <ProductFields hideProductUrl={hideProductUrl} />
      </form>
    </FormProvider>
  );
}

describe("components/products/ProductFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product fields and disables scrape button when productUrl is empty", () => {
    render(<FormWrapper />);

    expect(screen.getByLabelText(/Nazwa produktu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres URL do produktu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres URL zdjęcia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kod produktu/i)).toBeInTheDocument();

    const scrapeBtn = screen.getByRole("button", {
      name: /Wyciągnij zdjęcie produktu/i,
    });
    expect(scrapeBtn).toBeDisabled();
  });

  it("enables scrape button when productUrl is filled and fills fields on success", async () => {
    const user = userEvent.setup();
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/scraped-image.jpg",
        name: "Pobrana Nazwa Produktu",
        code: "EAN-123456",
        shop: null,
        scrapedFields: ["name", "imageUrl", "code"],
      },
    });

    render(<FormWrapper />);

    const productUrlInput = screen.getByLabelText(/Adres URL do produktu/i);
    const scrapeBtn = screen.getByRole("button", {
      name: /Wyciągnij zdjęcie produktu/i,
    });

    await user.type(productUrlInput, "https://example.com/item");
    expect(scrapeBtn).toBeEnabled();

    await user.click(scrapeBtn);

    await waitFor(() => {
      expect(productScrapeMetadata).toHaveBeenCalledWith({
        productUrl: "https://example.com/item",
      });
    });

    // Sprawdzamy czy pole name oraz code zostały uzupełnione, a pole URL zdjęcia zastąpione podglądem
    const nameInput = screen.getByLabelText(/Nazwa produktu/i) as HTMLInputElement;
    const codeInput = screen.getByLabelText(/Kod produktu/i) as HTMLInputElement;

    await waitFor(() => {
      expect(nameInput.value).toBe("Pobrana Nazwa Produktu");
      expect(codeInput.value).toBe("EAN-123456");
    });

    // Pole input adresu URL zdjęcia powinno zostać usunięte na rzecz podglądu miniatury
    expect(screen.queryByLabelText(/Adres URL zdjęcia/i)).not.toBeInTheDocument();
    expect(screen.getByText("Podgląd zdjęcia produktu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Usuń/i })).toBeInTheDocument();
  });

  it("does not overwrite already filled name and code on successful scrape", async () => {
    const user = userEvent.setup();
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/scraped-image.jpg",
        name: "Nowa Nazwa",
        code: "NEW-CODE",
        shop: null,
        scrapedFields: ["name", "imageUrl", "code"],
      },
    });

    render(
      <FormWrapper
        defaultValues={{
          name: "Istniejąca Nazwa Wpisana Ręcznie",
          code: "MANUAL-01",
          productUrl: "https://example.com/item",
        }}
      />
    );

    const scrapeBtn = screen.getByRole("button", {
      name: /Wyciągnij zdjęcie produktu/i,
    });
    await user.click(scrapeBtn);

    const nameInput = screen.getByLabelText(/Nazwa produktu/i) as HTMLInputElement;
    const codeInput = screen.getByLabelText(/Kod produktu/i) as HTMLInputElement;

    await waitFor(() => {
      expect(screen.getByText("Podgląd zdjęcia produktu")).toBeInTheDocument();
    });

    // Wartości nie powinny zostać nadpisane
    expect(nameInput.value).toBe("Istniejąca Nazwa Wpisana Ręcznie");
    expect(codeInput.value).toBe("MANUAL-01");
  });

  it("allows removing the image via the 'Usuń' button in the preview", async () => {
    const user = userEvent.setup();

    render(
      <FormWrapper
        defaultValues={{
          imageUrl: "https://example.com/initial-image.jpg",
        }}
      />
    );

    // Na starcie pole inputu jest ukryte, a widoczny jest wyłącznie podgląd
    expect(screen.queryByLabelText(/Adres URL zdjęcia/i)).not.toBeInTheDocument();
    expect(screen.getByText("Podgląd zdjęcia produktu")).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /Usuń/i });
    await user.click(deleteBtn);

    // Po usunięciu podgląd znika, a pojawia się pole input
    const imageUrlInput = screen.getByLabelText(/Adres URL zdjęcia/i) as HTMLInputElement;
    expect(imageUrlInput.value).toBe("");
    expect(screen.queryByText("Podgląd zdjęcia produktu")).not.toBeInTheDocument();
  });

  it("displays non-blocking error message when scraper fails", async () => {
    const user = userEvent.setup();
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      serverError: "Nie udało się pobrać zdjęcia z podanej strony.",
    });

    render(
      <FormWrapper
        defaultValues={{
          productUrl: "https://example.com/unsupported-shop",
        }}
      />
    );

    const scrapeBtn = screen.getByRole("button", {
      name: /Wyciągnij zdjęcie produktu/i,
    });
    await user.click(scrapeBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Nie udało się pobrać zdjęcia z podanej strony.")
      ).toBeInTheDocument();
    });

    // Formularz nie rzuca błędu blokującego na pole productUrl
    const productUrlInput = screen.getByLabelText(/Adres URL do produktu/i);
    expect(productUrlInput).not.toHaveAttribute("aria-invalid", "true");
  });

  it("auto-fills shop when scraper returns matched shop", async () => {
    const user = userEvent.setup();
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/me-item.jpg",
        name: "Hulajnoga Kamikaze K1",
        code: "K1-PLUS",
        shop: {
          id: "shop-media-expert",
          name: "Media Expert",
          logo: "https://example.com/me-logo.svg",
        },
        scrapedFields: ["name", "imageUrl", "code", "shop"],
      },
    });

    render(
      <FormWrapper
        defaultValues={{
          productUrl: "https://www.mediaexpert.pl/rowery/hulajnogi/kamikaze-k1",
        }}
      />
    );

    const scrapeBtn = screen.getByRole("button", {
      name: /Wyciągnij zdjęcie produktu/i,
    });
    await user.click(scrapeBtn);

    await waitFor(() => {
      expect(screen.getByText("Media Expert")).toBeInTheDocument();
      expect(screen.getByText("Wybrany sklep")).toBeInTheDocument();
    });
  });

  it("hides productUrl field when hideProductUrl is true", () => {
    render(<FormWrapper hideProductUrl={true} />);

    expect(screen.getByLabelText(/Nazwa produktu/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Adres URL do produktu/i)).not.toBeInTheDocument();
  });
});
