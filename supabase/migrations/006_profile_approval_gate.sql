-- Manual approval gate for development-stage access.
-- Users can sign up, but app access remains blocked until approved_at is set.
alter table profiles
  add column if not exists approved_at timestamptz;
