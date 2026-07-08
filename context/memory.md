# Memory — boothfinder

Last updated: 2026-07-08

---

### What was built this session
- **Project Foundation**: Initialized Next.js 16 (Turbopack) + PWA + Tailwind v4.
- **Database Schema**: Defined and created 15 tables in InsForge for user profiles, booths, leads, visits, and contests using the InsForge CLI.
- **Authentication**: Implemented Clerk with org-aware routing and a role-based `<Show>` component.
- **Middleware**: Created `proxy.ts` using Clerk's async `auth()` helper to handle public routes, onboarding redirects, and organization-specific routing.
- **Onboarding Flow**: Built `/onboarding` page and Server Actions to sync Clerk users with InsForge profiles.
- **Idle Sign-In**: Developed `IdleSignInPrompt` and `useIdleTimer` hook to drive user conversion after 3 minutes.
- **Admin Settings**: Implemented a global settings panel to manage the `wayfinding_fee_enabled` toggle.
- **Venue Discovery**: Built `/events` page to browse active and upcoming events.
- **Map Integration**: Integrated Mappedin Web SDK v6 and implemented interactive map viewer at `/events/[eventId]`.
- **Wayfinding & Leads**: Implemented blue-dot navigation and server-side lead/visit tracking.
- **ClickPesa Integration**: Implemented mobile money payments for onboarding with real-time status tracking and webhooks.

### Decisions made
- **Proxy Pattern**: Used `proxy.ts` for middleware to align with the provided architecture guidelines while adapting to Clerk's `createRouteMatcher` deprecation.
- **InsForge Client**: Constructed the InsForge client per-request using a fresh `edgeFunctionToken` for server-side operations.
- **Tailwind v4**: Integrated design tokens directly into `app/globals.css` using CSS variables to ensure consistency with `ui-tokens.md`.
- **Mappedin v6**: Used `@mappedin/react-sdk` with `ssr: false` and `transpilePackages` to support Next.js 16.

### Problems solved
- **Clerk Migration**: Successfully migrated from `createRouteMatcher` to manual path matching and resource-based checks as per latest Clerk docs.
- **Hydration/Linting**: Fixed React hydration errors and ESLint issues in the idle timer components.
- **SDK Transpilation**: Resolved Mappedin SDK ESM issues by adding it to `transpilePackages` in `next.config.ts`.

### Current state
- Phase 1 (Foundation) is complete.
- Phase 2 (Venue Map & Navigation) is complete (Features 6, 7, 8, 9).
- Authentication, Onboarding, and Interactive Map Viewer are functional.
- Wayfinding and leads capture are integrated server-side.

### Next session starts with
- Implementation of Phase 4 — Feature 12 (Booth panel + Organization Profile): Creating the dashboard for booth owners and integrating the organization profile.

### Open questions
- None at this stage.
