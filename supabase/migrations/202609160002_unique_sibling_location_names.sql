-- 기존 중복 위치는 연결을 보존한 채 두 번째 항목부터 번호를 붙인다.
do $$
declare
  duplicate_location record;
  suffix_number integer;
  candidate_name text;
begin
  for duplicate_location in
    select id, parent_id, name
    from (
      select id, parent_id, name,
        row_number() over (
          partition by parent_id, lower(btrim(name))
          order by created_at, id
        ) as duplicate_order
      from public.locations
    ) ranked
    where duplicate_order > 1
    order by parent_id nulls first, lower(btrim(name)), duplicate_order
  loop
    suffix_number := 2;
    loop
      candidate_name := left(btrim(duplicate_location.name), 100 - char_length(' (' || suffix_number || ')'))
        || ' (' || suffix_number || ')';
      exit when not exists (
        select 1
        from public.locations existing
        where existing.id <> duplicate_location.id
          and existing.parent_id is not distinct from duplicate_location.parent_id
          and lower(btrim(existing.name)) = lower(candidate_name)
      );
      suffix_number := suffix_number + 1;
    end loop;

    update public.locations
    set name = candidate_name,
        updated_at = now()
    where id = duplicate_location.id;
  end loop;
end
$$;

-- PostgreSQL이 동시 요청 사이에서도 같은 형제 이름을 원자적으로 차단한다.
create unique index locations_sibling_name_unique
  on public.locations (parent_id, lower(btrim(name)))
  nulls not distinct;
