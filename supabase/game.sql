-- =========================================================
--  DAVODAVSHIK — рейтинг мини-игры
--  Как применить: Supabase → SQL Editor → вставить весь файл → Run (один раз).
--  Существующие таблицы и данные не затрагиваются. Файл можно запускать повторно.
-- =========================================================

-- Забеги: каждый забег открывается на сервере, поэтому время игры нельзя подделать.
create table if not exists public.game_runs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  character   text not null check (character in ('abduvali', 'shabnam', 'magachill', 'ehsonsho', 'suleyman')),
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists game_runs_user_idx on public.game_runs (user_id, started_at desc);

-- Лучший результат каждого игрока.
create table if not exists public.game_scores (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 16),
  character   text not null check (character in ('abduvali', 'shabnam', 'magachill', 'ehsonsho', 'suleyman')),
  score       integer not null check (score >= 0),
  coins       integer not null default 0 check (coins >= 0),
  achieved_at timestamptz not null default now()
);

create index if not exists game_scores_rank_idx on public.game_scores (score desc, achieved_at asc);

-- Таблицы закрыты полностью: читать и писать можно только через функции ниже.
alter table public.game_runs enable row level security;
alter table public.game_scores enable row level security;
revoke all on public.game_runs from anon, authenticated;
revoke all on public.game_scores from anon, authenticated;

-- Начать забег (только для вошедших). Возвращает номер забега.
create or replace function public.start_game_run(p_character text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  run_id uuid;
begin
  if uid is null then
    raise exception 'Войдите в аккаунт';
  end if;
  if p_character is null or p_character not in ('abduvali', 'shabnam', 'magachill', 'ehsonsho', 'suleyman') then
    raise exception 'Неизвестный персонаж';
  end if;

  -- не больше 60 забегов в час
  if (select count(*) from public.game_runs where user_id = uid and started_at > now() - interval '1 hour') >= 60 then
    raise exception 'Слишком много игр подряд, подождите немного';
  end if;

  -- старые незавершённые забеги не копим
  delete from public.game_runs where user_id = uid and started_at < now() - interval '1 day';

  insert into public.game_runs (user_id, character) values (uid, p_character)
  returning id into run_id;
  return run_id;
end;
$$;

-- Закончить забег и записать результат.
-- Сервер не верит присланному счёту на слово: считает, сколько очков вообще можно набрать
-- за прошедшее по его часам время.
create or replace function public.finish_game_run(
  p_run uuid,
  p_dist_score integer,
  p_bonus_score integer,
  p_coins integer,
  p_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  run public.game_runs;
  elapsed numeric;
  total integer;
  clean text;
  prev public.game_scores;
  best integer;
  improved boolean := false;
  place integer;
begin
  if uid is null then
    raise exception 'Войдите в аккаунт';
  end if;

  select * into run from public.game_runs
   where id = p_run and user_id = uid and finished_at is null
   for update;
  if not found then
    return jsonb_build_object('accepted', false, 'reason', 'run');
  end if;

  -- забег закрывается в любом случае: повторно отправить его нельзя
  update public.game_runs set finished_at = now() where id = run.id;

  elapsed := extract(epoch from (now() - run.started_at));

  if p_dist_score is null or p_bonus_score is null or p_coins is null
     or p_dist_score < 0 or p_bonus_score < 0 or p_coins < 0
     or elapsed < 2
     -- путь: не быстрее максимальной скорости игры (≈16 очков в секунду) + запас на задержку сети
     or p_dist_score > (elapsed + 3) * 17
     -- бонусы: не чаще 4 штук в секунду, каждый стоит не больше 20 очков
     or p_coins > (elapsed + 3) * 4 + 6
     or p_bonus_score > p_coins * 20 then
    return jsonb_build_object('accepted', false, 'reason', 'implausible');
  end if;

  total := p_dist_score + p_bonus_score;

  -- Имя: 2–16 символов, без ссылок и @
  clean := btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', '', 'g'));
  if char_length(clean) < 2
     or char_length(clean) > 16
     or clean ~* '(https?:|www\.|@|\.(com|ru|tj|net|org|me|io)([^a-z]|$))' then
    clean := 'Игрок';
  end if;

  select * into prev from public.game_scores where user_id = uid;
  if not found then
    insert into public.game_scores (user_id, name, character, score, coins)
    values (uid, clean, run.character, total, p_coins);
    best := total;
    improved := true;
  elsif total > prev.score then
    update public.game_scores
       set name = clean, character = run.character, score = total, coins = p_coins, achieved_at = now()
     where user_id = uid;
    best := total;
    improved := true;
  else
    best := prev.score;
    update public.game_scores set name = clean where user_id = uid;
  end if;

  select 1 + count(*) into place
    from public.game_scores s, public.game_scores me
   where me.user_id = uid
     and (s.score > me.score or (s.score = me.score and s.achieved_at < me.achieved_at));

  return jsonb_build_object('accepted', true, 'improved', improved, 'best', best, 'rank', place);
end;
$$;

-- Общий рейтинг. Почту и id игроков он не показывает; своя строка помечена mine.
create or replace function public.game_leaderboard(p_limit integer default 20)
returns table (rank bigint, name text, blogger text, score integer, achieved_at timestamptz, mine boolean)
language sql
stable
security definer
set search_path = public
as $$
  select row_number() over (order by s.score desc, s.achieved_at asc) as rank,
         s.name, s.character as blogger, s.score, s.achieved_at,
         (s.user_id = auth.uid()) as mine
    from public.game_scores s
   order by s.score desc, s.achieved_at asc
   limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

revoke all on function public.start_game_run(text) from public;
revoke all on function public.finish_game_run(uuid, integer, integer, integer, text) from public;
revoke all on function public.game_leaderboard(integer) from public;
grant execute on function public.start_game_run(text) to authenticated;
grant execute on function public.finish_game_run(uuid, integer, integer, integer, text) to authenticated;
grant execute on function public.game_leaderboard(integer) to anon, authenticated;
