import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CombinedProductReviewForm } from "@/app/opinie/dodaj/_components/CombinedProductReviewForm";
import { productScrapeMetadata } from "@/serverActions/productScrapeMetadata";
import { productWithReviewCreate } from "@/serverActions/productWithReviewCreate";
import {
  saveReviewDraft,
  getReviewDraft,
  clearReviewDraft,
} from "@/lib/storage/reviewDraftStorage";

import type { Product, Review } from "@/prisma/generated/client";

// Mocks
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/serverActions/productScrapeMetadata", () => ({
  productScrapeMetadata: vi.fn(),
}));

vi.mock("@/serverActions/productWithReviewCreate", () => ({
  productWithReviewCreate: vi.fn(),
}));

vi.mock("@/serverActions/shopMatchByUrlAction", () => ({
  shopMatchByUrlAction: vi.fn().mockResolvedValue(null),
}));

describe("CombinedProductReviewForm - New Flow", () => {
  const onCancelMock = vi.fn();
  const onSuccessMock = vi.fn();
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearReviewDraft();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "test-user-1" }, expires: "9999-12-31" },
      status: "authenticated",
      update: vi.fn(),
    });
  });

  it("initially renders only the 3 main elements and the manual addition option", () => {
    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    // 1. Nagłówek i podtytuł
    expect(
      screen.getByText("Masz link do oferty produktu?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("wklej go poniżej, to pójdzie szybko!")
    ).toBeInTheDocument();

    // 2. Pole do URL
    const urlInput = screen.getByPlaceholderText("https://sklep.pl/produkt...");
    expect(urlInput).toBeInTheDocument();

    // 3. Przycisk "Pobierz info"
    const scrapeButton = screen.getByRole("button", { name: /Pobierz info/i });
    expect(scrapeButton).toBeInTheDocument();
    expect(scrapeButton).toBeDisabled();

    // Opcja manualna
    expect(screen.getByText("Nie masz linku do oferty?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Dodaj produkt ręcznie/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("wymagamy tylko nazwy, no i opinii")
    ).toBeInTheDocument();

    // Pełne pola formularza (nazwa, ocena, recenzja) NIE powinny być jeszcze widoczne
    expect(screen.queryByLabelText(/Nazwa produktu/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Ocena/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Treść recenzji/i)).not.toBeInTheDocument();
  });

  it("navigates immediately to manual form without URL field when clicking 'Dodaj produkt ręcznie'", async () => {
    const user = userEvent.setup();
    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /Dodaj produkt ręcznie/i })
    );

    // Formularz manualny jest widoczny
    expect(screen.getByLabelText(/Nazwa produktu \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Tryb ręczny/i)).toBeInTheDocument();

    // Pole URL produktu jest UKRYTE w trybie ręcznym
    expect(
      screen.queryByLabelText(/Adres URL do produktu/i)
    ).not.toBeInTheDocument();

    // Pola recenzji są widoczne
    expect(screen.getByText(/Twoja opinia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Treść recenzji \*/i)).toBeInTheDocument();
  });

  it("handles scraping flow: fills data, displays success banner with scraped fields, and submits", async () => {
    const user = userEvent.setup();
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/item.jpg",
        name: "Słuchawki Sony XM5",
        code: "SKU-999",
        shop: null,
        scrapedFields: ["name", "imageUrl", "code", "shop"],
      },
    });

    vi.mocked(productWithReviewCreate).mockResolvedValueOnce({
      data: {
        product: { id: "new-prod-id" } as unknown as Product,
        review: { id: "new-rev-id" } as unknown as Review,
      },
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    const urlInput = screen.getByPlaceholderText("https://sklep.pl/produkt...");
    await user.type(urlInput, "https://sklep.pl/item-123");

    const scrapeBtn = screen.getByRole("button", { name: /Pobierz info/i });
    expect(scrapeBtn).toBeEnabled();
    await user.click(scrapeBtn);

    await waitFor(() => {
      expect(productScrapeMetadata).toHaveBeenCalledWith({
        productUrl: "https://sklep.pl/item-123",
      });
    });

    // Powinien pojawić się baner sukcesu
    await waitFor(() => {
      expect(
        screen.getByText("Pobrano wszystkie potrzebne dane produktu")
      ).toBeInTheDocument();
    });

    // Pobrana nazwa powinna być wpisana
    const nameInput = screen.getByLabelText(/Nazwa produktu \*/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Słuchawki Sony XM5");

    // Pole "Adres URL do produktu" i przycisk "Wyciągnij zdjęcie" powinny zostać usunięte
    expect(screen.queryByLabelText(/Adres URL do produktu/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Wyciągnij zdjęcie produktu/i })).not.toBeInTheDocument();

    // Input "Adres URL zdjęcia" powinien zostać usunięty, a widoczny wyłącznie podgląd
    expect(screen.queryByLabelText(/Adres URL zdjęcia/i)).not.toBeInTheDocument();
    expect(screen.getByText("Podgląd zdjęcia produktu")).toBeInTheDocument();

    // Wypełniamy ocenę i treść recenzji
    const starRadio = screen.getByRole("radio", { name: "5 z 5 gwiazdek" });
    await user.click(starRadio);

    const reviewTextarea = screen.getByLabelText(/Treść recenzji \*/i);
    await user.type(reviewTextarea, "Fantastyczne słuchawki, polecam!");

    // Klikamy "Dodaj produkt i opinię"
    await user.click(
      screen.getByRole("button", { name: /Dodaj produkt i opinię/i })
    );

    await waitFor(() => {
      expect(productWithReviewCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Słuchawki Sony XM5",
          productUrl: "https://sklep.pl/item-123",
          imageUrl: "https://example.com/item.jpg",
          code: "SKU-999",
        })
      );
      expect(onSuccessMock).toHaveBeenCalledWith("new-prod-id");
    });
  });

  it("handles scraping failure: retains productUrl and displays failure banner", async () => {
    const user = userEvent.setup();
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      serverError: "Nie udało się pobrać danych ze wskazanego sklepu.",
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    const urlInput = screen.getByPlaceholderText("https://sklep.pl/produkt...");
    await user.type(urlInput, "https://unknown-shop.com/item");

    await user.click(screen.getByRole("button", { name: /Pobierz info/i }));

    // Oczekujemy baneru błędu
    await waitFor(() => {
      expect(
        screen.getByText("Nie udało się pobrać danych")
      ).toBeInTheDocument();
    });

    // URL produktu powinien być zapamiętany w formularzu, żeby użytkownik nie musiał go pisać ponownie
    const productUrlInput = screen.getByLabelText(/Adres URL do produktu/i) as HTMLInputElement;
    expect(productUrlInput.value).toBe("https://unknown-shop.com/item");

    // Nazwa produktu pusta i gotowa do wpisania ręcznego
    const nameInput = screen.getByLabelText(/Nazwa produktu \*/i) as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });

  it("allows switching back to URL prompt from active form", async () => {
    const user = userEvent.setup();
    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /Dodaj produkt ręcznie/i })
    );

    expect(screen.getByLabelText(/Nazwa produktu \*/i)).toBeInTheDocument();

    // Klikamy "Zmień sposób wprowadzania"
    await user.click(
      screen.getByRole("button", { name: /Zmień sposób wprowadzania/i })
    );

    // Wracamy do początkowych 3 elementów
    expect(
      screen.getByText("Masz link do oferty produktu?")
    ).toBeInTheDocument();
  });

  it("marks scraped vs missing fields and reactively updates status when user completes missing data", async () => {
    const user = userEvent.setup();
    vi.mocked(productScrapeMetadata).mockResolvedValueOnce({
      data: {
        imageUrl: "https://example.com/keyboard.jpg",
        name: "Klawiatura Mechaniczna Pro",
        code: "",
        shop: null,
        scrapedFields: ["name", "imageUrl"],
      },
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    const urlInput = screen.getByPlaceholderText("https://sklep.pl/produkt...");
    await user.type(urlInput, "https://sklep.pl/keyboard");
    await user.click(screen.getByRole("button", { name: /Pobierz info/i }));

    const nameInput = screen.getByLabelText(/Nazwa produktu \*/i) as HTMLInputElement;
    await waitFor(() => {
      expect(nameInput.value).toBe("Klawiatura Mechaniczna Pro");
    });

    // 2 fields scraped (name, imageUrl) -> 2 "Uzupełnione"
    // 2 fields missing (code, shop) -> 2 "Do uzupełnienia"
    expect(screen.getAllByText("Uzupełnione").length).toBe(2);
    expect(screen.getAllByText("Do uzupełnienia").length).toBe(2);

    // User fills in missing code
    const codeInput = screen.getByLabelText(/Kod produktu \/ EAN/i);
    await user.type(codeInput, "5901234567890");

    await waitFor(() => {
      expect(screen.getAllByText("Uzupełnione").length).toBe(3); // name, imageUrl, code
      expect(screen.getAllByText("Do uzupełnienia").length).toBe(1); // shop
    });
  });

  it("when unauthenticated, tries session refresh and redirects to login saving draft in localStorage", async () => {
    const user = userEvent.setup();
    const updateMock = vi.fn().mockResolvedValue(null);

    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: updateMock,
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    // Przejście do trybu manualnego
    await user.click(screen.getByRole("button", { name: /Dodaj produkt ręcznie/i }));

    // Wypełnienie formularza
    const nameInput = screen.getByLabelText(/Nazwa produktu \*/i);
    await user.type(nameInput, "Część zapasowa XYZ");

    const starRadio = screen.getByRole("radio", { name: "4 z 5 gwiazdek" });
    await user.click(starRadio);

    const reviewTextarea = screen.getByLabelText(/Treść recenzji \*/i);
    await user.type(reviewTextarea, "Dobra jakość, polecam!");

    // Kliknięcie "Dodaj produkt i opinię"
    await user.click(screen.getByRole("button", { name: /Dodaj produkt i opinię/i }));

    // Powinno podjąć próbę odświeżenia sesji
    expect(updateMock).toHaveBeenCalled();

    // Ponieważ odświeżenie zwróciło null, nie powinno wywoływać server action
    expect(productWithReviewCreate).not.toHaveBeenCalled();

    // Powinno zapisać draft do localStorage
    const savedDraft = getReviewDraft();
    expect(savedDraft).toBeDefined();
    expect(savedDraft?.type).toBe("NEW_PRODUCT_AND_REVIEW");
    if (savedDraft?.type === "NEW_PRODUCT_AND_REVIEW") {
      expect(savedDraft.formData.name).toBe("Część zapasowa XYZ");
      expect(savedDraft.formData.rate).toBe(4);
      expect(savedDraft.formData.description).toBe("Dobra jakość, polecam!");
      expect(savedDraft.phase?.mode).toBe("manual");
    }

    // Powinno przekierować do logowania z callbackUrl
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("/login?callbackUrl=")
    );
  });

  it("restores form data and active phase from existing localStorage draft on mount, and displays banner", async () => {
    const user = userEvent.setup();

    // Zapisujemy draft z wyprzedzeniem
    saveReviewDraft({
      type: "NEW_PRODUCT_AND_REVIEW",
      formData: {
        name: "Przywrócony produkt",
        productUrl: "https://sklep.pl/item-restored",
        imageUrl: "https://sklep.pl/image-restored.jpg",
        code: "RESTORED-123",
        shopId: "",
        rate: 5,
        description: "Opinia przywrócona ze szkicu.",
      },
      phase: {
        mode: "scraped_success",
        scrapedFields: ["name", "imageUrl", "code"],
      },
      detectedShop: null,
    });

    vi.mocked(productWithReviewCreate).mockResolvedValueOnce({
      data: {
        product: { id: "restored-prod-id" } as unknown as Product,
        review: { id: "restored-rev-id" } as unknown as Review,
      },
    });

    render(
      <CombinedProductReviewForm
        onCancel={onCancelMock}
        onSuccess={onSuccessMock}
      />
    );

    // Powinien od razu pojawić się komunikat o przywróceniu danych
    expect(
      screen.getByText(/Twoje dane zostały przywrócone po zalogowaniu/i)
    ).toBeInTheDocument();

    // Nazwa i treść recenzji powinny być wypełnione
    const nameInput = screen.getByLabelText(/Nazwa produktu \*/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Przywrócony produkt");

    const descTextarea = screen.getByLabelText(/Treść recenzji \*/i) as HTMLTextAreaElement;
    expect(descTextarea.value).toBe("Opinia przywrócona ze szkicu.");

    // Klikamy "Dodaj produkt i opinię"
    await user.click(screen.getByRole("button", { name: /Dodaj produkt i opinię/i }));

    await waitFor(() => {
      expect(productWithReviewCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Przywrócony produkt",
          rate: 5,
          description: "Opinia przywrócona ze szkicu.",
        })
      );
      expect(onSuccessMock).toHaveBeenCalledWith("restored-prod-id");
    });

    // Po udanym zapisie szkic powinien zostać wyczyszczony z localStorage
    expect(getReviewDraft()).toBeNull();
  });
});

