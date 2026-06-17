# Airbnb Reporting App — Product & MVP Plan

## 1. Product definition

This product is a mobile-first SaaS web app for small Airbnb and short-term rental hosts.

The core purpose is to help hosts organize rental income, expenses, receipts and expense allocation assumptions so they can prepare clearer tax-season reports with less manual work.

The app is not a professional tax, legal or accounting service. It is a reporting preparation and organization tool.

## 2. Core positioning

### One-sentence product description

> Airbnb income, expenses and receipts organized for tax season.

### Longer product description

> A mobile-first reporting tool for Airbnb hosts to track rental income, scan expense receipts with AI, allocate expenses between rental and personal use, and generate CSV/PDF/ZIP reports for tax-filing preparation.

### Internal product promise

> Help small hosts spend less time preparing Airbnb reports and stay more organized with income, expenses, receipts and candidate reportable amounts.

### What the app helps with

The app helps users:

- Track Airbnb or short-term rental income.
- Record rental-related expenses.
- Scan receipts and extract structured data with AI.
- Connect each expense to a property.
- Categorize expenses.
- Define rental-use allocation percentages.
- Calculate candidate reportable expense amounts based on user-selected allocation rules.
- Generate reports for tax-filing preparation.
- Keep receipts organized and attached to expenses.

### What the app does not do

The app does not:

- Give tax advice.
- Decide what is legally deductible.
- Guarantee that an expense is accepted by a tax authority.
- Replace an accountant, tax advisor or professional bookkeeping system.
- Automatically file taxes.
- Automatically submit data to a tax authority.

## 3. Target user

Primary target user:

- Small Airbnb host.
- Short-term rental host.
- Usually 1–10 properties.
- Often manages reporting manually.
- Uses spreadsheets, folders, emails or photos for receipts.
- Wants a simpler way to prepare rental income and expense information.
- Uses the product frequently on mobile, but may review reports on desktop.

Not the first target user:

- Large property management companies.
- Professional accountants managing many clients.
- Enterprise hospitality operators.
- Users needing full double-entry bookkeeping.

## 4. MVP scope

The MVP includes these 11 core areas:

```txt
1. Properties
2. Income entries
3. Expense entries
4. Receipt scanning
5. AI extraction
6. Expense categories
7. Allocation percentage
8. Candidate reportable amount
9. Dashboard
10. Reports: CSV/PDF/ZIP
11. Disclaimer
```

## 5. MVP feature details

### 5.1 Properties

A property is the main reporting unit. Each income entry and expense entry should be linked to a property.

Minimum fields:

```txt
id
user_id
name
address optional
city optional
country
currency
default_allocation_method optional
default_allocation_percentage optional
is_active
created_at
updated_at
```

Examples:

```txt
Helsinki Studio
Lapland Cabin
Tampere Apartment
```

### 5.2 Income entries

Income entries represent rental income. MVP uses manual entry first. Platform imports can come later.

Minimum fields:

```txt
id
user_id
property_id
date
platform
gross_amount
platform_fee
cleaning_fee
net_payout
currency
notes
created_at
updated_at
```

Example platforms:

```txt
Airbnb
Booking.com
Direct
Other
```

Income entry logic:

```txt
gross_amount = total guest-paid or host-recorded income amount
platform_fee = platform fee if user knows it
cleaning_fee = cleaning fee if tracked separately
net_payout = payout received by host
```

The product should not assume all platforms report data the same way.

### 5.3 Expense entries

Expense entries are the main expense objects. A receipt can create an expense draft, but the expense entry is the object used in reports.

Minimum fields:

```txt
id
user_id
property_id
receipt_id optional
date
vendor
category_id
description optional
total_amount
currency
allocation_method
allocation_percentage
candidate_reportable_amount
allocation_note
status
notes
created_at
updated_at
```

Recommended statuses:

```txt
draft
needs_review
reviewed
excluded
archived
```

### 5.4 Receipt scanning

Receipts are attachments and data sources for expense entries.

A user can:

- Upload a receipt image.
- Upload a PDF.
- Take a photo from a mobile browser file input.
- Review AI-extracted data.
- Link receipt data to an expense.
- Keep a receipt archive.

The receipt is not the primary reporting object. The expense entry is.

### 5.5 AI extraction

AI extracts receipt data into a structured draft.

Extracted fields:

```txt
date
vendor
total_amount
currency
tax/VAT if visible
payment_method if visible
last4 if visible
line items if visible
suggested category
confidence
warnings
```

AI output must always be reviewed by the user before it becomes a reviewed expense.

AI provider must be implemented behind an adapter layer so the product is not hardcoded to one AI provider.

