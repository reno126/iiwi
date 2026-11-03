export const AUTH_ERRORS = {
  rateLimited: "RateLimited",
  unavailable: "ServiceUnavailable",
  oauthAccountOnly: "OAuthAccountOnly",
  oauthAccountNotLinked: "OAuthAccountNotLinked",
  oauthSignin: "OAuthSignin",
  oauthCallback: "OAuthCallback",
  oauthCreateAccount: "OAuthCreateAccount",
  credentialsSignin: "CredentialsSignin",
  sessionRequired: "SessionRequired",
} as const;

export const AUTH_ERROR_MESSAGES = {
  rateLimited: "Zbyt wiele prób logowania. Odczekaj chwilę i spróbuj ponownie.",
  unavailable: "Logowanie jest chwilowo niedostępne. Spróbuj ponownie później.",
  oauthAccountNotLinked:
    "To konto e-mail zostało wcześniej zarejestrowane za pomocą hasła. Zaloguj się hasłem.",
  oauthAccountOnly:
    "To konto zostało utworzone przez Google. Zaloguj się za pomocą przycisku Google poniżej.",
  oauthGeneralError:
    "Wystąpił problem podczas logowania przez Google. Spróbuj ponownie.",
  credentialsSignin: "Nieprawidłowy adres e-mail lub hasło.",
  sessionRequired: "Zaloguj się, aby uzyskać dostęp do tej strony.",
  defaultError: "Wystąpił błąd podczas logowania. Spróbuj ponownie.",
} as const;
