create extension if not exists pgcrypto;

create type expense_status as enum (
  'draft',
  'needs_review',
  'reviewed',
  'excluded',
  'archived'
);

create type receipt_status as enum (
  'uploaded',
  'processing',
  'needs_review',
  'reviewed',
  'failed',
  'archived'
);

create type source_document_status as enum (
  'uploaded',
  'processing',
  'processed',
  'failed'
);

create type report_status as enum (
  'pending',
  'processing',
  'ready',
  'failed'
);

create type report_type as enum (
  'income_csv',
  'expense_csv',
  'allocation_csv',
  'tax_preparation_pdf',
  'receipt_archive_zip',
  'full_reporting_zip'
);

create type ai_scan_mode as enum (
  'fast',
  'accurate'
);

create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'none'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  country text,
  default_currency text not null default 'EUR',
  ai_processing_consent_at timestamptz,
  disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  city text,
  country text,
  currency text not null default 'EUR',
  default_allocation_method text,
  default_allocation_percentage numeric(5,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_default_allocation_percentage_check
    check (default_allocation_percentage is null or default_allocation_percentage between 0 and 100)
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_default_owner_check
    check ((is_default = true and user_id is null) or (is_default = false))
);

create table income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  date date not null,
  platform text not null default 'Airbnb',
  gross_amount numeric(12,2),
  platform_fee numeric(12,2),
  cleaning_fee numeric(12,2),
  net_payout numeric(12,2),
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table source_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  original_file_path text not null,
  original_file_name text,
  mime_type text,
  file_size_bytes bigint,
  page_count int,
  status source_document_status not null default 'uploaded',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_document_id uuid references source_documents(id) on delete set null,
  expense_entry_id uuid,
  status receipt_status not null default 'uploaded',
  original_file_path text,
  image_path text,
  preview_image_path text,
  crop_image_path text,
  page_number int,
  ai_provider text,
  ai_model text,
  ai_scan_mode ai_scan_mode,
  ai_confidence numeric(4,3),
  ai_raw_response jsonb,
  ai_normalized_response jsonb,
  ai_error_message text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receipts_ai_confidence_check
    check (ai_confidence is null or ai_confidence between 0 and 1)
);

create table expense_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  receipt_id uuid references receipts(id) on delete set null,
  date date,
  vendor text,
  vendor_normalized text,
  category_id uuid references categories(id) on delete set null,
  description text,
  total_amount numeric(12,2),
  tax_amount numeric(12,2),
  currency text not null default 'EUR',
  allocation_method text not null default 'manual_percentage',
  allocation_percentage numeric(5,2) not null default 100,
  candidate_reportable_amount numeric(12,2),
  allocation_note text,
  status expense_status not null default 'draft',
  notes text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_entries_allocation_percentage_check
    check (allocation_percentage between 0 and 100)
);

alter table receipts
  add constraint receipts_expense_entry_id_fkey
  foreign key (expense_entry_id) references expense_entries(id) on delete set null;

create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type report_type not null,
  status report_status not null default 'pending',
  property_id uuid references properties(id) on delete set null,
  date_from date,
  date_to date,
  file_path text,
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  filters jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'free',
  status subscription_status not null default 'none',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index properties_user_id_idx on properties(user_id);
