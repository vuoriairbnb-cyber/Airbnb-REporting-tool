# Supabase Foundation

This folder is the source of truth for Supabase project structure.

## Project

```txt
project_id = cjrjkfxmstftebajemtv
```

The GitHub integration is configured with:

```txt
Working directory: .
Production branch: main
```

## Migrations

The initial schema lives in:

```txt
supabase/migrations/001_initial_schema_rls_storage.sql
```

It creates:

- `profiles`
- `properties`
- `categories`
- `income_entries`
- `expense_entries`
- `source_documents`
- `receipts`
- `reports`
- `subscriptions`
- `usage_events`
- `audit_events`

It also creates enums, indexes, `updated_at` triggers, RLS policies, default categories and private Storage buckets.

## Seed Data

Default category seed data lives in:

```txt
supabase/seed.sql
```

The migration already inserts the default MVP categories for production deploys. The seed file exists for local reset workflows and is written to avoid duplicate default category names.

## RLS Assumptions

- User-owned rows include a `user_id` column.
- User access policies use `auth.uid() = user_id`.
- `profiles.id` maps directly to `auth.users.id`.
- Default categories have `user_id is null`.
- Users can read default categories and their own categories.
- Server-only workflows may use the service role key, but browser code must never receive it.

## Storage Assumptions

Buckets are private:

- `receipt-originals`
- `receipt-previews`
- `generated-reports`

Object paths should start with the authenticated user id:

```txt
{user_id}/{entity_id}/filename.ext
```

Storage policies allow users to read and upload objects only when the first path segment matches `auth.uid()`. Server-side report generation can use the admin client to write files, then return signed URLs to users after ownership checks.
