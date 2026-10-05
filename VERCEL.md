# Deploying the website booking form to Vercel

This repo is a pnpm monorepo. Import the repository into Vercel with the **repository root (`.`)** as the project root; `vercel.json` contains the build, static output, API function, and app-route settings.

## Configure Vercel environment variables

Set these in Vercel for Production and Preview:

- `DATABASE_URL` — a PostgreSQL connection string reachable from Vercel. Replit's development database is not the Vercel production database.
- `ADMIN_EMAIL` — the one email allowed to view the submissions inbox.
- `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` — keys for the Clerk application used by the deployed site.
- `VITE_CLERK_PUBLISHABLE_KEY` — the matching Clerk publishable key, available during the Vite build.
- `VITE_CLERK_PROXY_URL` — the full URL of the deployed site's Clerk proxy endpoint, for example `https://your-domain.example/api/__clerk`.

Use the same Clerk application and database for Preview/Production as appropriate, and add the Vercel domains to the Clerk application's allowed origins/redirect settings.

## Prepare the database

Create a PostgreSQL database accessible to Vercel and add its `DATABASE_URL`. Create the app table by running `pnpm --filter @workspace/db run push` with that database URL in your local environment, or run the equivalent SQL from `docs/website-leads.sql`.

The Replit development database has already been prepared for preview use. It is separate from the database you configure in Vercel.
