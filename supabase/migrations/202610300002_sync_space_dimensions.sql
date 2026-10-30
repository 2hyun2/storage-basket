-- 공간 배치와 내부 장면 치수를 같은 트랜잭션에서 저장한다.
begin;

create or replace function public.sync_space_placement_dimensions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_home_id uuid;
begin
  select home_id into target_home_id
  from public.locations where id = new.location_id;

  insert into public.space_layouts (
    home_id, scene_location_id, layout_key, view_kind,
    width_cm, height_cm, depth_cm
  ) values (
    target_home_id, new.location_id, 'location:' || new.location_id::text,
    'interior', new.width_cm, new.height_cm, new.depth_cm
  )
  on conflict (home_id, layout_key) do update set
    width_cm = excluded.width_cm,
    height_cm = excluded.height_cm,
    depth_cm = excluded.depth_cm
  where (space_layouts.width_cm, space_layouts.height_cm, space_layouts.depth_cm)
    is distinct from (excluded.width_cm, excluded.height_cm, excluded.depth_cm);
  return new;
end;
$$;

revoke all on function public.sync_space_placement_dimensions() from public;

drop trigger if exists space_placements_sync_dimensions on public.space_placements;
create trigger space_placements_sync_dimensions
after insert or update of width_cm, height_cm, depth_cm
on public.space_placements
for each row execute function public.sync_space_placement_dimensions();

-- 기존 불일치도 정리한다. 내부 배치가 범위를 벗어나면 기존 검증으로 전체 롤백한다.
update public.space_layouts layout
set width_cm = placement.width_cm,
    height_cm = placement.height_cm,
    depth_cm = placement.depth_cm
from public.space_placements placement
where layout.scene_location_id = placement.location_id
  and (layout.width_cm, layout.height_cm, layout.depth_cm)
    is distinct from (placement.width_cm, placement.height_cm, placement.depth_cm);

commit;
