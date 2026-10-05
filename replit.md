# Smallsite Booking Form

Smallsite collects booking requests for compact, template-based websites priced at ₦50,000 and gives the owner a private inbox for follow-up.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/website-bookings run dev` — run the public booking form and admin inbox
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required server env: `DATABASE_URL`, `ADMIN_EMAIL`, and Clerk keys (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`)
- Required frontend env: `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/website-bookings/` — public form, Clerk routes, and admin inbox
- `artifacts/api-server/src/routes/website-bookings.ts` — booking submission and owner-only inbox endpoints
- `lib/db/src/schema/websiteLeads.ts` — stored lead fields
- `lib/api-spec/openapi.yaml` — source of truth for the lead API contract
- `VERCEL.md` — Vercel environment and database setup notes
- `docs/website-leads.sql` — SQL for a separately hosted Vercel database

## Architecture decisions

- The public form requires a person name, business name, business type, and at least one contact method (email or phone).
- Admin API access requires a Clerk session and a server-side email allowlist; do not replace this with a client-only route check.
- The Replit development database and the database used by Vercel are separate.

## Product

- Prospects can request a small website by entering their name, business name, contact details, and business niche.
- The owner can review requests in a private inbox.

## User preferences

- The user plans to host the booking site on Vercel.
- The user wants the offer described as a small template-based website, not a bulky custom build.

## Gotchas

- Configure the same Clerk application keys and an accessible PostgreSQL database in Vercel before deploying there.
- Vercel's database needs the `website_leads` table; follow `VERCEL.md` and `docs/website-leads.sql`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
