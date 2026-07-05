# Application Tracker

Cross-device job application tracker built with Next.js 16 + Supabase.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS
- PWA support (installable on iPhone + desktop)
- Browser extension (Chrome MV3) for saving applications with one click

## Browser extension

A companion extension lets you save a job application to the tracker without
leaving the job posting: click the toolbar icon, fill in the company, role,
location, and source, and click Save. Nothing is read from the page and
nothing is sent until you click Save; duplicates are skipped automatically.

To install it, open **Settings → Browser Extension → Download extension** in
the running app — the zip is preconfigured for that deployment, so you only
unzip it and load it via `chrome://extensions` → Developer mode → Load
unpacked. Details and the repo-based install are in
[extension/README.md](extension/README.md).

## Setup

See full onboarding guide in [SETUP.md](SETUP.md).

### Quick local setup

1. Install dependencies: `npm install`
2. Copy env file: `cp .env.example .env.local`
3. Fill `.env.local` values from Supabase project settings
4. Start dev server: `npm run dev`

Open http://localhost:3000.

## Database workflow (schema as code)

This repo is configured for migration-first Supabase development.

- Migrations live in [supabase/migrations](supabase/migrations)
- Initial schema migration: [supabase/migrations/20260520000100_init_schema.sql](supabase/migrations/20260520000100_init_schema.sql)
- Apply pending migrations to linked project: `npm run db:push`
- Pull remote schema changes (if needed): `npm run db:pull`

For every schema change:

1. `supabase migration new <change_name>`
2. Edit the generated SQL migration file
3. Run `npm run db:push`
4. Commit + push to GitHub

If Supabase GitHub integration is enabled, pushed migrations are deployed automatically in Supabase.

## Scripts

- `npm run dev` – start local dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` – lint codebase
- `npm run db:push` – apply migrations to linked Supabase project
- `npm run db:pull` – pull remote DB schema into local migration

## Deploy

Deploy on Vercel and add these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Then update Supabase Auth redirect URL:

- `https://your-domain/auth/callback`
