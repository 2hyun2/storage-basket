create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  parent_id uuid references public.locations(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by text not null default 'local-user',
  updated_at timestamptz not null default now(),
  updated_by text not null default 'local-user'
);

create index locations_parent_id_index on public.locations(parent_id);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  location_id uuid not null references public.locations(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit text not null check (char_length(unit) between 1 and 20),
  category text not null default '' check (char_length(category) <= 30),
  tags jsonb not null default '[]'::jsonb,
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  created_by text not null default 'local-user',
  updated_at timestamptz not null default now(),
  updated_by text not null default 'local-user'
);

create index items_location_id_index on public.items(location_id);
