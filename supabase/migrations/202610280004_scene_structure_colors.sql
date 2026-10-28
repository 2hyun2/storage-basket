-- 벽·창문도 공간과 같은 HEX 색상 규칙을 사용한다.

alter table public.scene_structures
  add column if not exists color_hex text;

update public.scene_structures
set color_hex = case kind
  when 'window' then '#38BDF8'
  else '#C4B5FD'
end
where color_hex is null;

alter table public.scene_structures
  alter column color_hex set default '#C4B5FD',
  alter column color_hex set not null;

alter table public.scene_structures
  add constraint scene_structures_color_hex_check
  check (color_hex ~ '^#[0-9A-Fa-f]{6}$');
