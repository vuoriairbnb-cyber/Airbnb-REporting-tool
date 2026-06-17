# Airbnb Reporting App — Technical Structure

## 1. System overview

The application is a mobile-first SaaS web app for Airbnb and short-term rental hosts.

The system has four major layers:

```txt
Public website
Subscription
Web App
Mobile/PWA layer
```

The technical stack is:

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
Supabase Auth
Supabase Postgres
Supabase Storage
Supabase Row Level Security
Stripe Checkout/Billing/Portal/Webhooks
AI provider adapter
Vercel
```

## 2. High-level product tree

```txt
Public website
├─ Landing page
│  └─ "Airbnb income, expenses and receipts organized for tax season"
├─ Features
│  ├─ Income tracking
│  ├─ AI receipt scanning
│  ├─ Expense allocation
│  ├─ Candidate reportable amounts
│  └─ Reports CSV/PDF/ZIP
├─ Pricing
├─ Disclaimer
├─ Privacy / Terms
└─ Signup/Login

Subscription
├─ Stripe Checkout
├─ Subscription status
├─ Usage limits
└─ Billing Portal

Web App
├─ Dashboard
├─ Properties
├─ Income
├─ Expenses
│  ├─ manual expense
│  ├─ receipt-linked expense
│  ├─ category
│  └─ allocation %
├─ Receipts
│  ├─ upload
│  ├─ AI extraction
│  ├─ review
│  └─ archive
├─ Reports
│  ├─ income report
│  ├─ expense report
│  ├─ allocation report
│  ├─ tax-preparation PDF
│  ├─ CSV
│  └─ ZIP receipts
└─ Settings
   ├─ billing
   ├─ categories
   ├─ AI consent
   ├─ disclaimer
   └─ Add to Home Screen guide
```

## 3. Recommended Next.js route structure

```txt
src/
  app/
    (marketing)/
      page.tsx
      features/
        page.tsx
      pricing/
        page.tsx
      disclaimer/
        page.tsx
      privacy/
        page.tsx
      terms/
        page.tsx

    (auth)/
      login/
        page.tsx
      signup/
        page.tsx
      reset-password/
        page.tsx

    (app)/
      app/
        layout.tsx
        dashboard/
          page.tsx
        properties/
          page.tsx
          new/
            page.tsx
          [id]/
            page.tsx
        income/
          page.tsx
          new/
            page.tsx
          [id]/
            page.tsx
        expenses/
          page.tsx
          new/
            page.tsx
          [id]/
            page.tsx
        receipts/
          page.tsx
          upload/
            page.tsx
          [id]/
            page.tsx
          [id]/review/
            page.tsx
        reports/
          page.tsx
          [id]/
            page.tsx
        settings/
          page.tsx
          billing/
            page.tsx
          categories/
            page.tsx
          mobile-install/
            page.tsx

    api/
      stripe/
        create-checkout-session/
          route.ts
        create-portal-session/
          route.ts
        webhook/
          route.ts

      uploads/
        create-source-document/
          route.ts

      ai/
        parse-receipt/
          route.ts
        reparse-receipt/
          route.ts

      income/
        route.ts
      income/[id]/
        route.ts

      expenses/
        route.ts
      expenses/[id]/
        route.ts

      receipts/
        route.ts
      receipts/[id]/
        route.ts
      receipts/[id]/review/
        route.ts

      reports/
        create/
          route.ts
      reports/[id]/
        route.ts
