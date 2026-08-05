# Memory — boothfinder

Last updated: 2026-07-08

---

### What was built this session
- **Project Foundation**: Initialized Next.js 16 (Turbopack) + PWA + Tailwind v4.
- **Database Schema**: Defined 15 tables in InsForge for user profiles, booths, leads, visits, and contests.
- **Authentication**: Implemented Clerk with org-aware routing and a role-based `<Show>` component.
- **Middleware**: Created `middleware.ts` using Clerk's async `auth()` helper to handle public routes, onboarding redirects, and organization-specific routing.
- **Onboarding Flow**: Built `/onboarding` page and Server Actions to sync Clerk users with InsForge profiles.
- **Idle Sign-In**: Developed `IdleSignInPrompt` and `useIdleTimer` hook to drive user conversion after 3 minutes.
- **Admin Settings**: Implemented a global settings panel to manage the `wayfinding_fee_enabled` toggle.

### Decisions made
- **Proxy Pattern**: Used `middleware.ts` for middleware to align with the provided architecture guidelines while adapting to Clerk's `createRouteMatcher` deprecation.
- **InsForge Client**: Constructed the InsForge client per-request using a fresh `edgeFunctionToken` for server-side operations.
- **Tailwind v4**: Integrated design tokens directly into `app/globals.css` using CSS variables to ensure consistency with `ui-tokens.md`.

### Problems solved
- **Clerk Migration**: Successfully migrated from `createRouteMatcher` to manual path matching and resource-based checks as per latest Clerk docs.
- **Hydration/Linting**: Fixed React hydration errors and ESLint issues in the idle timer components.

### Current state
- Phase 1 (Core Foundation) is complete.
- Authentication, Onboarding, and Admin Settings are functional.
- The project is ready for Phase 2 (Map Core).

### Next session starts with
- Implementation of Feature 2 (Map Core): Integrating Mappedin Web SDK v6 and rendering the initial floor plan.

### Open questions
- None at this stage.