User-facing AI modes:

```txt
Fast scan
Accurate scan
Scan again accurately
```

Do not show internal model names as primary user-facing UI.

### 5.6 Expense categories

Default MVP categories:

```txt
Cleaning
Repairs & maintenance
Supplies
Furniture & equipment
Utilities
Internet & subscriptions
Platform fees
Insurance
Loan interest
Housing company fees / maintenance charges
Professional services
Travel & transport
Other
```

Users can later customize categories.

Category wording should remain neutral. Avoid words like “guaranteed deductible”.

### 5.7 Allocation percentage

Allocation is the rental-use share of the expense selected by the user.

Examples:

```txt
100% rental use
50% rental use
Based on rental days
Based on square meters
Manual percentage
Excluded
```

MVP can start with:

```txt
100% rental use
Manual percentage
Excluded
```

Later versions can add rental-day and square-meter-based calculations.

Recommended fields:

```txt
allocation_method
allocation_percentage
allocation_note
```

### 5.8 Candidate reportable amount

This is the calculated amount based on the user’s chosen allocation.

Formula:

```txt
candidate_reportable_amount = total_amount * allocation_percentage / 100
```

Example:

```txt
Total expense: 100 EUR
Rental-use allocation: 60%
Candidate reportable amount: 60 EUR
```

Use:

```txt
Candidate reportable amount
Estimated reportable amount
Tax-preparation amount
```

Avoid:

```txt
Guaranteed deduction
Correct tax deduction
Tax optimized amount
```

### 5.9 Dashboard

Dashboard should answer:

```txt
How much rental income have I recorded this year?
How many expenses have I recorded this year?
What is the candidate reportable expense amount?
What is my estimated rental result?
Which receipts or expenses need review?
Which expenses are missing allocation?
```

Suggested dashboard cards:

```txt
Rental income this year
Expenses this year
Candidate reportable expenses
Estimated rental result
Receipts needing review
Expenses missing allocation
```

### 5.10 Reports: CSV/PDF/ZIP

Reports are for tax-filing preparation, not accountant packaging by default.

MVP report types:

```txt
Income CSV
Expense CSV
Allocation CSV
Tax-preparation summary PDF
Receipt archive ZIP
Full reporting ZIP
```

PDF report title examples:

```txt
Airbnb Reporting Summary 2026
Rental Income and Expense Preparation Report 2026
```

ZIP structure example:

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

### 5.11 Disclaimer

Disclaimer should be visible:

- During onboarding.
- Before report generation.
- In Settings.
- In generated PDF reports.

Recommended disclaimer:

```txt
This app helps you organize rental income, expenses, receipts and allocation assumptions for reporting preparation. It does not provide tax, legal, accounting or bookkeeping advice. You are responsible for verifying what you report to the tax authority.
```

Finnish version:

```txt
Tämä sovellus auttaa järjestämään vuokraustoiminnan tuloja, kuluja, kuitteja ja jakoperusteita raportoinnin valmistelua varten. Sovellus ei tarjoa vero-, laki-, kirjanpito- tai tilitoimistopalvelua. Käyttäjä vastaa itse siitä, mitä ilmoittaa verottajalle.
```

## 6. SaaS structure

The product has four major layers:

```txt
Public website
Subscription
Web App
Mobile/PWA layer
```

### 6.1 Public website

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
```

Purpose:

- Explain the product.
- Build trust.
- Convert visitors into trial or paid users.
- Provide legal/privacy information.
- Direct users to signup and login.

### 6.2 Subscription

```txt
Subscription
├─ Stripe Checkout
├─ Subscription status
├─ Usage limits
└─ Billing Portal
```

Purpose:

- Sell subscription plans.
- Track plan and status.
- Apply usage limits.
- Allow customer self-service billing management.

### 6.3 Web App

```txt
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

Purpose:

- Provide the actual app experience.
- Track and organize reporting data.
- Generate reports.
- Guide the user through the workflow.

### 6.4 Mobile/PWA layer

```txt
Mobile/PWA layer
├─ Mobile-first UI
├─ Add to Home Screen guide
├─ App icon
└─ Standalone web app behavior
```

Purpose:

- Make the web app feel app-like on phones.
- Allow users to add an icon to the phone home screen.
- Avoid App Store / Google Play complexity during MVP.
- Support a mobile usage pattern where receipts are captured immediately.

## 7. Recommended tech stack

