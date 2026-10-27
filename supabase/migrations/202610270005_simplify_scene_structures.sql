-- Architectural structures are visual building elements, not inventory locations.
-- Doors are represented by gaps between wall segments. Windows are independent areas.

alter table public.scene_structures
drop constraint if exists scene_openings_require_wall;

delete from public.scene_structures
where kind = 'door';

alter table public.scene_structures
drop constraint if exists scene_structures_kind_check;

alter table public.scene_structures
add constraint scene_structures_kind_check
check (kind in ('wall', 'window'));

alter table public.scene_structures
drop column if exists parent_wall_id;
