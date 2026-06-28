-- User interface language preference.
alter table public.profiles
  add column if not exists language text not null default 'en';

alter table public.profiles
  drop constraint if exists profiles_language_check;

alter table public.profiles
  add constraint profiles_language_check
  check (language in ('en', 'fi'));
