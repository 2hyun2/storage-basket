begin;
-- 공간·벽·창문 배치 규칙을 DB에서도 검사한다.
-- 브라우저 화면의 안내와 별개로, 여러 기기에서 동시에 수정해도
-- 부모 범위 이탈이나 같은 평면의 겹침이 저장되지 않게 한다.

create or replace function public.validate_space_placement_geometry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_layout public.space_layouts%rowtype;
begin
  -- 동일 공동체의 배치/크기 변경을 직렬화한다. 다음 SELECT는 잠금 후 실행한다.
  perform pg_advisory_xact_lock(hashtextextended(
    (select home_id::text from public.space_layouts where id = new.layout_id), 0));
  select *
  into target_layout
  from public.space_layouts
  where id = new.layout_id;

  if not found then
    raise exception '배치할 3D 공간을 찾을 수 없습니다.';
  end if;

  if not exists (
    select 1
    from public.locations location
    where location.id = new.location_id
      and location.home_id = target_layout.home_id
      and location.deleted_at is null
      and location.parent_id is not distinct from target_layout.scene_location_id
  ) then
    raise exception '이 공간은 현재 부모 공간에 배치할 수 없습니다.';
  end if;

  if new.x_cm + new.width_cm > target_layout.width_cm
    or new.z_cm + new.depth_cm > target_layout.depth_cm
    or new.y_cm + new.height_cm > target_layout.height_cm then
    raise exception '공간이 부모 공간의 크기를 벗어납니다.';
  end if;

  if exists (
    select 1
    from public.space_placements sibling
    join public.locations sibling_location on sibling_location.id = sibling.location_id
    where sibling.layout_id = new.layout_id
      and sibling.id is distinct from new.id
      and sibling_location.deleted_at is null
      and new.x_cm < sibling.x_cm + sibling.width_cm
      and new.x_cm + new.width_cm > sibling.x_cm
      and new.z_cm < sibling.z_cm + sibling.depth_cm
      and new.z_cm + new.depth_cm > sibling.z_cm
  ) then
    raise exception '같은 위치에 이미 다른 공간이 있습니다.';
  end if;

  if exists (
    select 1
    from public.scene_structures structure
    where structure.layout_id = new.layout_id
      and new.x_cm < structure.x_cm + structure.width_cm
      and new.x_cm + new.width_cm > structure.x_cm
      and new.z_cm < structure.z_cm + structure.depth_cm
      and new.z_cm + new.depth_cm > structure.z_cm
  ) then
    raise exception '같은 위치에 이미 벽 또는 창문이 있습니다.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_scene_structure_geometry()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_layout public.space_layouts%rowtype;
begin
  -- 동일 공동체의 배치/크기 변경을 직렬화한다. 다음 SELECT는 잠금 후 실행한다.
  perform pg_advisory_xact_lock(hashtextextended(
    (select home_id::text from public.space_layouts where id = new.layout_id), 0));
  select *
  into target_layout
  from public.space_layouts
  where id = new.layout_id;

  if not found then
    raise exception '구조물을 놓을 3D 공간을 찾을 수 없습니다.';
  end if;

  if new.x_cm + new.width_cm > target_layout.width_cm
    or new.z_cm + new.depth_cm > target_layout.depth_cm
    or new.y_cm + new.height_cm > target_layout.height_cm then
    raise exception '벽 또는 창문이 부모 공간의 크기를 벗어납니다.';
  end if;

  if exists (
    select 1
    from public.space_placements placement
    join public.locations location on location.id = placement.location_id
    where placement.layout_id = new.layout_id
      and location.deleted_at is null
      and new.x_cm < placement.x_cm + placement.width_cm
      and new.x_cm + new.width_cm > placement.x_cm
      and new.z_cm < placement.z_cm + placement.depth_cm
      and new.z_cm + new.depth_cm > placement.z_cm
  ) then
    raise exception '같은 위치에 이미 다른 공간이 있습니다.';
  end if;

  if exists (
    select 1
    from public.scene_structures sibling
    where sibling.layout_id = new.layout_id
      and sibling.id is distinct from new.id
      and new.x_cm < sibling.x_cm + sibling.width_cm
      and new.x_cm + new.width_cm > sibling.x_cm
      and new.z_cm < sibling.z_cm + sibling.depth_cm
      and new.z_cm + new.depth_cm > sibling.z_cm
  ) then
    raise exception '같은 위치에 이미 다른 벽 또는 창문이 있습니다.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_scene_layout_geometry()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.home_id::text, 0));
  if exists (
    select 1
    from public.space_placements placement
    join public.locations location on location.id = placement.location_id
    where placement.layout_id = new.id
      and location.deleted_at is null
      and (
        placement.x_cm + placement.width_cm > new.width_cm
        or placement.z_cm + placement.depth_cm > new.depth_cm
        or placement.y_cm + placement.height_cm > new.height_cm
      )
  ) then
    raise exception '이미 배치된 공간이 새 크기를 벗어납니다. 먼저 내부 배치를 조정해 주세요.';
  end if;

  if exists (
    select 1
    from public.scene_structures structure
    where structure.layout_id = new.id
      and (
        structure.x_cm + structure.width_cm > new.width_cm
        or structure.z_cm + structure.depth_cm > new.depth_cm
        or structure.y_cm + structure.height_cm > new.height_cm
      )
  ) then
    raise exception '이미 배치된 벽 또는 창문이 새 크기를 벗어납니다. 먼저 구조물을 조정해 주세요.';
  end if;

  return new;
end;
$$;

drop trigger if exists space_placements_validate_geometry on public.space_placements;
create trigger space_placements_validate_geometry
before insert or update on public.space_placements
for each row execute procedure public.validate_space_placement_geometry();

drop trigger if exists scene_structures_validate_geometry on public.scene_structures;
create trigger scene_structures_validate_geometry
before insert or update on public.scene_structures
for each row execute procedure public.validate_scene_structure_geometry();

drop trigger if exists space_layouts_validate_geometry on public.space_layouts;
create trigger space_layouts_validate_geometry
before update of width_cm, height_cm, depth_cm on public.space_layouts
for each row execute procedure public.validate_scene_layout_geometry();


commit;

