export const PRODUCT_FIELDS_MESSAGES = {
  legend: "Informacje o produkcie",
  nameLabel: "Nazwa produktu *",
  namePlaceholder: "np. Logitech MX Master 3S",
  productUrlLabel: "Adres URL do produktu",
  productUrlPlaceholder: "https://example.com/produkt",
  scrapeButton: "Wyciągnij zdjęcie produktu",
  imageUrlLabel: "Adres URL zdjęcia",
  imageUrlPlaceholder: "https://example.com/zdjecie.jpg",
  imagePreviewLabel: "Zdjęcie produktu",
  imagePreviewAlt: "Podgląd zdjęcia produktu",
  imageLoadError: "Błąd ładowania podglądu zdjęcia",
  deleteImageButton: "Usuń",
  codeLabel: "Kod produktu",
  codePlaceholder: "np. 5099206103734",
  statusFilled: "Uzupełnione",
  statusMissing: "Do uzupełnienia",
  scrapeSuccessWithImage:
    "Pomyślnie zaktualizowano dane i zdjęcie produktu z linku.",
  scrapeSuccessWithoutImage:
    "Pomyślnie pobrano dane produktu z linku (brak zdjęcia w ofercie).",
  scrapeUnexpectedError:
    "Wystąpił nieoczekiwany błąd podczas pobierania danych.",
  scrapeInvalidUrl: "Nieprawidłowy adres URL.",
} as const;
