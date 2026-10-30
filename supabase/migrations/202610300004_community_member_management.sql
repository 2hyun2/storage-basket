begin;

-- 멤버 제외는 소속만 제거한다. 사용자 계정·공간·물건·기존 활동 기록은 유지한다.
-- 강퇴 이력은 별도 생성하지 않는다.
create or replace function public.remove_home_member(target_home_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
  next_home_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인 후 이용해 주세요.';
  end if;

  perform 1 from public.homes where id = target_home_id for update;
  if not exists (
    select 1 from public.home_members
    where home_id = target_home_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception '대표만 구성원을 제외할 수 있습니다.';
  end if;
  if target_user_id = auth.uid() then
    raise exception '자기 자신은 제외할 수 없습니다.';
  end if;

  select role into target_role from public.home_members
  where home_id = target_home_id and user_id = target_user_id for update;
  if target_role is null then
    raise exception '이미 제외되었거나 참여 중인 구성원이 아닙니다.';
  end if;
  if target_role = 'owner' then
    raise exception '공동체 대표는 제외할 수 없습니다.';
  end if;

  delete from public.home_members
  where home_id = target_home_id and user_id = target_user_id and role = 'member';

  select home_id into next_home_id from public.home_members
  where user_id = target_user_id
  order by case role when 'owner' then 0 else 1 end, joined_at, home_id
  limit 1;

  update public.profiles set active_home_id = next_home_id
  where id = target_user_id and active_home_id = target_home_id;
end;
$$;

-- 초대 코드는 공동체의 단일 값이다. 재발급해도 기존 멤버 소속은 변경하지 않는다.
create or replace function public.regenerate_home_invite(target_home_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_code text;
  previous_code text;
begin
  select invite_code into previous_code from public.homes
  where id = target_home_id for update;
  if auth.uid() is null or not exists (
    select 1 from public.home_members
    where home_id = target_home_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception '대표만 초대 코드를 바꿀 수 있습니다.';
  end if;
  loop
    next_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    if next_code = previous_code then continue; end if;
    begin
      update public.homes set invite_code = next_code where id = target_home_id;
      return next_code;
    exception when unique_violation then
      -- 다른 공동체 코드와 충돌하면 재시도한다.
    end;
  end loop;
end;
$$;

revoke all on function public.remove_home_member(uuid, uuid) from public, anon;
grant execute on function public.remove_home_member(uuid, uuid) to authenticated;
revoke all on function public.regenerate_home_invite(uuid) from public, anon;
grant execute on function public.regenerate_home_invite(uuid) to authenticated;

commit;
