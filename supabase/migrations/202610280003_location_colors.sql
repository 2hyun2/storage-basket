-- 공간별 표시 색상은 HEX 형식으로 저장한다.

alter table public.locations
  add column if not exists color_hex text;

with assigned_colors as (
  select
    id,
    (array['#8B5CF6', '#0EA5E9', '#EC4899', '#F59E0B', '#14B8A6', '#6366F1'])[
      1 + mod(row_number() over (partition by home_id order by created_at, id)::integer - 1, 6)
    ] as color_hex
  from public.locations
)
update public.locations locations
set color_hex = assigned_colors.color_hex
from assigned_colors
where locations.id = assigned_colors.id
  and locations.color_hex is null;

alter table public.locations
  alter column color_hex set default '#8B5CF6',
  alter column color_hex set not null;

alter table public.locations
  add constraint locations_color_hex_check
  check (color_hex ~ '^#[0-9A-Fa-f]{6}$');
