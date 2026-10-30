-- 기존 배치 중 내부 장면이 없는 공간을 채운다.
insert into public.space_layouts (
  home_id, scene_location_id, layout_key, view_kind,
  width_cm, height_cm, depth_cm
)
select location.home_id, location.id, 'location:' || location.id::text,
       'interior', placement.width_cm, placement.height_cm, placement.depth_cm
from public.locations location
join public.space_placements placement on placement.location_id = location.id
where location.deleted_at is null
on conflict (home_id, layout_key) do nothing;
