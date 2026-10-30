-- 결과가 0행이면 배치와 내부 장면 치수가 일치한다.
select location.name, placement.width_cm, placement.height_cm, placement.depth_cm,
       layout.width_cm as scene_width, layout.height_cm as scene_height,
       layout.depth_cm as scene_depth
from public.space_placements placement
join public.locations location on location.id = placement.location_id
left join public.space_layouts layout on layout.scene_location_id = location.id
where location.deleted_at is null
  and (layout.id is null or
    (placement.width_cm, placement.height_cm, placement.depth_cm)
      is distinct from (layout.width_cm, layout.height_cm, layout.depth_cm));

-- 결과가 0행이면 공간·벽·창문이 저장된 부모 범위 안에 들어온다.
select 'space' as kind, placement.id, placement.layout_id
from public.space_placements placement
join public.space_layouts layout on layout.id = placement.layout_id
join public.locations location on location.id = placement.location_id
where location.deleted_at is null and (
  placement.x_cm + placement.width_cm > layout.width_cm or
  placement.y_cm + placement.height_cm > layout.height_cm or
  placement.z_cm + placement.depth_cm > layout.depth_cm
)
union all
select structure.kind, structure.id, structure.layout_id
from public.scene_structures structure
join public.space_layouts layout on layout.id = structure.layout_id
where structure.x_cm + structure.width_cm > layout.width_cm or
      structure.y_cm + structure.height_cm > layout.height_cm or
      structure.z_cm + structure.depth_cm > layout.depth_cm;
-- enabled가 O이면 트리거가 활성화되어 있다. 0행이면 마이그레이션 미적용이다.
select tgname, tgenabled as enabled
from pg_trigger
where tgrelid = 'public.space_placements'::regclass
  and tgname = 'space_placements_sync_dimensions'
  and not tgisinternal;

