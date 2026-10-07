-- Таблица рекордов для страницы «Игры».
-- Вставить целиком в Supabase → SQL Editor → Run.

create table if not exists public.scores (
  day        date        not null,
  game       text        not null check (game in ('daily', 'chord')),
  client_id  uuid        not null,
  nick       text        check (nick is null or char_length(nick) between 1 and 16),
  score      integer     not null check (score between 0 and 100000),
  updated_at timestamptz not null default now(),
  primary key (day, game, client_id)
);

-- Прямой доступ к таблице закрыт. Сайт работает только через две функции ниже.
alter table public.scores enable row level security;

create or replace function public.submit_score(p_day date, p_game text, p_client uuid, p_nick text, p_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_day not between current_date - 7 and current_date + 1 then
    raise exception 'bad day';
  end if;
  if p_score < 0 or p_score > (case when p_game = 'daily' then 60000 else 100000 end) then
    raise exception 'bad score';
  end if;
  insert into scores (day, game, client_id, nick, score)
  values (p_day, p_game, p_client, nullif(left(trim(p_nick), 16), ''), p_score)
  on conflict (day, game, client_id) do update
    set score      = greatest(scores.score, excluded.score),
        nick       = coalesce(scores.nick, excluded.nick),
        updated_at = case when excluded.score > scores.score then now() else scores.updated_at end;
end
$$;

create or replace function public.get_board(p_day date, p_game text, p_client uuid)
returns table (place int, nick text, score int, is_me boolean)
language sql
security definer
set search_path = public
as $$
  with r as (
    select s.*, (row_number() over (order by s.score desc, s.updated_at asc))::int as place
    from scores s
    where s.day = p_day and s.game = p_game
  )
  select r.place, coalesce(r.nick, 'Аноним'), r.score, r.client_id = p_client
  from r
  where r.place <= 3 or r.client_id = p_client
  order by r.place;
$$;

revoke all on function public.submit_score(date, text, uuid, text, int) from public;
revoke all on function public.get_board(date, text, uuid) from public;
grant execute on function public.submit_score(date, text, uuid, text, int) to anon, authenticated;
grant execute on function public.get_board(date, text, uuid) to anon, authenticated;
