create table public.home_data_archives (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  label text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.home_data_archives enable row level security;

create policy "members select home archives"
on public.home_data_archives for select
using (public.is_home_member(home_id));

create or replace function public.archive_and_reset_current_home()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home_id uuid;
begin
  select home_id into v_home_id
  from public.home_members
  where user_id = auth.uid()
  order by joined_at
  limit 1;

  if v_home_id is null then raise exception 'Home membership is required.'; end if;

  insert into public.home_data_archives (home_id, created_by, label, snapshot)
  values (
    v_home_id,
    auth.uid(),
    '공간 설계 초기 더미 백업',
    jsonb_build_object(
      'locations', coalesce((select jsonb_agg(to_jsonb(location)) from public.locations location where location.home_id = v_home_id), '[]'::jsonb),
      'items', coalesce((select jsonb_agg(to_jsonb(item)) from public.items item where item.home_id = v_home_id), '[]'::jsonb),
      'layouts', coalesce((select jsonb_agg(to_jsonb(layout)) from public.space_layouts layout where layout.home_id = v_home_id), '[]'::jsonb),
      'placements', coalesce((select jsonb_agg(to_jsonb(placement)) from public.space_placements placement join public.space_layouts layout on layout.id = placement.layout_id where layout.home_id = v_home_id), '[]'::jsonb),
      'structures', coalesce((select jsonb_agg(to_jsonb(structure)) from public.scene_structures structure join public.space_layouts layout on layout.id = structure.layout_id where layout.home_id = v_home_id), '[]'::jsonb)
    )
  );

  delete from public.items where home_id = v_home_id;
  delete from public.scene_structures structure
  using public.space_layouts layout
  where structure.layout_id = layout.id
    and layout.home_id = v_home_id
    and structure.kind in ('door', 'window');
  delete from public.scene_structures structure
  using public.space_layouts layout
  where structure.layout_id = layout.id and layout.home_id = v_home_id;
  delete from public.space_layouts where home_id = v_home_id;
  update public.locations set parent_id = null where home_id = v_home_id;
  delete from public.locations where home_id = v_home_id;

  return jsonb_build_object('homeId', v_home_id, 'message', 'Archived and reset.');
end;
$$;

grant execute on function public.archive_and_reset_current_home() to authenticated;
