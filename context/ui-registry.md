# boothfinder — UI Component Registry

> **Agent rule**: Before building any UI element, check here first.
> After building any UI element, add it here via `/imprint`.

Last updated: 2026-07-08

---

## How to Add an Entry

```
### ComponentName
- **File**: `path/to/ComponentName.tsx`
- **Purpose**: One sentence — what it renders and when to use it.
- **Props**: Key props with types.
- **Used in**: Routes or pages that currently use this component.
- **Notes**: Gotchas, variants, important usage rules.
```

---

## Registered Components

### Show
- **File**: `components/auth/Show.tsx`
- **Purpose**: Conditional rendering component based on Clerk roles and permissions.
- **Props**: `role?: "admin" | "booth" | "attendee"`, `hasPermission?: string`, `fallback?: React.ReactNode`, `children: React.ReactNode`
- **Used in**: Throughout the app for RBAC.
- **Notes**: Uses `auth()` for server-side role checks.

### IdleSignInPrompt
- **File**: `components/auth/IdleSignInPrompt.tsx`
- **Purpose**: Renders a full-screen sign-in modal after 3 minutes of user inactivity.
- **Props**: None.
- **Used in**: `app/layout.tsx`
- **Notes**: Uses Framer Motion for animations. Only triggers for unauthenticated users.
