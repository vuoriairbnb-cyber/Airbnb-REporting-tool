-- Add the new AI receipt scan tiers while keeping legacy fast/accurate values valid.

alter type public.ai_scan_mode add value if not exists 'standard';
alter type public.ai_scan_mode add value if not exists 'plus';
alter type public.ai_scan_mode add value if not exists 'pro';
