-- 물건·공간·3D 배치·구조물 변경을 DB에서 자동 기록한다.
-- 기록은 과거 이름과 위치를 JSON으로 보관하므로, 이후 공간 이름이 바뀌거나
-- 삭제되어도 당시의 상황을 읽을 수 있다.

alter table public.activity_events
  drop constraint if exists activity_events_entity_type_check;

alter table public.activity_events
  add constraint activity_events_entity_type_check
  check (entity_type in ('location', 'item', 'home_member', 'structure', 'layout'));

create or replace function public.activity_location_snapshot(target_location_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  location_name text;
  location_path text;
begin
  if target_location_id is null then
    return jsonb_build_object('id', null, 'name', '우리 집', 'path', '우리 집');
  end if;

  with recursive location_chain as (
    select id, parent_id, name, name::text as path, 1 as depth
    from public.locations
    where id = target_location_id

    union all

    select parent.id, parent.parent_id, parent.name,
      parent.name || ' › ' || location_chain.path,
      location_chain.depth + 1
    from public.locations parent
    join location_chain on location_chain.parent_id = parent.id
    where location_chain.depth < 30
  )
  select name, path
  into location_name, location_path
  from location_chain
  order by depth desc
  limit 1;

  return jsonb_build_object(
    'id', target_location_id,
    'name', coalesce(location_name, '알 수 없는 공간'),
    'path', case
      when location_path is null then '알 수 없는 공간'
      else '우리 집 › ' || location_path
    end
  );
end;
$$;

create or replace function public.activity_layout_snapshot(target_layout_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_layout public.space_layouts%rowtype;
begin
  select *
  into target_layout
  from public.space_layouts
  where id = target_layout_id;

  if not found then
    return jsonb_build_object('id', target_layout_id, 'name', '알 수 없는 공간');
  end if;

  return jsonb_build_object(
    'id', target_layout.id,
    'location', public.activity_location_snapshot(target_layout.scene_location_id),
    'widthCm', target_layout.width_cm,
    'heightCm', target_layout.height_cm,
    'depthCm', target_layout.depth_cm
  );
end;
$$;

create or replace function public.activity_location_snapshot_from_values(
  target_location_id uuid,
  target_parent_id uuid,
  target_name text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  parent_path text;
begin
  parent_path := public.activity_location_snapshot(target_parent_id) ->> 'path';

  return jsonb_build_object(
    'id', target_location_id,
    'name', target_name,
    'path', case
      when parent_path is null or parent_path = '' then '우리 집 › ' || target_name
      else parent_path || ' › ' || target_name
    end
  );
end;
$$;

create or replace function public.record_activity_event(
  target_home_id uuid,
  target_entity_type text,
  target_entity_id uuid,
  target_action text,
  previous_data jsonb default null,
  changed_data jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  operation_value text;
  current_operation_id uuid;
begin
  if not public.is_home_member(target_home_id) then
    raise exception '활동 기록을 남길 권한이 없습니다.';
  end if;

  operation_value := current_setting('app.activity_operation_id', true);
  current_operation_id := case
    when operation_value is null or operation_value = '' then gen_random_uuid()
    else operation_value::uuid
  end;

  insert into public.activity_events (
    home_id,
    entity_type,
    entity_id,
    action,
    actor_id,
    before_data,
    after_data,
    operation_id
  )
  values (
    target_home_id,
    target_entity_type,
    target_entity_id,
    target_action,
    auth.uid(),
    previous_data,
    changed_data,
    current_operation_id
  );
end;
$$;

create or replace function public.log_item_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_snapshot jsonb;
  next_snapshot jsonb;
  event_action text;
begin
  if tg_op = 'INSERT' then
    next_snapshot := jsonb_build_object(
      'title', new.title,
      'quantity', new.quantity,
      'unit', new.unit,
      'category', new.category,
      'note', new.note,
      'location', public.activity_location_snapshot(new.location_id)
    );
    perform public.record_activity_event(new.home_id, 'item', new.id, 'created', null, next_snapshot);
    return new;
  end if;

  previous_snapshot := jsonb_build_object(
    'title', old.title,
    'quantity', old.quantity,
    'unit', old.unit,
    'category', old.category,
    'note', old.note,
    'location', public.activity_location_snapshot(old.location_id)
  );

  if tg_op = 'DELETE' then
    perform public.record_activity_event(old.home_id, 'item', old.id, 'deleted', previous_snapshot, null);
    return old;
  end if;

  if old.title is not distinct from new.title
    and old.location_id is not distinct from new.location_id
    and old.quantity is not distinct from new.quantity
    and old.unit is not distinct from new.unit
    and old.category is not distinct from new.category
    and old.note is not distinct from new.note
    and old.deleted_at is not distinct from new.deleted_at then
    return new;
  end if;

  next_snapshot := jsonb_build_object(
    'title', new.title,
    'quantity', new.quantity,
    'unit', new.unit,
    'category', new.category,
    'note', new.note,
    'location', public.activity_location_snapshot(new.location_id)
  );
  event_action := case
    when old.deleted_at is null and new.deleted_at is not null then 'deleted'
    when old.deleted_at is not null and new.deleted_at is null then 'restored'
    when old.location_id is distinct from new.location_id then 'moved'
    else 'updated'
  end;

  perform public.record_activity_event(new.home_id, 'item', new.id, event_action, previous_snapshot, next_snapshot);
  return new;
end;
$$;

create or replace function public.log_location_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_snapshot jsonb;
  next_snapshot jsonb;
  event_action text;
begin
  if tg_op = 'INSERT' then
    perform public.record_activity_event(
      new.home_id,
      'location',
      new.id,
      'created',
      null,
      jsonb_build_object('name', new.name, 'location', public.activity_location_snapshot(new.id))
    );
    return new;
  end if;

  previous_snapshot := jsonb_build_object(
    'name', old.name,
    'colorHex', old.color_hex,
    'isPanelVisible', old.is_panel_visible,
    'location', public.activity_location_snapshot_from_values(old.id, old.parent_id, old.name)
  );

  if tg_op = 'DELETE' then
    perform public.record_activity_event(old.home_id, 'location', old.id, 'deleted', previous_snapshot, null);
    return old;
  end if;

  if old.name is not distinct from new.name
    and old.parent_id is not distinct from new.parent_id
    and old.color_hex is not distinct from new.color_hex
    and old.is_panel_visible is not distinct from new.is_panel_visible
    and old.deleted_at is not distinct from new.deleted_at then
    return new;
  end if;

  next_snapshot := jsonb_build_object(
    'name', new.name,
    'colorHex', new.color_hex,
    'isPanelVisible', new.is_panel_visible,
    'location', public.activity_location_snapshot(new.id)
  );
  event_action := case
    when old.deleted_at is null and new.deleted_at is not null then 'deleted'
    when old.deleted_at is not null and new.deleted_at is null then 'restored'
    when old.parent_id is distinct from new.parent_id then 'moved'
    else 'updated'
  end;

  perform public.record_activity_event(new.home_id, 'location', new.id, event_action, previous_snapshot, next_snapshot);
  return new;
end;
$$;

create or replace function public.log_space_placement_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_home_id uuid;
  target_location_id uuid;
  previous_snapshot jsonb;
  next_snapshot jsonb;
begin
  target_location_id := case when tg_op = 'DELETE' then old.location_id else new.location_id end;
  select home_id into target_home_id
  from public.space_layouts
  where id = case when tg_op = 'DELETE' then old.layout_id else new.layout_id end;

  if target_home_id is null then
    select home_id into target_home_id
    from public.locations
    where id = target_location_id;
  end if;

  if target_home_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    next_snapshot := jsonb_build_object(
      'location', public.activity_location_snapshot(new.location_id),
      'layout', public.activity_layout_snapshot(new.layout_id),
      'xCm', new.x_cm, 'yCm', new.y_cm, 'zCm', new.z_cm,
      'widthCm', new.width_cm, 'heightCm', new.height_cm, 'depthCm', new.depth_cm
    );
    perform public.record_activity_event(target_home_id, 'location', new.location_id, 'created', null, next_snapshot);
    return new;
  end if;

  previous_snapshot := jsonb_build_object(
    'location', public.activity_location_snapshot(old.location_id),
    'layout', public.activity_layout_snapshot(old.layout_id),
    'xCm', old.x_cm, 'yCm', old.y_cm, 'zCm', old.z_cm,
    'widthCm', old.width_cm, 'heightCm', old.height_cm, 'depthCm', old.depth_cm
  );

  if tg_op = 'DELETE' then
    perform public.record_activity_event(target_home_id, 'location', old.location_id, 'deleted', previous_snapshot, null);
    return old;
  end if;

  if old.x_cm is not distinct from new.x_cm
    and old.y_cm is not distinct from new.y_cm
    and old.z_cm is not distinct from new.z_cm
    and old.width_cm is not distinct from new.width_cm
    and old.height_cm is not distinct from new.height_cm
    and old.depth_cm is not distinct from new.depth_cm then
    return new;
  end if;

  next_snapshot := jsonb_build_object(
    'location', public.activity_location_snapshot(new.location_id),
    'layout', public.activity_layout_snapshot(new.layout_id),
    'xCm', new.x_cm, 'yCm', new.y_cm, 'zCm', new.z_cm,
    'widthCm', new.width_cm, 'heightCm', new.height_cm, 'depthCm', new.depth_cm
  );
  perform public.record_activity_event(target_home_id, 'location', new.location_id, 'moved', previous_snapshot, next_snapshot);
  return new;
end;
$$;

create or replace function public.log_structure_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_home_id uuid;
  previous_snapshot jsonb;
  next_snapshot jsonb;
begin
  select home_id into target_home_id
  from public.space_layouts
  where id = case when tg_op = 'DELETE' then old.layout_id else new.layout_id end;

  if target_home_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    next_snapshot := jsonb_build_object(
      'name', new.name, 'kind', new.kind, 'layout', public.activity_layout_snapshot(new.layout_id),
      'xCm', new.x_cm, 'yCm', new.y_cm, 'zCm', new.z_cm,
      'widthCm', new.width_cm, 'heightCm', new.height_cm, 'depthCm', new.depth_cm,
      'colorHex', new.color_hex, 'isLabelVisible', new.is_label_visible
    );
    perform public.record_activity_event(target_home_id, 'structure', new.id, 'created', null, next_snapshot);
    return new;
  end if;

  previous_snapshot := jsonb_build_object(
    'name', old.name, 'kind', old.kind, 'layout', public.activity_layout_snapshot(old.layout_id),
    'xCm', old.x_cm, 'yCm', old.y_cm, 'zCm', old.z_cm,
    'widthCm', old.width_cm, 'heightCm', old.height_cm, 'depthCm', old.depth_cm,
    'colorHex', old.color_hex, 'isLabelVisible', old.is_label_visible
  );

  if tg_op = 'DELETE' then
    perform public.record_activity_event(target_home_id, 'structure', old.id, 'deleted', previous_snapshot, null);
    return old;
  end if;

  if old.name is not distinct from new.name
    and old.kind is not distinct from new.kind
    and old.x_cm is not distinct from new.x_cm
    and old.y_cm is not distinct from new.y_cm
    and old.z_cm is not distinct from new.z_cm
    and old.width_cm is not distinct from new.width_cm
    and old.height_cm is not distinct from new.height_cm
    and old.depth_cm is not distinct from new.depth_cm
    and old.color_hex is not distinct from new.color_hex
    and old.is_label_visible is not distinct from new.is_label_visible then
    return new;
  end if;

  next_snapshot := jsonb_build_object(
    'name', new.name, 'kind', new.kind, 'layout', public.activity_layout_snapshot(new.layout_id),
    'xCm', new.x_cm, 'yCm', new.y_cm, 'zCm', new.z_cm,
    'widthCm', new.width_cm, 'heightCm', new.height_cm, 'depthCm', new.depth_cm,
    'colorHex', new.color_hex, 'isLabelVisible', new.is_label_visible
  );
  perform public.record_activity_event(target_home_id, 'structure', new.id, 'updated', previous_snapshot, next_snapshot);
  return new;
end;
$$;

create or replace function public.log_layout_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_snapshot jsonb;
  next_snapshot jsonb;
begin
  if tg_op = 'INSERT' then
    return new;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if old.width_cm is not distinct from new.width_cm
    and old.height_cm is not distinct from new.height_cm
    and old.depth_cm is not distinct from new.depth_cm then
    return new;
  end if;

  previous_snapshot := jsonb_build_object(
    'location', public.activity_location_snapshot(old.scene_location_id),
    'widthCm', old.width_cm, 'heightCm', old.height_cm, 'depthCm', old.depth_cm
  );
  next_snapshot := jsonb_build_object(
    'location', public.activity_location_snapshot(new.scene_location_id),
    'widthCm', new.width_cm, 'heightCm', new.height_cm, 'depthCm', new.depth_cm
  );
  perform public.record_activity_event(new.home_id, 'layout', new.id, 'updated', previous_snapshot, next_snapshot);
  return new;
end;
$$;

drop trigger if exists items_activity_archive on public.items;
create trigger items_activity_archive
after insert or update or delete on public.items
for each row execute procedure public.log_item_activity();

drop trigger if exists locations_activity_archive on public.locations;
create trigger locations_activity_archive
after insert or update or delete on public.locations
for each row execute procedure public.log_location_activity();

drop trigger if exists space_placements_activity_archive on public.space_placements;
create trigger space_placements_activity_archive
after insert or update or delete on public.space_placements
for each row execute procedure public.log_space_placement_activity();

drop trigger if exists scene_structures_activity_archive on public.scene_structures;
create trigger scene_structures_activity_archive
after insert or update or delete on public.scene_structures
for each row execute procedure public.log_structure_activity();

drop trigger if exists space_layouts_activity_archive on public.space_layouts;
create trigger space_layouts_activity_archive
after insert or update or delete on public.space_layouts
for each row execute procedure public.log_layout_activity();

create or replace function public.delete_location_with_items(
  target_location_id uuid,
  item_action text,
  destination_location_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_location public.locations%rowtype;
begin
  perform set_config('app.activity_operation_id', gen_random_uuid()::text, true);

  if item_action not in ('move', 'trash') then
    raise exception '물건 처리 방법이 올바르지 않습니다.';
  end if;

  select * into target_location
  from public.locations
  where id = target_location_id and deleted_at is null;

  if not found then
    raise exception '삭제할 공간을 찾을 수 없습니다.';
  end if;

  if not public.is_home_member(target_location.home_id) then
    raise exception '이 공간을 삭제할 권한이 없습니다.';
  end if;

  if exists (
    select 1 from public.locations child
    where child.parent_id = target_location.id and child.deleted_at is null
  ) then
    raise exception '안에 다른 공간이 있어 먼저 삭제할 수 없습니다.';
  end if;

  if item_action = 'move' then
    if destination_location_id is null or destination_location_id = target_location.id then
      raise exception '물건을 옮길 다른 공간을 선택해 주세요.';
    end if;

    if not exists (
      select 1 from public.locations destination
      where destination.id = destination_location_id
        and destination.home_id = target_location.home_id
        and destination.deleted_at is null
    ) then
      raise exception '물건을 옮길 공간을 찾을 수 없습니다.';
    end if;

    update public.items
    set location_id = destination_location_id, updated_at = now()
    where home_id = target_location.home_id
      and location_id = target_location.id and deleted_at is null;
  else
    update public.items
    set deleted_at = now(), updated_at = now()
    where home_id = target_location.home_id
      and location_id = target_location.id and deleted_at is null;
  end if;

  update public.locations
  set deleted_at = now()
  where id = target_location.id;
end;
$$;

revoke execute on function public.activity_location_snapshot(uuid) from public;
revoke execute on function public.activity_layout_snapshot(uuid) from public;
revoke execute on function public.activity_location_snapshot_from_values(uuid, uuid, text) from public;
revoke execute on function public.record_activity_event(uuid, text, uuid, text, jsonb, jsonb) from public;
revoke execute on function public.log_item_activity() from public;
revoke execute on function public.log_location_activity() from public;
revoke execute on function public.log_space_placement_activity() from public;
revoke execute on function public.log_structure_activity() from public;
revoke execute on function public.log_layout_activity() from public;
grant execute on function public.delete_location_with_items(uuid, text, uuid) to authenticated;
