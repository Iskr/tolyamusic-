-- Рейтинг игроков: сумма лучших результатов «Задания дня».
-- p_from = первая дата периода (null = за всё время).

create or replace function public.get_ranking(p_from date, p_client uuid)
returns table (place int, nick text, score bigint, is_me boolean)
language sql
security definer
set search_path = public
as $$
  with agg as (
    select s.client_id,
           sum(s.score)::bigint as total,
           max(s.updated_at)    as last_at,
           (array_agg(s.nick order by s.updated_at desc) filter (where s.nick is not null))[1] as nk
    from scores s
    where s.game = 'daily' and (p_from is null or s.day >= p_from)
    group by s.client_id
  ),
  r as (
    select a.*, (row_number() over (order by a.total desc, a.last_at asc))::int as place from agg a
  )
  select r.place, coalesce(r.nk, 'Аноним'), r.total, r.client_id = p_client
  from r
  where r.place <= 3 or r.client_id = p_client
  order by r.place;
$$;

revoke all on function public.get_ranking(date, uuid) from public;
grant execute on function public.get_ranking(date, uuid) to anon, authenticated;
