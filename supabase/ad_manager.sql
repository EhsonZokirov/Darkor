-- =========================================================
--  Рекламный менеджер: баннеры из админки + статистика показов и кликов
--  Как применить: Supabase → SQL Editor → вставить весь файл → Run (один раз).
--  Существующие таблицы и данные не затрагиваются. Файл можно запускать повторно.
-- =========================================================

create table if not exists public.ad_banners (
  id          bigint generated always as identity primary key,
  advertiser  text not null check (char_length(advertiser) between 2 and 80),
  headline    text not null check (char_length(headline) between 2 and 120),
  body        text not null default '' check (char_length(body) <= 300),
  features    text[] not null default '{}',
  image_url   text not null default '' check (char_length(image_url) <= 500),
  logo_url    text not null default '' check (char_length(logo_url) <= 500),
  link_url    text not null default '' check (link_url = '' or link_url ~* '^https?://'),
  button_text text not null default '' check (char_length(button_text) <= 60),
  placement   text not null default 'all' check (placement in ('home', 'inner', 'all')),
  starts_on   date,
  ends_on     date,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  check (starts_on is null or ends_on is null or starts_on <= ends_on)
);

-- Показы и клики по дням (день — по времени Душанбе).
create table if not exists public.ad_stats (
  banner_id bigint not null references public.ad_banners (id) on delete cascade,
  day       date not null,
  views     integer not null default 0,
  clicks    integer not null default 0,
  primary key (banner_id, day)
);

alter table public.ad_banners enable row level security;
alter table public.ad_stats enable row level security;

-- Посетители видят только включённые баннеры внутри срока; админ — все.
drop policy if exists "ads: read live" on public.ad_banners;
create policy "ads: read live" on public.ad_banners
  for select using (
    public.is_admin()
    or (
      active
      and (starts_on is null or starts_on <= (now() at time zone 'Asia/Dushanbe')::date)
      and (ends_on is null or ends_on >= (now() at time zone 'Asia/Dushanbe')::date)
    )
  );

drop policy if exists "ads: admin insert" on public.ad_banners;
create policy "ads: admin insert" on public.ad_banners
  for insert with check (public.is_admin());

drop policy if exists "ads: admin update" on public.ad_banners;
create policy "ads: admin update" on public.ad_banners
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ads: admin delete" on public.ad_banners;
create policy "ads: admin delete" on public.ad_banners
  for delete using (public.is_admin());

-- Статистику читает только админ. Писать напрямую нельзя — только через track_ad.
drop policy if exists "ad_stats: admin read" on public.ad_stats;
create policy "ad_stats: admin read" on public.ad_stats
  for select using (public.is_admin());

revoke all on public.ad_stats from anon, authenticated;
grant select on public.ad_stats to authenticated;
revoke all on public.ad_banners from anon, authenticated;
grant select on public.ad_banners to anon, authenticated;
grant insert, update, delete on public.ad_banners to authenticated;

-- Учёт показа или клика. Считает только действующие баннеры; остальное молча игнорирует.
create or replace function public.track_ad(p_banner bigint, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Dushanbe')::date;
begin
  if p_kind not in ('view', 'click') then
    return;
  end if;

  if not exists (
    select 1 from public.ad_banners b
     where b.id = p_banner and b.active
       and (b.starts_on is null or b.starts_on <= today)
       and (b.ends_on is null or b.ends_on >= today)
  ) then
    return;
  end if;

  insert into public.ad_stats (banner_id, day, views, clicks)
  values (p_banner, today, (p_kind = 'view')::int, (p_kind = 'click')::int)
  on conflict (banner_id, day) do update
    set views = public.ad_stats.views + (p_kind = 'view')::int,
        clicks = public.ad_stats.clicks + (p_kind = 'click')::int;
end;
$$;

revoke all on function public.track_ad(bigint, text) from public;
grant execute on function public.track_ad(bigint, text) to anon, authenticated;

-- Первый рекламодатель — RC Cola (только если баннеров ещё нет).
insert into public.ad_banners (advertiser, headline, body, features, image_url, logo_url, button_text, placement)
select 'RC Cola', 'Освежись по-настоящему',
       'Любимый вкус колы — со льдом, в компании и в любой момент дня.',
       array['Яркий вкус', 'Освежает и бодрит', 'Удобный формат 330 мл'],
       '/sponsor/cans.jpg', '/sponsor/logo.png', 'Попробовать RC Cola', 'all'
 where not exists (select 1 from public.ad_banners);
