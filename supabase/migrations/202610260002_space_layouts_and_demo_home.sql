-- Space geometry is stored separately from the logical location tree.
-- Every dimension and coordinate is an integer measured in centimetres.

create table public.space_layouts (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  scene_location_id uuid references public.locations(id) on delete cascade,
  layout_key text not null,
  view_kind text not null default 'plan' check (view_kind in ('plan', 'interior')),
  width_cm integer not null check (width_cm > 0),
  height_cm integer not null check (height_cm > 0),
  depth_cm integer not null check (depth_cm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (home_id, layout_key)
);

create table public.space_placements (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.space_layouts(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  x_cm integer not null check (x_cm >= 0),
  y_cm integer not null default 0 check (y_cm >= 0),
  z_cm integer not null check (z_cm >= 0),
  width_cm integer not null check (width_cm > 0),
  height_cm integer not null check (height_cm > 0),
  depth_cm integer not null check (depth_cm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (layout_id, location_id)
);

create index space_layouts_home_id_idx on public.space_layouts(home_id);
create index space_placements_layout_id_idx on public.space_placements(layout_id);
create index space_placements_location_id_idx on public.space_placements(location_id);

create trigger space_layouts_set_updated_at
before update on public.space_layouts
for each row execute procedure public.set_updated_at();

create trigger space_placements_set_updated_at
before update on public.space_placements
for each row execute procedure public.set_updated_at();

alter table public.space_layouts enable row level security;
alter table public.space_placements enable row level security;

create policy "members select space layouts"
on public.space_layouts for select
using (public.is_home_member(home_id));

create policy "members write space layouts"
on public.space_layouts for all
using (public.is_home_member(home_id))
with check (public.is_home_member(home_id));

create policy "members select space placements"
on public.space_placements for select
using (
  exists (
    select 1
    from public.space_layouts layouts
    where layouts.id = layout_id
      and public.is_home_member(layouts.home_id)
  )
);

create policy "members write space placements"
on public.space_placements for all
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

create or replace function public.seed_demo_home_layout()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home_id uuid;
  v_layout_id uuid;
  v_entrance_id uuid;
  v_bathroom_id uuid;
  v_shoe_cabinet_id uuid;
  v_bathroom_cabinet_id uuid;
  v_towel_cabinet_id uuid;
begin
  select home_id
  into v_home_id
  from public.home_members
  where user_id = auth.uid()
  order by joined_at
  limit 1;

  if v_home_id is null then
    raise exception 'Home membership is required.';
  end if;

  insert into public.locations (home_id, parent_id, name)
  select v_home_id, null, '현관'
  where not exists (
    select 1 from public.locations
    where home_id = v_home_id and parent_id is null and lower(name) = lower('현관')
  );

  insert into public.locations (home_id, parent_id, name)
  select v_home_id, null, '욕실'
  where not exists (
    select 1 from public.locations
    where home_id = v_home_id and parent_id is null and lower(name) = lower('욕실')
  );

  select id into v_entrance_id
  from public.locations
  where home_id = v_home_id and parent_id is null and name = '현관'
  limit 1;

  select id into v_bathroom_id
  from public.locations
  where home_id = v_home_id and parent_id is null and name = '욕실'
  limit 1;

  insert into public.locations (home_id, parent_id, name)
  select v_home_id, v_entrance_id, '신발장'
  where not exists (
    select 1 from public.locations
    where home_id = v_home_id and parent_id = v_entrance_id and lower(name) = lower('신발장')
  );

  insert into public.locations (home_id, parent_id, name)
  select v_home_id, v_bathroom_id, '세면대 하부장'
  where not exists (
    select 1 from public.locations
    where home_id = v_home_id and parent_id = v_bathroom_id and lower(name) = lower('세면대 하부장')
  );

  insert into public.locations (home_id, parent_id, name)
  select v_home_id, v_bathroom_id, '수건장'
  where not exists (
    select 1 from public.locations
    where home_id = v_home_id and parent_id = v_bathroom_id and lower(name) = lower('수건장')
  );

  select id into v_shoe_cabinet_id
  from public.locations
  where home_id = v_home_id and parent_id = v_entrance_id and name = '신발장'
  limit 1;

  select id into v_bathroom_cabinet_id
  from public.locations
  where home_id = v_home_id and parent_id = v_bathroom_id and name = '세면대 하부장'
  limit 1;

  select id into v_towel_cabinet_id
  from public.locations
  where home_id = v_home_id and parent_id = v_bathroom_id and name = '수건장'
  limit 1;

  insert into public.items (home_id, location_id, title, quantity, unit)
  select v_home_id, v_entrance_id, '접이식 우산', 2, '개'
  where not exists (
    select 1 from public.items
    where home_id = v_home_id and location_id = v_entrance_id and title = '접이식 우산'
  );

  insert into public.items (home_id, location_id, title, quantity, unit)
  select v_home_id, v_shoe_cabinet_id, '외출용 슬리퍼', 3, '켤레'
  where not exists (
    select 1 from public.items
    where home_id = v_home_id and location_id = v_shoe_cabinet_id and title = '외출용 슬리퍼'
  );

  insert into public.items (home_id, location_id, title, quantity, unit)
  select v_home_id, v_bathroom_cabinet_id, '여분 칫솔', 4, '개'
  where not exists (
    select 1 from public.items
    where home_id = v_home_id and location_id = v_bathroom_cabinet_id and title = '여분 칫솔'
  );

  insert into public.items (home_id, location_id, title, quantity, unit)
  select v_home_id, v_towel_cabinet_id, '수건', 6, '장'
  where not exists (
    select 1 from public.items
    where home_id = v_home_id and location_id = v_towel_cabinet_id and title = '수건'
  );

  insert into public.space_layouts (
    home_id, scene_location_id, layout_key, view_kind, width_cm, height_cm, depth_cm
  )
  values (v_home_id, null, 'home', 'plan', 900, 260, 600)
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
    location.id,
    case location.name
      when '거실' then 0
      when '부엌' then 450
      when '안방' then 450
      when '욕실' then 730
      when '현관' then 730
    end,
    0,
    case location.name
      when '거실' then 0
      when '부엌' then 0
      when '안방' then 300
      when '욕실' then 0
      when '현관' then 170
    end,
    case location.name
      when '거실' then 450
      when '부엌' then 280
      when '안방' then 450
      when '욕실' then 170
      when '현관' then 170
    end,
    240,
    case location.name
      when '거실' then 600
      when '부엌' then 300
      when '안방' then 300
      when '욕실' then 170
      when '현관' then 130
    end
  from public.locations location
  where location.home_id = v_home_id
    and location.parent_id is null
    and location.name in ('거실', '부엌', '안방', '욕실', '현관')
  on conflict (layout_id, location_id) do update
  set x_cm = excluded.x_cm,
      y_cm = excluded.y_cm,
      z_cm = excluded.z_cm,
      width_cm = excluded.width_cm,
      height_cm = excluded.height_cm,
      depth_cm = excluded.depth_cm;

  return jsonb_build_object(
    'homeId', v_home_id,
    'layoutId', v_layout_id,
    'message', 'Demo home layout and inventory are ready.'
  );
end;
$$;

grant execute on function public.seed_demo_home_layout() to authenticated;