create index income_entries_user_date_idx on income_entries(user_id, date desc);
create index income_entries_property_id_idx on income_entries(property_id);
create index expense_entries_user_date_idx on expense_entries(user_id, date desc);
create index expense_entries_property_id_idx on expense_entries(property_id);
create index expense_entries_status_idx on expense_entries(user_id, status);
create index source_documents_user_id_idx on source_documents(user_id);
create index receipts_user_status_idx on receipts(user_id, status);
create index reports_user_created_idx on reports(user_id, created_at desc);
create index usage_events_user_type_created_idx on usage_events(user_id, event_type, created_at desc);
create index audit_events_user_created_idx on audit_events(user_id, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on profiles
for each row execute function set_updated_at();

create trigger properties_set_updated_at
before update on properties
for each row execute function set_updated_at();

create trigger categories_set_updated_at
before update on categories
for each row execute function set_updated_at();

create trigger income_entries_set_updated_at
before update on income_entries
for each row execute function set_updated_at();

create trigger source_documents_set_updated_at
before update on source_documents
for each row execute function set_updated_at();

create trigger receipts_set_updated_at
before update on receipts
for each row execute function set_updated_at();

create trigger expense_entries_set_updated_at
before update on expense_entries
for each row execute function set_updated_at();

create trigger reports_set_updated_at
before update on reports
for each row execute function set_updated_at();

create trigger subscriptions_set_updated_at
before update on subscriptions
for each row execute function set_updated_at();

create or replace function create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into subscriptions (user_id, plan, status)
  values (new.id, 'free', 'none')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function create_profile_for_new_user();

alter table profiles enable row level security;
alter table properties enable row level security;
alter table categories enable row level security;
alter table income_entries enable row level security;
alter table expense_entries enable row level security;
alter table source_documents enable row level security;
alter table receipts enable row level security;
alter table reports enable row level security;
alter table subscriptions enable row level security;
alter table usage_events enable row level security;
alter table audit_events enable row level security;

create policy "Users can read own profile"
on profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read own properties"
on properties for select
using (auth.uid() = user_id);

create policy "Users can insert own properties"
on properties for insert
with check (auth.uid() = user_id);

create policy "Users can update own properties"
on properties for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own properties"
on properties for delete
using (auth.uid() = user_id);

create policy "Users can read default and own categories"
on categories for select
using (user_id is null or auth.uid() = user_id);

create policy "Users can insert own categories"
on categories for insert
with check (auth.uid() = user_id and is_default = false);

create policy "Users can update own categories"
on categories for update
using (auth.uid() = user_id and is_default = false)
with check (auth.uid() = user_id and is_default = false);

create policy "Users can delete own categories"
on categories for delete
using (auth.uid() = user_id and is_default = false);

create policy "Users can read own income entries"
on income_entries for select
using (auth.uid() = user_id);

create policy "Users can insert own income entries"
on income_entries for insert
with check (auth.uid() = user_id);

create policy "Users can update own income entries"
on income_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own income entries"
on income_entries for delete
using (auth.uid() = user_id);

create policy "Users can read own expense entries"
on expense_entries for select
using (auth.uid() = user_id);

create policy "Users can insert own expense entries"
on expense_entries for insert
with check (auth.uid() = user_id);

create policy "Users can update own expense entries"
on expense_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own expense entries"
on expense_entries for delete
using (auth.uid() = user_id);

create policy "Users can read own source documents"
on source_documents for select
using (auth.uid() = user_id);

create policy "Users can insert own source documents"
on source_documents for insert
with check (auth.uid() = user_id);

create policy "Users can update own source documents"
on source_documents for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own source documents"
on source_documents for delete
using (auth.uid() = user_id);

create policy "Users can read own receipts"
on receipts for select
using (auth.uid() = user_id);

create policy "Users can insert own receipts"
on receipts for insert
with check (auth.uid() = user_id);

create policy "Users can update own receipts"
on receipts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own receipts"
on receipts for delete
using (auth.uid() = user_id);

create policy "Users can read own reports"
on reports for select
using (auth.uid() = user_id);

create policy "Users can insert own reports"
on reports for insert
with check (auth.uid() = user_id);

create policy "Users can update own reports"
on reports for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own subscription"
on subscriptions for select
using (auth.uid() = user_id);

create policy "Users can read own usage"
on usage_events for select
using (auth.uid() = user_id);

create policy "Users can insert own usage"
on usage_events for insert
with check (auth.uid() = user_id);

create policy "Users can read own audit events"
on audit_events for select
using (auth.uid() = user_id);

insert into categories (name, sort_order, is_default)
values
  ('Cleaning', 10, true),
  ('Repairs & maintenance', 20, true),
  ('Supplies', 30, true),
  ('Furniture & equipment', 40, true),
  ('Utilities', 50, true),
  ('Internet & subscriptions', 60, true),
  ('Platform fees', 70, true),
  ('Insurance', 80, true),
  ('Loan interest', 90, true),
  ('Housing company fees / maintenance charges', 100, true),
  ('Professional services', 110, true),
  ('Travel & transport', 120, true),
  ('Other', 130, true);

insert into storage.buckets (id, name, public)
values
  ('receipt-originals', 'receipt-originals', false),
  ('receipt-previews', 'receipt-previews', false),
  ('generated-reports', 'generated-reports', false)
on conflict (id) do update set public = excluded.public;

create policy "Users can read own receipt originals"
on storage.objects for select
using (
  bucket_id = 'receipt-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own receipt originals"
on storage.objects for insert
with check (
  bucket_id = 'receipt-originals'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own receipt previews"
on storage.objects for select
using (
  bucket_id = 'receipt-previews'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own receipt previews"
on storage.objects for insert
with check (
  bucket_id = 'receipt-previews'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own generated reports"
on storage.objects for select
using (
  bucket_id = 'generated-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own generated reports"
on storage.objects for insert
with check (
  bucket_id = 'generated-reports'
  and (storage.foldername(name))[1] = auth.uid()::text
);
