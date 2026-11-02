-- «Собери бас»: разрешить игру в таблице рекордов.
-- Вставить в Supabase → SQL Editor → Run (после предыдущих миграций).

alter table public.scores drop constraint if exists scores_game_check;
alter table public.scores add constraint scores_game_check
  check (game in ('daily', 'chord', 'fake', 'rhythm', 'kill', 'ab', 'bass'));
