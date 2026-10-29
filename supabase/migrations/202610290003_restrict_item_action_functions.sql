-- 휴지통 처리 함수는 로그인한 사용자만 실행할 수 있게 제한한다.
-- 함수 내부에서도 Home 구성원을 검사하지만, 실행 권한도 최소화한다.

revoke execute on function public.delete_location_with_items(uuid, text, uuid) from public;
revoke execute on function public.restore_item_from_trash(uuid, uuid) from public;

grant execute on function public.delete_location_with_items(uuid, text, uuid) to authenticated;
grant execute on function public.restore_item_from_trash(uuid, uuid) to authenticated;
