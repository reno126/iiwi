import { http, HttpResponse } from "msw";
import { REGISTER_API_MESSAGES } from "@/schemas/register";

export const handlers = [
  http.post("*/api/register", async ({ request }) => {
    const data = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };

    if (data.email === "zajety@test.pl" || data.email === "existing@example.com") {
      return HttpResponse.json(
        { error: REGISTER_API_MESSAGES.emailTaken },
        { status: 409 },
      );
    }

    if (data.email === "oauth@test.pl") {
      return HttpResponse.json(
        {
          error: REGISTER_API_MESSAGES.oauthAccountLinked("Google"),
        },
        { status: 409 },
      );
    }

    if (!data.name || !data.email || !data.password || data.password.length < 6) {
      return HttpResponse.json(
        { error: REGISTER_API_MESSAGES.invalidData },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      { success: REGISTER_API_MESSAGES.userCreated },
      { status: 201 },
    );
  }),
];
