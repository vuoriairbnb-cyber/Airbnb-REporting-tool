-- Stripe webhooks run server-side and need to upsert subscription state.
-- RLS stays enabled; this only restores table privileges for the Supabase
-- service_role used by server-only webhook/admin clients.

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.subscriptions to service_role;
