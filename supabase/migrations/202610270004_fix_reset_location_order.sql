create or replace function public.archive_and_reset_current_home()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_home_id uuid;
  v_deleted_count integer;
begin
  select home_id into v_home_id from public.home_members where user_id = auth.uid() order by joined_at limit 1;
  if v_home_id is null then raise exception 'Home membership is required.'; end if;

  insert into public.home_data_archives (home_id, created_by, label, snapshot)
  values (v_home_id, auth.uid(), '공간 설계 초기 더미 백업', jsonb_build_object(
    'locations', coalesce((select jsonb_agg(to_jsonb(location)) from public.locations location where location.home_id = v_home_id), '[]'::jsonb),
    'items', coalesce((select jsonb_agg(to_jsonb(item)) from public.items item where item.home_id = v_home_id), '[]'::jsonb)
  ));

  delete from public.items where home_id = v_home_id;
  delete from public.scene_structures structure using public.space_layouts layout where structure.layout_id = layout.id and layout.home_id = v_home_id;
  delete from public.space_layouts where home_id = v_home_id;

  loop
    delete from public.locations location
    where location.home_id = v_home_id
      and not exists (select 1 from public.locations child where child.parent_id = location.id);
    get diagnostics v_deleted_count = row_count;
    exit when v_deleted_count = 0;
  end loop;

  return jsonb_build_object('homeId', v_home_id, 'message', 'Archived and reset.');
end;
$$;
