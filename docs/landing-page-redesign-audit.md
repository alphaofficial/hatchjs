# Landing page redesign audit

## Current page
- `src/views/pages/Home.tsx` owns the whole public landing page and keeps all copy, sections, feature data, steps, FAQs, install command, and copy button behavior local to the component.
- The current first viewport is centered text with a small preview badge, primary sandbox CTA, GitHub CTA, and install command block. It is readable but visually flat: no product-specific hero illustration, little hierarchy beyond type size, and the install command reads as a utility block instead of a memorable product moment.
- Navigation currently links to `#features`, `#how`, `#faq`, GitHub, and `/login` for guests. Hero CTA points guests to `/register` and authenticated users to `/home`; this behavior must stay intact.
- Existing product explanation sections are text and code heavy. The strongest content to preserve is `res.inertia(...)`, "Controller -> Component", "Server-side rendered on first load", "Type-safe page registry", and "Client-side navigation via Inertia".
- There are no meaningful landing-page illustrations today. The only SVGs are copy/check icons inside the install copy button.

## Existing coverage
- `test/integration/requests/pages.spec.ts` verifies `/` renders the `Home` Inertia component for guests and authenticated users and keeps `applicationName`.
- `test/integration/playwright/auth.spec.ts` only checks the public home page is accessible before focusing on auth forms and auth redirects.
- There is no coverage for landing-page visible copy, CTA targets, install command text/copy action, hero state for authenticated users, or illustration presence.

## Redesign targets
- Hero content: keep the core promise but make it more concrete, e.g. "Express controllers. Inertia pages. React without the API tax." Support with copy that names the request flow: route -> controller -> `res.inertia()` -> React page -> hydrated navigation.
- CTA treatment: keep guest primary CTA to `/register` with text close to "Try the sandbox"; keep authenticated primary CTA to `/home` with text close to "Open the app"; keep secondary GitHub CTA. Avoid changing route names or auth behavior.
- Install command: keep the exact curl command and copy button behavior. Present it as a terminal strip with stable responsive width, a short label like "Install in one command", and the existing `--quick my-app` note.
- First illustration: add an accessible inline SVG or Tailwind-built diagram in or adjacent to the hero showing `Express route`, `Controller`, `res.inertia()`, `React page`, and `Hydrated app`. Mark purely visual shapes `aria-hidden`; keep those labels available as visible text or accessible names.
- Workflow section: replace the text-heavy centered layout with a scannable two-column or stepped flow that pairs the controller code sample with page-prop outcomes. Preserve the current code sample meaning but reduce visual density on mobile.
- Supporting illustrations: later sections can use lightweight inline diagrams for batteries included, auth sandbox, or deployment flow. Do not add image dependencies or a new icon package.
- Responsive constraints: nav must wrap or simplify on narrow screens; hero headline, CTA row, install command, and diagrams need fixed/stable dimensions, `min-w-0`, and horizontal overflow only for code/terminal text.

## Test targets for implementation iterations
- Request tests should continue asserting `/` renders `Home` for guest and authenticated sessions.
- Add Playwright checks for hero headline/supporting copy, guest CTA `/register`, authenticated CTA `/home` if practical, GitHub CTA, install command text, copy button label/state, and the presence of architecture-flow labels.
- Add viewport checks for at least mobile and desktop once layout work starts, focused on visible nav, CTA row, install command, and illustration container.