```

## 4. Recommended source folder structure

```txt
src/
  components/
    marketing/
      Hero.tsx
      FeatureGrid.tsx
      PricingCards.tsx
      DisclaimerBlock.tsx
    layout/
      AppShell.tsx
      Sidebar.tsx
      MobileNav.tsx
      PageHeader.tsx
    dashboard/
      SummaryCard.tsx
      DashboardChart.tsx
    properties/
      PropertyForm.tsx
      PropertyList.tsx
    income/
      IncomeForm.tsx
      IncomeList.tsx
    expenses/
      ExpenseForm.tsx
      ExpenseList.tsx
      AllocationSelector.tsx
      CandidateAmountPreview.tsx
    receipts/
      ReceiptUploader.tsx
      ReceiptPreview.tsx
      ReceiptReviewForm.tsx
      ReceiptArchive.tsx
    reports/
      ReportFilters.tsx
      ReportTypeSelector.tsx
      PreviousReports.tsx
    settings/
      BillingPanel.tsx
      CategoryManager.tsx
      ConsentPanel.tsx
      AddToHomeScreenGuide.tsx
    ui/

  lib/
    supabase/
      client.ts
      server.ts
      admin.ts
    auth/
      requireUser.ts
      requireAppAccess.ts
    stripe/
      client.ts
      checkout.ts
      portal.ts
      webhook.ts
      entitlements.ts
    ai/
      index.ts
      types.ts
      providers/
        mock.ts
        openai.ts
        anthropic.ts
      prompts/
        receipt-parser.ts
        category-suggester.ts
      schemas/
        receipt.schema.ts
      normalize.ts
    reports/
      csv.ts
      pdf.ts
      zip.ts
      createReport.ts
      filenames.ts
    storage/
      paths.ts
      signedUrls.ts
    validation/
      properties.ts
      income.ts
      expenses.ts
      reports.ts
    calculations/
      allocation.ts
      dashboard.ts
    constants/
      categories.ts
      plans.ts
      routes.ts
    utils/

  server/
    income/
      queries.ts
      mutations.ts
    expenses/
      queries.ts
      mutations.ts
    receipts/
      parseReceipt.ts
      reviewReceipt.ts
    reports/
      buildIncomeCsv.ts
      buildExpenseCsv.ts
      buildAllocationCsv.ts
      buildSummaryPdf.ts
      buildReceiptZip.ts
    usage/
      trackUsage.ts
      checkLimits.ts
    audit/
      auditEvent.ts

  types/
    database.ts
    app.ts
```

## 5. Database model

### 5.1 Enums

```sql
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
```

### 5.2 profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  country text,
  default_currency text default 'EUR',
  ai_processing_consent_at timestamptz,
  disclaimer_accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.3 properties

```sql
create table properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  city text,
  country text,
  currency text default 'EUR',
  default_allocation_method text,
  default_allocation_percentage numeric(5,2),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.4 categories

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  sort_order int default 0,
  is_default boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.5 income_entries

```sql
create table income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,

  date date not null,
  platform text default 'Airbnb',
  gross_amount numeric(12,2),
  platform_fee numeric(12,2),
  cleaning_fee numeric(12,2),
  net_payout numeric(12,2),
  currency text default 'EUR',
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.6 source_documents

```sql
create table source_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,

  original_file_path text not null,
  original_file_name text,
  mime_type text,
  file_size_bytes bigint,
  page_count int,

  status source_document_status default 'uploaded',
  error_message text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.7 receipts

```sql
create table receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_document_id uuid references source_documents(id) on delete set null,
  expense_entry_id uuid,

  status receipt_status default 'uploaded',

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

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.8 expense_entries

```sql
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
  currency text default 'EUR',

  allocation_method text default 'manual_percentage',
  allocation_percentage numeric(5,2) default 100,
  candidate_reportable_amount numeric(12,2),
  allocation_note text,

  status expense_status default 'draft',
  notes text,

  items jsonb not null default '[]'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Important relationship:

```txt
receipt can create or update expense_entry
expense_entry is used in reports
receipt is evidence/source data
```

### 5.9 reports

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  type report_type not null,
  status report_status default 'pending',

  property_id uuid references properties(id) on delete set null,
  date_from date,
  date_to date,

  file_path text,
  file_name text,
  mime_type text,
  file_size_bytes bigint,

  filters jsonb default '{}'::jsonb,
  error_message text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.10 subscriptions

```sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,

  plan text default 'free',
  status subscription_status default 'none',

  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.11 usage_events

```sql
create table usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

