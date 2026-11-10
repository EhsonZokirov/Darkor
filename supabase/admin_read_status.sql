-- Статус «прочитано» для заявок и сообщений + значок уведомлений в меню админа.
-- Безопасно запускать повторно.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ad_requests' and column_name = 'is_read'
  ) then
    alter table public.ad_requests add column is_read boolean not null default false;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'is_read'
  ) then
    alter table public.messages add column is_read boolean not null default false;
  end if;
end $$;

-- Админ может отмечать прочитанным / возвращать в новые.
drop policy if exists "ad_requests: admin updates" on public.ad_requests;
create policy "ad_requests: admin updates" on public.ad_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "messages: admin updates" on public.messages;
create policy "messages: admin updates" on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Посетитель не может отправить заявку сразу «прочитанной» (иначе мимо значка).
drop policy if exists "ad_requests: anyone can send" on public.ad_requests;
create policy "ad_requests: anyone can send" on public.ad_requests
  for insert to anon, authenticated with check (not is_read);

drop policy if exists "messages: anyone can send" on public.messages;
create policy "messages: anyone can send" on public.messages
  for insert to anon, authenticated with check (not is_read);
