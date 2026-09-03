import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("*/api/register", async ({ request }) => {
    const data = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };

    if (data.email === "zajety@test.pl" || data.email === "existing@example.com") {
      return HttpResponse.json(
        { error: "Ten adres e-mail jest już zajęty. Zaloguj się na swoje konto." },
        { status: 409 },
      );
    }

    if (data.email === "oauth@test.pl") {
      return HttpResponse.json(
        {
          error:
            "Konto z tym adresem e-mail już istnieje i jest połączone z Google. Zaloguj się przez Google.",
        },
        { status: 409 },
      );
    }

    if (!data.name || !data.email || !data.password || data.password.length < 6) {
      return HttpResponse.json(
        { error: "Nieprawidłowe dane" },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      { success: "Użytkownik został utworzony" },
      { status: 201 },
    );
  }),
];
