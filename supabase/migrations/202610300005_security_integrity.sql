-- 기존 SQL 적용 후 실행. 오류가 발생하면 전부 롤백되며 기존 데이터는 삭제하지 않는다.
begin;

-- 참조하는 공간과 소속 공동체는 항상 같아야 한다.
alter table public.locations add constraint locations_id_home_unique unique (id, home_id);
alter table public.locations add constraint locations_parent_same_home
  foreign key (parent_id, home_id) references public.locations(id, home_id);
alter table public.items add constraint items_location_same_home
  foreign key (location_id, home_id) references public.locations(id, home_id);
alter table public.space_layouts add constraint layouts_location_same_home
  foreign key (scene_location_id, home_id) references public.locations(id, home_id);

create or replace function public.validate_inventory_reference()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reference_id uuid;
begin
  -- 계층 변경과 배치 저장에 같은 공동체 잠금을 사용한다.
  perform pg_advisory_xact_lock(hashtextextended(new.home_id::text, 0));
  if tg_op = 'UPDATE' and new.home_id is distinct from old.home_id then
    raise exception '다른 공동체로 직접 옮길 수 없습니다.';
  end if;

  if tg_table_name = 'locations' then
    reference_id := new.parent_id;
    if reference_id is not null and exists (
      with recursive ancestors as (
        select id, parent_id from public.locations where id = reference_id
        union
        select p.id, p.parent_id from public.locations p
        join ancestors a on p.id = a.parent_id
      ) select 1 from ancestors where id = new.id
    ) then
      raise exception '공간을 자기 자신이나 내부 공간으로 옮길 수 없습니다.';
    end if;
    if new.parent_id = new.id then
      raise exception '자기 자신을 포함할 수 없습니다.';
    end if;
  elsif tg_table_name = 'items' then
    reference_id := new.location_id;
  else
    reference_id := new.scene_location_id;
  end if;

  if reference_id is not null and not exists (
    select 1 from public.locations
    where id = reference_id and home_id = new.home_id
      and (deleted_at is null
        or (tg_table_name in ('items', 'locations') and (to_jsonb(new)->>'deleted_at') is not null))
  ) then
    raise exception '이 공동체에서 사용할 수 있는 공간을 선택해 주세요.';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_inventory_reference() from public;

create trigger a_inventory_reference before insert or update on public.locations
for each row execute function public.validate_inventory_reference();
create trigger a_inventory_reference before insert or update on public.items
for each row execute function public.validate_inventory_reference();
create trigger a_inventory_reference before insert or update on public.space_layouts
for each row execute function public.validate_inventory_reference();

-- 권한이 없는 공간 경로를 기록 생성 경유로도 읽을 수 없도록 한다.
create or replace function public.activity_location_snapshot(target_location_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  location_path text;
  location_name text;
  target_home uuid;
begin
  if target_location_id is null then
    return jsonb_build_object('id', null, 'name', '우리 집', 'path', '우리 집');
  end if;
  select home_id, name into target_home, location_name
  from public.locations where id = target_location_id;
  if not found then
    return jsonb_build_object('id', target_location_id, 'name', '삭제된 공간', 'path', '삭제된 공간');
  end if;
  if auth.uid() is not null and not public.is_home_member(target_home) then
    raise exception '공간 기록을 확인할 권한이 없습니다.' using errcode = '42501';
  end if;
  with recursive chain as (
    select id, parent_id, name::text as path, array[id] as visited
    from public.locations where id = target_location_id
    union all
    select p.id, p.parent_id, p.name || ' › ' || c.path, c.visited || p.id
    from public.locations p join chain c on c.parent_id = p.id
    where p.home_id = target_home and not p.id = any(c.visited)
  )
  select path into location_path from chain order by cardinality(visited) desc limit 1;
  return jsonb_build_object('id', target_location_id, 'name', location_name,
    'path', '우리 집 › ' || location_path);
end;
$$;
revoke all on function public.activity_location_snapshot(uuid) from public, anon, authenticated;

-- 기존 순환 계층이 있으면 수정 전 중단한다.
do $$
begin
  if exists (
    with recursive tree as (
      select id, parent_id, array[id] as path, false as cycle from public.locations
      union all
      select p.id, p.parent_id, t.path || p.id, p.id = any(t.path)
      from public.locations p join tree t on p.id = t.parent_id where not t.cycle
    ) select 1 from tree where cycle
  ) then
    raise exception '기존 공간에 순환 계층이 있습니다. 먼저 점검해 주세요.';
  end if;
end;
$$;

commit;