### 5.12 audit_events

```sql
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

## 6. RLS model

Enable RLS on all user-owned tables:

```sql
alter table properties enable row level security;
alter table income_entries enable row level security;
alter table expense_entries enable row level security;
alter table source_documents enable row level security;
alter table receipts enable row level security;
alter table reports enable row level security;
alter table subscriptions enable row level security;
alter table usage_events enable row level security;
alter table audit_events enable row level security;
```

Generic policy pattern:

```sql
create policy "Users can read own rows"
on properties
for select
using (auth.uid() = user_id);

create policy "Users can insert own rows"
on properties
for insert
with check (auth.uid() = user_id);

create policy "Users can update own rows"
on properties
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own rows"
on properties
for delete
using (auth.uid() = user_id);
```

Categories need special read policy:

```sql
create policy "Users can read default and own categories"
on categories
for select
using (user_id is null or auth.uid() = user_id);
```

## 7. Storage structure

Use private buckets:

```txt
receipt-originals
receipt-previews
generated-reports
```

Path conventions:

```txt
receipt-originals/
  {user_id}/
    {source_document_id}/
      original.jpg
      original.pdf

receipt-previews/
  {user_id}/
    {receipt_id}/
      preview.jpg
      crop.jpg

generated-reports/
  {user_id}/
    {report_id}/
      airbnb-reporting-2026.zip
```

Rules:

```txt
Do not use public buckets for receipts.
Do not expose service role key in browser.
Use signed URLs for temporary downloads.
Server can access private files through admin client.
Client access is controlled through RLS/storage policies.
```

## 8. Subscription architecture

### 8.1 Flow

```txt
/pricing
→ user selects plan
→ POST /api/stripe/create-checkout-session
→ Stripe Checkout
→ success redirect
→ Stripe webhook updates subscriptions table
→ app reads subscription status
→ entitlements determine access
```

### 8.2 Billing portal

```txt
/app/settings/billing
→ POST /api/stripe/create-portal-session
→ Stripe Customer Portal
→ user manages payment method/subscription
→ Stripe webhook updates app
```

### 8.3 Entitlements

Entitlements should be code-based, not scattered through UI.

```ts
type Entitlements = {
  maxProperties: number;
  monthlyFastScans: number;
  monthlyAccurateScans: number;
  monthlyReports: number;
  canUseAccurateScan: boolean;
  canGenerateZip: boolean;
  canGeneratePdf: boolean;
  canUseCustomCategories: boolean;
};
```

Example helper functions:

```txt
getCurrentPlan(userId)
getEntitlements(userId)
canCreateProperty(userId)
canRunAiScan(userId, scanMode)
canGenerateReport(userId, reportType)
trackUsage(userId, eventType, metadata)
```

## 9. AI architecture

### 9.1 Provider adapter

The app should call a generic adapter:

```txt
parseReceipt(input)
```

Not:

```txt
parseWithClaude(input)
parseWithOpenAI(input)
```

Provider files:

```txt
lib/ai/providers/mock.ts
lib/ai/providers/openai.ts
lib/ai/providers/anthropic.ts
```

### 9.2 AI input

```ts
type ParseReceiptInput = {
  fileBuffer: Buffer;
  mimeType: string;
  fileName?: string;
  scanMode: "fast" | "accurate";
  localeHint?: string;
  currencyHint?: string;
  categoryHints: string[];
};
```

### 9.3 AI output

```ts
type ParseReceiptResult = {
  provider: "mock" | "openai" | "anthropic";
  model: string;
  scanMode: "fast" | "accurate";
  receipt: {
    date: string | null;
    vendor: string | null;
    total_amount: number | null;
    tax_amount: number | null;
    currency: string | null;
    payment_method: string | null;
    last4: string | null;
    suggested_category: string | null;
    items: ParsedReceiptItem[];
    confidence: number;
    warnings: string[];
  };
  rawResponse: unknown;
};
```

### 9.4 AI parsing flow

```txt
1. User uploads receipt file.
2. Client stores file in receipt-originals.
3. Client calls /api/ai/parse-receipt with sourceDocumentId.
4. Server verifies ownership.
5. Server fetches file from Storage.
6. Server calls AI provider adapter.
7. Server validates response with schema.
8. Server normalizes response.
9. Server creates receipt row.
10. Server creates expense draft.
11. User reviews and confirms.
```

## 10. Expense allocation calculations

Allocation methods:

```txt
full_rental_use
manual_percentage
excluded
```

Calculation:

```ts
function calculateCandidateReportableAmount(total: number, percentage: number): number {
  return roundCurrency(total * percentage / 100);
}
```

Rules:

```txt
full_rental_use → allocation_percentage = 100
excluded → allocation_percentage = 0 and candidate_reportable_amount = 0
manual_percentage → user chooses 0–100
```

Future methods:

```txt
rental_days
square_meters
property_default
```

## 11. Reports architecture

### 11.1 Report creation flow

```txt
Reports page
→ user selects filters and report type
→ POST /api/reports/create
→ create reports row with processing status
→ fetch income/expenses/receipts
→ generate CSV/PDF/ZIP
→ upload to generated-reports
→ mark ready
→ return reportId
→ GET /api/reports/[id] returns signed URL
```

### 11.2 Report types

```txt
income_csv
expense_csv
allocation_csv
tax_preparation_pdf
receipt_archive_zip
full_reporting_zip
```

### 11.3 CSV columns

Income CSV:

```txt
income_id
date
property
platform
gross_amount
platform_fee
cleaning_fee
net_payout
currency
notes
```

Expense CSV:

```txt
expense_id
date
property
vendor
category
total_amount
tax_amount
currency
allocation_method
allocation_percentage
candidate_reportable_amount
notes
receipt_file
status
```

Allocation CSV:

```txt
expense_id
date
property
vendor
category
total_amount
allocation_method
allocation_percentage
candidate_reportable_amount
allocation_note
```

### 11.4 PDF sections

```txt
Title
User/company
Date range
Property filter
Income summary
Expense summary
Candidate reportable amount summary
Category breakdown
Allocation notes
Receipt summary
Disclaimer
```

### 11.5 ZIP structure

```txt
airbnb-reporting-2026/
  summary_2026.pdf
  income_2026.csv
  expenses_2026.csv
  allocations_2026.csv
  receipts/
    2026-01/
      2026-01-02_ikea_45-90_eur_a1b2c3.jpg
    2026-02/
      ...
