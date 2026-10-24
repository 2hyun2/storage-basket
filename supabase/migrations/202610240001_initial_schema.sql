-- 새 Supabase 프로젝트의 SQL Editor에서 한 번 실행한다.
-- Auth 사용자, Home, 위치, 물건, 활동 기록의 최초 스키마다.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.home_members (
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (home_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  parent_id uuid references public.locations(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  quantity numeric not null default 1 check (quantity >= 0),
  unit text,
  category text,
  tags jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  entity_type text not null check (entity_type in ('location', 'item', 'home_member')),
  entity_id uuid,
  action text not null check (action in ('created', 'updated', 'moved', 'deleted', 'restored')),
  actor_id uuid references auth.users(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  operation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create unique index locations_unique_sibling_name
  on public.locations (home_id, parent_id, lower(btrim(name))) nulls not distinct
  where deleted_at is null;
create index locations_home_id_idx on public.locations(home_id);
create index items_home_id_idx on public.items(home_id);
create index items_location_id_idx on public.items(location_id);
create index home_members_user_id_idx on public.home_members(user_id);
create index activity_events_home_created_idx on public.activity_events(home_id, created_at desc);
create index activity_events_entity_idx on public.activity_events(entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger homes_set_updated_at before update on public.homes for each row execute procedure public.set_updated_at();
create trigger locations_set_updated_at before update on public.locations for each row execute procedure public.set_updated_at();
create trigger items_set_updated_at before update on public.items for each row execute procedure public.set_updated_at();

create or replace function public.is_home_member(target_home_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.home_members where home_id = target_home_id and user_id = auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_home_id uuid;
  new_display_name text;
begin
  new_display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1));
  new_display_name := left(new_display_name, 30);
  insert into public.profiles (id, display_name) values (new.id, new_display_name);
  insert into public.homes (name) values (left(new_display_name, 52) || '의 수납바구니') returning id into new_home_id;
  insert into public.home_members (home_id, user_id, role) values (new_home_id, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.homes enable row level security;
alter table public.home_members enable row level security;
alter table public.locations enable row level security;
alter table public.items enable row level security;
alter table public.activity_events enable row level security;

create policy "profiles select self" on public.profiles for select using (id = auth.uid());
create policy "profiles update self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "members select homes" on public.homes for select using (public.is_home_member(id));
create policy "members select home members" on public.home_members for select using (public.is_home_member(home_id));
create policy "members select locations" on public.locations for select using (public.is_home_member(home_id));
create policy "members write locations" on public.locations for all using (public.is_home_member(home_id)) with check (public.is_home_member(home_id));
create policy "members select items" on public.items for select using (public.is_home_member(home_id));
create policy "members write items" on public.items for all using (public.is_home_member(home_id)) with check (public.is_home_member(home_id));
create policy "members select activity" on public.activity_events for select using (public.is_home_member(home_id));
