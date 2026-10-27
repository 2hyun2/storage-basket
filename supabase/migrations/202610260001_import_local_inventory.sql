-- localStorage에 있던 임시 공간·물건을 현재 로그인 사용자의 개인 Home으로 옮긴다.
-- SQL Editor에서 최초 스키마 migration 다음에 한 번 실행한다.

alter table public.locations
  add column if not exists import_key text;

alter table public.items
  add column if not exists import_key text;

create unique index if not exists locations_home_import_key_idx
  on public.locations (home_id, import_key)
  where import_key is not null;

create unique index if not exists items_home_import_key_idx
  on public.items (home_id, import_key)
  where import_key is not null;

create or replace function public.import_local_inventory(
  p_locations jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home_id uuid;
  v_location jsonb;
  v_item jsonb;
  v_location_id uuid;
  v_parent_id uuid;
  v_location_ids jsonb := '{}'::jsonb;
  v_created_locations integer := 0;
  v_created_items integer := 0;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select home_id
    into v_home_id
    from public.home_members
   where user_id = v_user_id
   order by case role when 'owner' then 0 else 1 end, joined_at
   limit 1;

  if v_home_id is null then
    raise exception '가져올 Home을 찾을 수 없습니다.';
  end if;

  for v_location in select value from jsonb_array_elements(coalesce(p_locations, '[]'::jsonb))
  loop
    v_parent_id := null;

    if nullif(v_location ->> 'parentLocalId', '') is not null then
      v_parent_id := nullif(v_location_ids ->> (v_location ->> 'parentLocalId'), '')::uuid;

      if v_parent_id is null then
        raise exception '부모 공간을 먼저 가져올 수 없습니다: %', v_location ->> 'name';
      end if;
    end if;

    select id
      into v_location_id
      from public.locations
     where home_id = v_home_id
       and import_key = 'local:location:' || (v_location ->> 'localId')
     limit 1;

    if v_location_id is null then
      insert into public.locations (home_id, parent_id, name, import_key)
      values (
        v_home_id,
        v_parent_id,
        btrim(v_location ->> 'name'),
        'local:location:' || (v_location ->> 'localId')
      )
      returning id into v_location_id;

      insert into public.activity_events (
        home_id,
        entity_type,
        entity_id,
        action,
        actor_id,
        after_data
      )
      values (
        v_home_id,
        'location',
        v_location_id,
        'created',
        v_user_id,
        jsonb_build_object('name', v_location ->> 'name', 'source', 'localStorage-import')
      );

      v_created_locations := v_created_locations + 1;
    end if;

    v_location_ids := v_location_ids || jsonb_build_object(v_location ->> 'localId', v_location_id::text);
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_location_id := nullif(v_location_ids ->> (v_item ->> 'locationLocalId'), '')::uuid;

    if v_location_id is null then
      raise exception '물건의 보관 공간을 찾을 수 없습니다: %', v_item ->> 'title';
    end if;

    if not exists (
      select 1
        from public.items
       where home_id = v_home_id
         and import_key = 'local:item:' || (v_item ->> 'localId')
    ) then
      insert into public.items (
        home_id,
        location_id,
        title,
        quantity,
        unit,
        category,
        note,
        import_key
      )
      values (
        v_home_id,
        v_location_id,
        btrim(v_item ->> 'title'),
        coalesce((v_item ->> 'quantity')::numeric, 1),
        nullif(btrim(v_item ->> 'unit'), ''),
        nullif(btrim(v_item ->> 'category'), ''),
        nullif(btrim(v_item ->> 'note'), ''),
        'local:item:' || (v_item ->> 'localId')
      )
      returning id into v_location_id;

      insert into public.activity_events (
        home_id,
        entity_type,
        entity_id,
        action,
        actor_id,
        after_data
      )
      values (
        v_home_id,
        'item',
        v_location_id,
        'created',
        v_user_id,
        jsonb_build_object('title', v_item ->> 'title', 'source', 'localStorage-import')
      );

      v_created_items := v_created_items + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'homeId', v_home_id,
    'createdLocations', v_created_locations,
    'createdItems', v_created_items
  );
end;
$$;

grant execute on function public.import_local_inventory(jsonb, jsonb) to authenticated;
