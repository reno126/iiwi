# Styling, Mobile Ergonomics & Performance

## 1. Tailwind CSS v4 & Styling Standards
- Use native dynamic numeric scales for all spacing, sizing, layout, and positioning (`p-4`, `max-w-2xl`, `size-5`, `gap-3`).
- Avoid arbitrary bracket syntax (`p-[16px]`, `w-[320px]`).
- Always use semantic color classes (`bg-background`, `text-foreground`) to ensure light and dark theme consistency.

## 2. Mobile-First Ergonomics & Field Islands
- Organize related form fields into distinct, self-contained visual "Field Islands" (card-like containers with `bg-card`, rounded corners, and subtle borders).
- Touch targets: ensure all interactive elements (buttons, checkboxes, select triggers) have a minimum tap target of 48x48px (`size-12` or `min-h-12`).
- Prevent iOS Safari zoom: set mobile input font size to at least 16px (`text-base md:text-sm`).
- Specify appropriate `inputmode` (`numeric`, `email`, `tel`, `url`) and valid `autoComplete` attributes on all inputs.

## 3. Core Web Vitals (CWV) & Performance
- **LCP (< 2.5s):** Mark hero images with `priority` and preload primary web fonts. Stream slow database queries using React `<Suspense>` boundaries.
- **CLS (< 0.1):** Reserve layout dimensions (explicit `width`/`height` or CSS `aspect-ratio`). Provide skeleton loaders matching container height (`min-h-*`).
- **INP (< 200ms):** Defer non-urgent state updates using React 19 `startTransition` or `useTransition`. Debounce search inputs (150–300ms).
- **FCP (< 1.8s):** Import utilities directly without barrel files. Dynamically import heavy non-critical dialogs (`next/dynamic`).
