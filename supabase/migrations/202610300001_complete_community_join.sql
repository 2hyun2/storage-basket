-- 초대 링크와 기존 회원의 공동체 참여를 안전하게 완성한다.

create or replace function public.join_home_with_invite(invite_code_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_home_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인 후 공동체에 참여할 수 있습니다.';
  end if;

  select homes.id
  into target_home_id
  from public.homes homes
  where homes.invite_code = upper(trim(invite_code_input));

  if target_home_id is null then
    raise exception '유효하지 않거나 만료된 초대 코드입니다.';
  end if;

  insert into public.home_members (home_id, user_id, role)
  values (target_home_id, auth.uid(), 'member')
  on conflict (home_id, user_id) do nothing;

  update public.profiles
  set active_home_id = target_home_id
  where id = auth.uid();

  return target_home_id;
end;
$$;

-- 초대 코드를 확인한 뒤 코드가 바뀌는 드문 경우에도
-- 개인 공동체가 잘못 생성되지 않도록 가입 트리거에서 다시 확인한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_home_id uuid;
  new_display_name text;
  requested_invite_code text;
begin
  new_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  );
  new_display_name := left(new_display_name, 30);
  requested_invite_code := upper(nullif(trim(new.raw_user_meta_data ->> 'invite_code'), ''));

  insert into public.profiles (id, display_name)
  values (new.id, new_display_name);

  if requested_invite_code is not null then
    select id
    into new_home_id
    from public.homes
    where invite_code = requested_invite_code;

    if new_home_id is null then
      raise exception '유효하지 않거나 만료된 초대 코드입니다.';
    end if;
  end if;

  if new_home_id is null then
    insert into public.homes (name)
    values (left(new_display_name, 52) || '의 수납바구니')
    returning id into new_home_id;

    insert into public.home_members (home_id, user_id, role)
    values (new_home_id, new.id, 'owner');
  else
    insert into public.home_members (home_id, user_id, role)
    values (new_home_id, new.id, 'member')
    on conflict (home_id, user_id) do nothing;
  end if;

  update public.profiles
  set active_home_id = new_home_id
  where id = new.id;

  return new;
end;
$$;

grant execute on function public.join_home_with_invite(text) to authenticated;
