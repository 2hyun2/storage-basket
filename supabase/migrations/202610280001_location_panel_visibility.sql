-- Each space can choose whether its name panel is shown in its parent's 3D scene.
alter table public.locations
  add column if not exists is_panel_visible boolean not null default true;
