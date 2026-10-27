-- Remove one-off demo generation and reset tooling from the live database.
-- Existing Home data is intentionally preserved.

drop function if exists public.seed_demo_spatial_scenes();
drop function if exists public.seed_demo_home_layout();
drop function if exists public.archive_and_reset_current_home();

drop table if exists public.home_data_archives cascade;
