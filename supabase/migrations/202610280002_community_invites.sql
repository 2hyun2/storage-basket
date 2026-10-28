-- 공동체(Home) 선택과 초대 코드 기반 참여를 위한 1차 스키마.

alter table public.profiles
  add column if not exists active_home_id uuid references public.homes(id) on delete set null;

alter table public.homes
  add column if not exists invite_code text;

update public.homes
set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;

alter table public.homes
  alter column invite_code set not null,
  alter column invite_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

create unique index if not exists homes_invite_code_unique
  on public.homes (invite_code);

with first_memberships as (
  select distinct on (user_id)
    user_id,
    home_id
  from public.home_members
  order by user_id, case role when 'owner' then 0 else 1 end, joined_at
)
update public.profiles profile
set active_home_id = membership.home_id
from first_memberships membership
where membership.user_id = profile.id
  and profile.active_home_id is null;

create or replace function public.preview_home_invite(invite_code_input text)
returns table (
  home_id uuid,
  home_name text,
  owner_name text
)
language sql
security definer
set search_path = public
as $$
  select
    homes.id,
    homes.name,
    profiles.display_name
  from public.homes homes
  join public.home_members members
    on members.home_id = homes.id and members.role = 'owner'
  join public.profiles profiles on profiles.id = members.user_id
  where homes.invite_code = upper(trim(invite_code_input))
  limit 1;
$$;

create or replace function public.regenerate_home_invite(target_home_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_code text;
begin
  if not exists (
    select 1 from public.home_members
    where home_id = target_home_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception '대표만 초대 코드를 바꿀 수 있습니다.';
  end if;

  loop
    next_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      update public.homes set invite_code = next_code where id = target_home_id;
      return next_code;
    exception when unique_violation then
      -- 충돌하면 새 코드를 다시 만든다.
    end;
  end loop;
end;
$$;

create or replace function public.set_active_home(target_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_home_member(target_home_id) then
    raise exception '참여 중인 공동체만 선택할 수 있습니다.';
  end if;

  update public.profiles set active_home_id = target_home_id where id = auth.uid();
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_home_id uuid;
  new_display_name text;
  requested_invite_code text;
begin
  new_display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1));
  new_display_name := left(new_display_name, 30);
  requested_invite_code := upper(nullif(trim(new.raw_user_meta_data ->> 'invite_code'), ''));

  insert into public.profiles (id, display_name) values (new.id, new_display_name);

  if requested_invite_code is not null then
    select id into new_home_id from public.homes where invite_code = requested_invite_code;
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

  update public.profiles set active_home_id = new_home_id where id = new.id;
  return new;
end;
$$;

drop policy if exists "profiles select self" on public.profiles;
create policy "members select shared profiles"
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.home_members mine
    join public.home_members theirs on theirs.home_id = mine.home_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);

create policy "owners update homes"
on public.homes for update
using (
  exists (
    select 1 from public.home_members
    where home_id = homes.id and user_id = auth.uid() and role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.home_members
    where home_id = homes.id and user_id = auth.uid() and role = 'owner'
  )
);

grant execute on function public.preview_home_invite(text) to anon, authenticated;
grant execute on function public.regenerate_home_invite(uuid) to authenticated;
grant execute on function public.set_active_home(uuid) to authenticated;
