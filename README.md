# HostReport

Mobile-first reporting preparation for small Airbnb and short-term rental hosts.

HostReport helps users organize rental income, expenses, receipts and allocation assumptions so they can prepare clearer tax-season reports. It is not a tax, legal, accounting or bookkeeping service. Users are responsible for verifying what they report to the tax authority.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible component structure
- Supabase Auth, Postgres, Storage and RLS
- Next.js Route Handlers
- Stripe placeholders
- AI provider adapter placeholders

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Required for the current Supabase foundation:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Optional server-only values for later phases:

```bash
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://127.0.0.1:3000
```

## Scripts

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

## Supabase

The Supabase project config lives in:

```txt
supabase/config.toml
```

The initial production schema migration lives in:

```txt
supabase/migrations/001_initial_schema_rls_storage.sql
```

It creates the core tables, enums, RLS policies, private storage buckets and default categories.

Default category seed data also exists separately in:

```txt
supabase/seed.sql
```

## Security Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Browser and server user-context clients use the publishable key.
- Admin operations must use server-only code paths.
- RLS is enabled on all user-owned tables.
- Receipt and report buckets are private.
- Downloads should use signed URLs.
- AI receipt extraction must require user review before creating reviewed expenses.
