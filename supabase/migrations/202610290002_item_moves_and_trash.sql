-- 물건 이동·휴지통·공간 삭제를 한 트랜잭션으로 처리한다.
-- 공간만 삭제되고 물건은 남는 중간 상태가 생기지 않게 한다.

create or replace function public.delete_location_with_items(
  target_location_id uuid,
  item_action text,
  destination_location_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_location public.locations%rowtype;
begin
  if item_action not in ('move', 'trash') then
    raise exception '물건 처리 방법이 올바르지 않습니다.';
  end if;

  select *
  into target_location
  from public.locations
  where id = target_location_id
    and deleted_at is null;

  if not found then
    raise exception '삭제할 공간을 찾을 수 없습니다.';
  end if;

  if not public.is_home_member(target_location.home_id) then
    raise exception '이 공간을 삭제할 권한이 없습니다.';
  end if;

  if exists (
    select 1
    from public.locations child
    where child.parent_id = target_location.id
      and child.deleted_at is null
  ) then
    raise exception '안에 다른 공간이 있어 먼저 삭제할 수 없습니다.';
  end if;

  if item_action = 'move' then
    if destination_location_id is null or destination_location_id = target_location.id then
      raise exception '물건을 옮길 다른 공간을 선택해 주세요.';
    end if;

    if not exists (
      select 1
      from public.locations destination
      where destination.id = destination_location_id
        and destination.home_id = target_location.home_id
        and destination.deleted_at is null
    ) then
      raise exception '물건을 옮길 공간을 찾을 수 없습니다.';
    end if;

    update public.items
    set location_id = destination_location_id,
        updated_at = now()
    where home_id = target_location.home_id
      and location_id = target_location.id
      and deleted_at is null;
  else
    update public.items
    set deleted_at = now(),
        updated_at = now()
    where home_id = target_location.home_id
      and location_id = target_location.id
      and deleted_at is null;
  end if;

  update public.locations
  set deleted_at = now()
  where id = target_location.id;
end;
$$;

create or replace function public.restore_item_from_trash(
  target_item_id uuid,
  destination_location_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_item public.items%rowtype;
  restore_location_id uuid;
begin
  select *
  into target_item
  from public.items
  where id = target_item_id
    and deleted_at is not null;

  if not found then
    raise exception '휴지통에서 복원할 물건을 찾을 수 없습니다.';
  end if;

  if not public.is_home_member(target_item.home_id) then
    raise exception '이 물건을 복원할 권한이 없습니다.';
  end if;

  if exists (
    select 1
    from public.locations original_location
    where original_location.id = target_item.location_id
      and original_location.home_id = target_item.home_id
      and original_location.deleted_at is null
  ) then
    restore_location_id := target_item.location_id;
  else
    restore_location_id := destination_location_id;
  end if;

  if restore_location_id is null or not exists (
    select 1
    from public.locations destination
    where destination.id = restore_location_id
      and destination.home_id = target_item.home_id
      and destination.deleted_at is null
  ) then
    raise exception '복원할 보관 공간을 선택해 주세요.';
  end if;

  update public.items
  set location_id = restore_location_id,
      deleted_at = null,
      updated_at = now()
  where id = target_item.id;
end;
$$;

grant execute on function public.delete_location_with_items(uuid, text, uuid) to authenticated;
grant execute on function public.restore_item_from_trash(uuid, uuid) to authenticated;