```

## 12. Public website technical explanation

### 12.1 Landing page

Route:

```txt
/
```

Purpose:

- Explain product in 5 seconds.
- Direct user to signup or pricing.
- Build trust.

Core sections:

```txt
Hero
Problem
How it works
Features
Tax disclaimer
Pricing CTA
FAQ
Footer
```

Hero copy:

```txt
Airbnb income, expenses and receipts organized for tax season.
```

### 12.2 Features

Route:

```txt
/features
```

Feature modules:

```txt
Income tracking
AI receipt scanning
Expense allocation
Candidate reportable amounts
Reports CSV/PDF/ZIP
Mobile-first web app
```

### 12.3 Pricing

Route:

```txt
/pricing
```

Pricing cards:

```txt
Free Trial
Starter
Pro
```

Each card connects to Stripe Checkout later.

### 12.4 Disclaimer

Route:

```txt
/disclaimer
```

Must clearly state no tax/legal/accounting advice.

### 12.5 Privacy and Terms

Routes:

```txt
/privacy
/terms
```

Must explain:

```txt
receipt data
AI processing
payment processing
data deletion
user responsibility
```

## 13. Web app technical explanation

### 13.1 Dashboard

Route:

```txt
/app/dashboard
```

Data sources:

```txt
income_entries
expense_entries
receipts
properties
```

Metrics:

```txt
rental income
expenses
candidate reportable expenses
estimated rental result
needs review count
missing allocation count
```

### 13.2 Properties

Route:

```txt
/app/properties
```

Used by:

```txt
income_entries
expense_entries
source_documents
dashboard filters
reports
```

### 13.3 Income

Route:

```txt
/app/income
```

CRUD over `income_entries`.

### 13.4 Expenses

Route:

```txt
/app/expenses
```

CRUD over `expense_entries`.

Expenses can be:

```txt
manual expense
receipt-linked expense
```

### 13.5 Receipts

Route:

```txt
/app/receipts
```

Subflows:

```txt
upload
AI extraction
review
archive
```

### 13.6 Reports

Route:

```txt
/app/reports
```

Subflows:

```txt
choose filters
choose report type
generate report
download signed URL
view previous reports
```

### 13.7 Settings

Route:

```txt
/app/settings
```

Sections:

```txt
billing
categories
AI consent
disclaimer
Add to Home Screen guide
data deletion
```

## 14. Mobile/PWA layer technical explanation

### 14.1 Mobile-first UI

Principles:

```txt
large tap targets
bottom navigation
mobile cards
simple forms
fast receipt upload
sticky save buttons
clear review states
```

### 14.2 Add to Home Screen guide

Route:

```txt
/app/settings/mobile-install
```

iPhone guide:

```txt
1. Open the app in Safari.
2. Tap the Share button.
3. Tap Add to Home Screen.
4. Confirm Add.
```

Android guide:

```txt
1. Open the app in Chrome.
2. Tap the menu button.
3. Tap Add to Home screen or Install app.
4. Confirm.
```

### 14.3 App icon

Files:

```txt
public/favicon.ico
public/apple-touch-icon.png
public/icons/icon-192.png
public/icons/icon-512.png
```

### 14.4 Manifest

Example:

```json
{
  "name": "Airbnb Reporting App",
  "short_name": "HostReport",
  "start_url": "/app/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 15. Security principles

```txt
1. Never expose service role key in browser.
2. Never expose AI API keys in browser.
3. All user data protected by RLS.
4. Private storage buckets for receipts/reports.
5. Signed URLs for downloads.
6. Stripe webhook signature verification.
7. Server-side subscription status updates only.
8. User ownership checks in every API route.
9. AI consent required before AI parsing.
10. Disclaimer acceptance required before reports.
```

## 16. Core user flows

### 16.1 New user

```txt
Landing page
→ Pricing or signup
→ Signup
→ Onboarding
→ Accept disclaimer
→ AI consent optional/required before AI use
→ Create first property
→ App dashboard
```

### 16.2 Manual reporting

```txt
Dashboard
→ Add income
→ Add expense
→ Set allocation percentage
→ Candidate reportable amount calculated
→ Dashboard updates
```

### 16.3 Receipt-linked expense

```txt
Receipts
→ Upload receipt
→ AI extraction
→ Review
→ Correct fields
→ Select property/category/allocation
→ Save as expense
→ Receipt archived
→ Dashboard updates
```

### 16.4 Report generation

```txt
Reports
→ Select year/property/report type
→ Generate
→ Server creates file
→ File saved privately
→ User downloads via signed URL
```

### 16.5 Subscription management

```txt
Pricing
→ Checkout
→ Stripe payment
→ Webhook updates subscription
→ App entitlements updated
→ User can manage billing in portal
```

## 17. Implementation order

Recommended order:

```txt
1. Next.js project and route groups
2. Public website shell
3. Supabase schema and RLS
4. Auth and onboarding
5. Properties
6. Income entries
7. Expense entries and allocation
8. Dashboard
9. Receipt upload and mock AI
10. Real AI adapter
11. Reports CSV
12. Reports PDF/ZIP
13. Stripe test mode
14. Usage limits
15. Mobile/PWA polish
16. Security review
17. Tests
18. Beta launch
```

Do not build real AI before manual expenses work.
Do not go live with Stripe before the reporting flow is useful.
Do not build App Store mobile app before mobile web/PWA is validated.
