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
  - Intercept 401 unauthorized errors, refresh the session, and retry the action once before failing.
  - Clear the draft upon successful submission.

## 3. Reference Stability & Context Hygiene
- Context provider values: every object or array passed as the `value` prop to a `<Context.Provider>` must be memoized using `useMemo` (or sourced from a memoized hook return). Never pass inline unmemoized object literals or inline closures.
- Action handlers: all callbacks exposed via context or passed as props to memoized components (`React.memo`) must be wrapped in `useCallback` with complete dependency arrays.
- Custom hook return memoization: when a custom hook exposes multiple handlers and state objects for consumption by context providers or memoized children, its return object must be wrapped in `useMemo`.

## 4. Zod Schema & Validation Conventions
- Split schemas into dedicated domain files in `schemas/` (e.g. `schemas/product.ts`, `schemas/review.ts`). Monolithic schema files are forbidden.
- Schema constants (values): always use `camelCase` ending with `Schema` (e.g. `productCreateSchema`, `reviewCreateSchema`).
- Inferred types: always use `PascalCase` ending with `Input` (e.g. `ProductCreateInput`, `ReviewCreateInput`).
