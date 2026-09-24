<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NexusSupply agent context

## Application

NexusSupply is a multi-business supply chain management platform. One operator
uses it to manage inventory, suppliers, purchasing, orders, and fulfillment for
one or more client businesses. Preserve strict separation between client
businesses while providing authorized operators with a unified view.

The current implementation includes the public landing page, responsive
navigation, theming, verified email/password and social authentication,
sessions, role-aware dashboard navigation, and role-specific dashboard
onboarding views. Do not present planned supply chain workflows as already
implemented.

## Stack and structure

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- Base UI and shadcn components in `components/ui/`
- Better Auth configuration in `lib/auth.ts`
- Prisma with PostgreSQL; the source schema is `prisma/schema.prisma`
- Generated Prisma code lives in `app/generated/prisma/`; never edit it by hand
- `app/(root)/` contains public routes and `app/(auth)/` contains auth routes
- `app/(dashboard)/dashboard/` contains the authenticated dashboard layout and
  role-aware dashboard page
- Dashboard sidebar components live in `components/sidebar/`
- Use the `@/` alias for project-root imports

## Authentication and dashboard behavior

- Email/password signup requires email verification, sends users to `/verify`,
  and uses `/dashboard` as the post-verification callback.
- Better Auth automatically signs users in after successful verification.
- Derive dashboard roles from the server session. Sidebar visibility is not an
  authorization boundary; every data route must independently authorize role
  and tenant access on the server.
- `SidebarNavigation.tsx` owns role-to-link configuration and active link state.
  `AppSidebar.tsx` loads the trusted session, and `SidebarUserMenu.tsx` owns the
  account dropdown and logout interaction.
- Customer links currently target guarded placeholder pages for vendors,
  products, inventory, orders, business settings, and support. These workflows
  are not implemented yet and must remain labeled as coming soon.
- `SiteLogo` supports `textClassNames`; the dashboard hides its text only while
  the sidebar is collapsed.

## Domain and security rules

- Model every supply chain record as belonging to a client business or tenant.
- Enforce tenant boundaries and authorization on the server, not only in UI.
- Treat `USER`, `MANAGER`, `CUSTOMER`, and `CSR` as authorization inputs; never
  trust a role supplied by a browser request.
- Keep secrets server-only. Never expose database, auth, or OAuth credentials,
  and never commit real values from `.env`.
- Avoid destructive schema or migration changes unless explicitly requested.

## Implementation conventions

- Prefer Server Components; add `'use client'` only for browser APIs, state, or
  interactive event handlers.
- Reuse existing layout, navigation, auth, and UI components before adding new
  abstractions.
- Use design tokens such as `bg-background`, `text-foreground`, and
  `text-muted-foreground` so new interfaces support light and dark themes.
- Keep interfaces responsive and accessible, including keyboard focus,
  semantic elements, labels, and meaningful alternative text.
- Follow the existing formatting: single quotes, semicolons, and Tailwind
  utility classes.
- After changes, run targeted ESLint checks and run `npm run build` for changes
  affecting routes, authentication, database access, or production behavior.
- The current production build has a pre-existing UploadThing type mismatch in
  `components/form-fields/FileUploadField.tsx`: `onUploadProgress` expects a
  number, while the component currently destructures a `{ progress }` object.
