# Forms, State Management & Schemas

## 1. Form Handling & React Hook Form
- All interactive forms must use React Hook Form (`useForm`) integrated with `zodResolver(schema)`.
- Eliminate redundant `useState`:
  - Input field values: use uncontrolled inputs with `{...register("fieldName")}`.
  - Form submission state: use `formState.isSubmitting`.
  - Server and API errors: map errors into `setError("root", { message })` and render `errors.root?.message`.

## 2. Async Triggers & Auth Drafts
- For asynchronous triggers outside form submission (e.g. Google OAuth `signIn`, scrape initiation), use React 19 `useTransition` instead of manual `useState` loading flags.
- Auth-Gated Submit (`useAuthGatedSubmit` + `reviewDraftStorage`):
  - Check authentication via `useEnsureAuthenticated`.
  - If unauthenticated, save form state to `localStorage` with TTL and redirect to `/login?callbackUrl=...`.
  - On login or registration, the callback URL restores the user to their form draft.
  - After a server unauthorized response, force a session refresh even when the client still has a cached user. If refresh fails, save the draft and redirect to login without retrying. If refresh succeeds, retry the action at most once and handle its success, server errors, and validation errors through the same path as the initial response.
  - Clear the draft upon successful submission.

## 3. Reference Stability & Context Hygiene
- Context provider values: every object or array passed as the `value` prop to a `<Context.Provider>` must be memoized using `useMemo` (or sourced from a memoized hook return). Never pass inline unmemoized object literals or inline closures.
- Action handlers: all callbacks exposed via context or passed as props to memoized components (`React.memo`) must be wrapped in `useCallback` with complete dependency arrays.
- Custom hook return memoization: when a custom hook exposes multiple handlers and state objects for consumption by context providers or memoized children, its return object must be wrapped in `useMemo`.

## 4. Zod Schema & Validation Conventions
- Split schemas into dedicated domain files in `schemas/` (e.g. `schemas/product.ts`, `schemas/review.ts`). Monolithic schema files are forbidden.
- Schema constants (values): always use `camelCase` ending with `Schema` (e.g. `productCreateSchema`, `reviewCreateSchema`).
- Inferred types: always use `PascalCase` ending with `Input` (e.g. `ProductCreateInput`, `ReviewCreateInput`).

## 5. Registration and Credentials

- Registration, the login form, and server-side credentials authentication share `authEmailSchema`: trim surrounding whitespace, preserve case, and limit email addresses to 254 characters. Email identity remains case-sensitive to match existing stored accounts and the database unique constraint. Do not lowercase addresses without a separate migration and collision policy covering existing credentials and OAuth accounts.
- Registration trims names and accepts 2–100 characters. Passwords remain unchanged and require at least 6 characters and at most 72 UTF-8 bytes, matching bcrypt's input limit. Login retains compatibility with existing passwords.
- Malformed JSON and invalid fields return 400. Existing emails and database uniqueness conflicts return 409. Unexpected failures are logged server-side and return a generic error without exception details.
- Registration transport failures appear as root form errors and allow retry. Once account creation succeeds, failed automatic login redirects to the login page with the callback URL preserved.