### Frontend

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
react-hook-form
zod
TanStack Query
```

### Backend / platform

```txt
Supabase Postgres
Supabase Auth
Supabase Storage
Supabase Row Level Security
Vercel hosting
Next.js Route Handlers
```

### Payments

```txt
Stripe Checkout
Stripe Billing
Stripe Customer Portal
Stripe webhooks
```

### AI

```txt
AI provider adapter
OpenAI adapter
Anthropic adapter
Mock adapter
Optional Google/Gemini adapter later
```

### Reports

```txt
CSV generator
PDF generator
ZIP generator
Server-side report generation
Private generated exports storage
Signed download URLs
```

### Storage

```txt
Supabase private buckets
receipt-originals
receipt-previews
generated-reports
```

### Mobile/PWA

```txt
manifest.json / Next.js metadata manifest
apple-touch-icon
favicon
display: standalone
theme color
mobile viewport
Add to Home Screen guide
```

## 8. Suggested route structure

```txt
/
/features
/pricing
/disclaimer
/privacy
/terms
/login
/signup

/app/dashboard
/app/properties
/app/income
/app/expenses
/app/receipts
/app/reports
/app/settings
/app/settings/billing
/app/settings/categories
/app/settings/mobile-install
```

API routes:

```txt
/api/stripe/create-checkout-session
/api/stripe/create-portal-session
/api/stripe/webhook

/api/uploads/create-source-document
/api/ai/parse-receipt
/api/ai/reparse-receipt

/api/income
/api/expenses
/api/receipts
/api/reports/create
/api/reports/[id]
```

## 9. Subscription plans

Initial suggested plans:

### Free trial

```txt
1 property
limited receipt scans
manual income and expense tracking
basic dashboard
CSV preview or limited CSV
```

### Starter

```txt
1–2 properties
monthly receipt scan allowance
income tracking
expense tracking
allocation percentages
CSV exports
basic PDF report
receipt archive
```

### Pro

```txt
more properties
higher scan allowance
accurate scan mode
advanced reports
ZIP receipt archive
custom categories
annual tax-preparation report
future platform import features
```

Usage limits to track:

```txt
number of properties
AI scans per month
accurate scans per month
reports generated
receipt storage amount
```

## 10. Development phases

### Phase 1 — Public website and app foundation

```txt
Next.js app
Landing page
Features page
Pricing page placeholder
Auth pages
App shell
Supabase project setup
Basic RLS
Profiles
Properties
Disclaimer acceptance
```

### Phase 2 — Manual reporting app

```txt
Properties CRUD
Income entries
Expense entries
Categories
Allocation percentage
Candidate reportable amount
Dashboard summary
```

### Phase 3 — Receipt scanning with mock AI

```txt
Receipt upload
Private storage
Source documents
Mock AI extraction
Receipt review
Receipt-linked expense creation
```

### Phase 4 — Real AI extraction

```txt
AI provider adapter
Real provider implementation
Schema validation
Re-scan accurately
Usage tracking
AI consent gate
```

### Phase 5 — Reports

```txt
Income CSV
Expense CSV
Allocation CSV
Tax-preparation PDF
Receipt ZIP
Full reporting ZIP
```

### Phase 6 — Subscription and production readiness

```txt
Stripe Checkout
Subscription status
Usage limits
Billing portal
Webhooks
Rate limits
Error monitoring
PWA install guide
```

## 11. Definition of Done for MVP

MVP is done when a user can:

```txt
1. Visit a public landing page.
2. Sign up and accept disclaimer.
3. Create a property.
4. Add income manually.
5. Add expenses manually.
6. Upload a receipt.
7. Let AI extract receipt data.
8. Review and correct the extracted expense.
9. Select an expense category.
10. Select allocation percentage.
11. See candidate reportable amount.
12. View dashboard totals.
13. Generate CSV reports.
14. Generate PDF report.
15. Generate receipt ZIP.
16. See subscription status.
17. Open billing settings.
18. Add the web app to phone home screen using instructions.
```

## 12. Key product risks

### Risk 1: Tax-advice perception

Mitigation:

- Use careful wording.
- Add disclaimers.
- Use “candidate”, “estimated” and “preparation”.
- Avoid “guaranteed deductible” and “tax optimized”.

### Risk 2: AI extraction errors

Mitigation:

- Always require user review.
- Show confidence and warnings.
- Allow manual correction.
- Provide accurate re-scan.

### Risk 3: Scope creep

Mitigation:

- MVP starts with manual income and expenses.
- Platform imports come later.
- Do not build full bookkeeping.
- Do not build accountant portal in MVP.

### Risk 4: Mobile UX not good enough

Mitigation:

- Design mobile-first.
- Test upload and review on phone.
- Add home-screen installation guide.
- Use app-like navigation.

### Risk 5: Subscription before value

Mitigation:

- Build value flow before full billing complexity.
- Add Stripe test mode early but go live only after core flow works.
