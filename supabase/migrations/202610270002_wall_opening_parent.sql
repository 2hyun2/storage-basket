-- Doors and windows are attached to a single wall.
alter table public.scene_structures
add column if not exists parent_wall_id uuid references public.scene_structures(id) on delete restrict;

-- Link the pre-existing demo door and window to a wall in the same scene.
update public.scene_structures opening
set parent_wall_id = (
  select wall.id
  from public.scene_structures wall
  where wall.layout_id = opening.layout_id
    and wall.kind = 'wall'
  order by wall.created_at
  limit 1
)
where opening.kind in ('door', 'window')
  and opening.parent_wall_id is null;

alter table public.scene_structures
drop constraint if exists scene_openings_require_wall;

alter table public.scene_structures
add constraint scene_openings_require_wall
check (
  (kind = 'wall' and parent_wall_id is null)
  or (kind in ('door', 'window') and parent_wall_id is not null)
);
