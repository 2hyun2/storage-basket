-- 읽기 전용: 결과가 있으면 005 적용 전에 해당 연결을 확인한다.
select 'location-parent' as kind, child.id, child.home_id, child.parent_id as reference_id
from public.locations child join public.locations parent on parent.id = child.parent_id
where child.home_id <> parent.home_id
union all
select 'item-location', item.id, item.home_id, item.location_id
from public.items item join public.locations location on location.id = item.location_id
where item.home_id <> location.home_id
union all
select 'layout-location', layout.id, layout.home_id, layout.scene_location_id
from public.space_layouts layout join public.locations location on location.id = layout.scene_location_id
where layout.home_id <> location.home_id;

with recursive tree as (
  select id as origin, id, parent_id, array[id] as path, false as cycle from public.locations
  union all
  select t.origin, p.id, p.parent_id, t.path || p.id, p.id = any(t.path)
  from public.locations p join tree t on p.id = t.parent_id where not t.cycle
)
select distinct origin as cyclic_location_id from tree where cycle;

select location.id, location.name
from public.locations location join public.locations parent on parent.id = location.parent_id
where location.deleted_at is null and parent.deleted_at is not null;
