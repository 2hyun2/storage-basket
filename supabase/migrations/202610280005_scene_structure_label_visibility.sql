-- 벽·창문도 공간과 동일하게 이름표 표시 여부를 개별 저장한다.

alter table public.scene_structures
  add column if not exists is_label_visible boolean not null default true;
