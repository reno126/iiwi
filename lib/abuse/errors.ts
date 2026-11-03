export const ABUSE_MESSAGES = {
  rateLimited: "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.",
  scrapeBusy:
    "Pobieranie danych jest chwilowo zajęte. Spróbuj ponownie za chwilę lub uzupełnij dane ręcznie.",
  unavailable: "Usługa jest chwilowo niedostępna. Spróbuj ponownie później.",
} as const;

export class AbuseLimitError extends Error {
  constructor(
    public readonly retryAfterSeconds: number,
    message: string = ABUSE_MESSAGES.rateLimited,
  ) {
    super(message);
    this.name = "AbuseLimitError";
  }
}
