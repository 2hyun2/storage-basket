-- Structures decorate a scene but never participate in the location tree.
-- Values are always integral centimetres in the scene-local coordinate system.

create table public.scene_structures (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.space_layouts(id) on delete cascade,
  kind text not null check (kind in ('wall', 'door', 'window')),
  name text not null,
  x_cm integer not null check (x_cm >= 0),
  y_cm integer not null check (y_cm >= 0),
  z_cm integer not null check (z_cm >= 0),
  width_cm integer not null check (width_cm > 0),
  height_cm integer not null check (height_cm > 0),
  depth_cm integer not null check (depth_cm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (layout_id, kind, name)
);

create index scene_structures_layout_id_idx on public.scene_structures(layout_id);

create trigger scene_structures_set_updated_at
before update on public.scene_structures
for each row execute procedure public.set_updated_at();

alter table public.scene_structures enable row level security;

create policy "members select scene structures"
on public.scene_structures for select
using (
  exists (
    select 1
    from public.space_layouts layouts
    where layouts.id = layout_id
      and public.is_home_member(layouts.home_id)
  )
);

create policy "members write scene structures"
on public.scene_structures for all
using (
  exists (
    select 1
    from public.space_layouts layouts
    where layouts.id = layout_id
      and public.is_home_member(layouts.home_id)
  )
)
with check (
  exists (
    select 1
    from public.space_layouts layouts
    where layouts.id = layout_id
      and public.is_home_member(layouts.home_id)
  )
);

create or replace function public.seed_demo_spatial_scenes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home_id uuid;
  v_scene record;
  v_layout_id uuid;
begin
  select home_id into v_home_id
  from public.home_members
  where user_id = auth.uid()
  order by joined_at
  limit 1;

  if v_home_id is null then
    raise exception 'Home membership is required.';
  end if;

  for v_scene in
    select location.id, location.name
    from public.locations location
    where location.home_id = v_home_id
      and location.name in ('거실', '부엌', '안방', '옷장', 'TV장')
      and location.deleted_at is null
  loop
    insert into public.space_layouts (
      home_id, scene_location_id, layout_key, view_kind, width_cm, height_cm, depth_cm
    )
    values (
      v_home_id,
      v_scene.id,
      'location:' || v_scene.id::text,
      'interior',
      case v_scene.name
        when '거실' then 450 when '부엌' then 280 when '안방' then 450
        when '옷장' then 220 when 'TV장' then 240 else 240
      end,
      case v_scene.name when '옷장' then 220 when 'TV장' then 90 else 240 end,
      case v_scene.name
        when '거실' then 600 when '부엌' then 300 when '안방' then 300
        when '옷장' then 70 when 'TV장' then 55 else 160
      end
    )
    on conflict (home_id, layout_key) do update
    set width_cm = excluded.width_cm,
        height_cm = excluded.height_cm,
        depth_cm = excluded.depth_cm
    returning id into v_layout_id;

    insert into public.space_placements (
      layout_id, location_id, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm
    )
    select
      v_layout_id,
      child.id,
      case
        when v_scene.name = '안방' and child.name = '옷장' then 20
        when v_scene.name = '안방' and child.name = '침대 옆 서랍' then 310
        when v_scene.name = '거실' and child.name = 'TV장' then 25
        when v_scene.name = '거실' and child.name = '소파 옆 수납장' then 320
        when v_scene.name = '부엌' and child.name = '상부장' then 20
        when v_scene.name = '부엌' and child.name = '하부장' then 25
        when v_scene.name = '옷장' and child.name = '계절 옷 칸' then 15
        when v_scene.name = 'TV장' and child.name = '오른쪽 서랍' then 125
        when v_scene.name = 'TV장' and child.name = '왼쪽 서랍' then 15
        else 15
      end,
      case when v_scene.name in ('옷장', 'TV장') then 10 else 0 end,
      case
        when v_scene.name = '안방' and child.name = '침대 옆 서랍' then 180
        when v_scene.name = '거실' and child.name = '소파 옆 수납장' then 350
        when v_scene.name = '부엌' and child.name = '상부장' then 20
        when v_scene.name = '부엌' and child.name = '하부장' then 180
        else 20
      end,
      case when v_scene.name = '안방' and child.name = '침대 옆 서랍' then 100 else 180 end,
      case when v_scene.name in ('옷장', 'TV장') then 180 else 100 end,
      case when v_scene.name = '안방' and child.name = '침대 옆 서랍' then 90 else 80 end
    from public.locations child
    where child.parent_id = v_scene.id
      and child.deleted_at is null
    on conflict (layout_id, location_id) do update
    set x_cm = excluded.x_cm,
        y_cm = excluded.y_cm,
        z_cm = excluded.z_cm,
        width_cm = excluded.width_cm,
        height_cm = excluded.height_cm,
        depth_cm = excluded.depth_cm;

    insert into public.scene_structures (
      layout_id, kind, name, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm
    )
    select v_layout_id, sample.kind, sample.name, sample.x_cm, sample.y_cm, sample.z_cm,
      sample.width_cm, sample.height_cm, sample.depth_cm
    from (
      values
        ('wall', '북쪽 벽', 0, 0, 0, 450, 240, 10),
        ('wall', '서쪽 벽', 0, 0, 0, 10, 240, 300),
        ('wall', '동쪽 벽', 440, 0, 0, 10, 240, 300),
        ('door', '안방 문', 175, 0, 0, 90, 210, 12),
        ('window', '안방 창문', 440, 90, 95, 10, 110, 110)
    ) as sample(kind, name, x_cm, y_cm, z_cm, width_cm, height_cm, depth_cm)
    where v_scene.name = '안방'
    on conflict (layout_id, kind, name) do update
    set x_cm = excluded.x_cm,
        y_cm = excluded.y_cm,
        z_cm = excluded.z_cm,
        width_cm = excluded.width_cm,
        height_cm = excluded.height_cm,
        depth_cm = excluded.depth_cm;
  end loop;

  return jsonb_build_object('homeId', v_home_id, 'message', 'Spatial demo scenes are ready.');
end;
$$;

grant execute on function public.seed_demo_spatial_scenes() to authenticated;
