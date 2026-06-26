-- Receipt/source document archive metadata.
-- This keeps private storage files private and avoids destructive browser-side deletes.

alter table public.source_documents
  add column if not exists archived_at timestamptz;

alter table public.receipts
  add column if not exists archived_at timestamptz;

create index if not exists source_documents_user_archived_idx
  on public.source_documents (user_id, archived_at);

create index if not exists receipts_user_status_archived_idx
  on public.receipts (user_id, status, archived_at);
