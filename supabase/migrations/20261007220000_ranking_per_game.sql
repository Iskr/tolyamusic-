-- Рейтинги по каждой игре.
-- daily: сумма лучших результатов за каждый день; остальные игры: лучший результат за одну игру.

alter table public.scores drop constraint if exists scores_game_check;
alter table public.scores add constraint scores_game_check
  check (game in ('daily', 'chord', 'fake', 'rhythm', 'kill', 'ab'));

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
  if p_score < 0 or p_score > (case when p_game = 'daily' then 60000 else 200000 end) then
    raise exception 'bad score';
  end if;
  insert into scores (day, game, client_id, nick, score)
  values (p_day, p_game, p_client, nullif(left(trim(p_nick), 16), ''), p_score)
  on conflict (day, game, client_id) do update
    set score      = greatest(scores.score, excluded.score),
        nick       = coalesce(excluded.nick, scores.nick),
        updated_at = case when excluded.score > scores.score then now() else scores.updated_at end;
end
$$;

drop function if exists public.get_ranking(date, uuid);

create or replace function public.get_ranking(p_game text, p_from date, p_client uuid)
returns table (place int, nick text, score bigint, is_me boolean)
language sql
security definer
set search_path = public
as $$
  with nicks as (
    select distinct on (s.client_id) s.client_id, s.nick
    from scores s
    where s.nick is not null
    order by s.client_id, s.updated_at desc
  ),
  agg as (
    select s.client_id,
           (case when p_game = 'daily' then sum(s.score) else max(s.score) end)::bigint as total,
           max(s.updated_at) as last_at
    from scores s
    where s.game = p_game
      and (p_from is null or (case when p_game = 'daily' then s.day >= p_from else s.updated_at >= p_from end))
    group by s.client_id
  ),
  r as (
    select a.*, (row_number() over (order by a.total desc, a.last_at asc))::int as place from agg a
  )
  select r.place, coalesce(n.nick, 'Аноним'), r.total, r.client_id = p_client
  from r left join nicks n on n.client_id = r.client_id
  where r.place <= 3 or r.client_id = p_client
  order by r.place;
$$;

revoke all on function public.get_ranking(text, date, uuid) from public;
grant execute on function public.get_ranking(text, date, uuid) to anon, authenticated;
