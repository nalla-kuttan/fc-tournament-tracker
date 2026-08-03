-- Production hardening for FC Tournament Tracker.
-- Apply with the Supabase CLI or SQL editor before deploying the matching app release.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
revoke create on schema public from public, anon, authenticated;

-- Bring older deployed FC schemas up to the season-aware repository baseline.
create table if not exists public.season (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  source_tournament_id uuid unique,
  created_at timestamptz default now()
);

alter table public.tournament
  add column if not exists season_id uuid
  references public.season(id) on delete set null;

create index if not exists idx_tournament_season
  on public.tournament(season_id);

alter table public.season enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'season'
      and policyname = 'Public read'
  ) then
    create policy "Public read" on public.season for select using (true);
  end if;
end;
$$;

grant select on table public.season to anon, authenticated;
grant all on table public.season to service_role;

-- Legacy policies allowed anonymous writes directly through the Data API.
-- All FC mutations now go through validated server routes using service_role.
drop policy if exists "Anon insert" on public.registered_player;
drop policy if exists "Anon update" on public.registered_player;
drop policy if exists "Anon delete" on public.registered_player;
drop policy if exists "Anon insert" on public.tournament;
drop policy if exists "Anon update" on public.tournament;
drop policy if exists "Anon delete" on public.tournament;
drop policy if exists "Anon insert" on public.player;
drop policy if exists "Anon update" on public.player;
drop policy if exists "Anon delete" on public.player;
drop policy if exists "Anon insert" on public.match;
drop policy if exists "Anon update" on public.match;
drop policy if exists "Anon delete" on public.match;
drop policy if exists "Anon insert" on public.goal;
drop policy if exists "Anon update" on public.goal;
drop policy if exists "Anon delete" on public.goal;
drop policy if exists "Anon insert" on public.music_track;
drop policy if exists "Anon update" on public.music_track;
drop policy if exists "Anon delete" on public.music_track;

revoke insert, update, delete, truncate, references, trigger
  on table public.registered_player, public.tournament, public.player,
    public.match, public.goal, public.music_track, public.season
  from public, anon, authenticated;

-- Complete the historical season migration once, outside request handling.
insert into public.season (name, status, starts_at, ends_at, source_tournament_id, created_at)
select
  tournament.name,
  case
    when tournament.status = 'completed' then 'completed'
    when tournament.status = 'active' then 'active'
    else 'archived'
  end,
  tournament.created_at,
  case when tournament.status = 'completed' then tournament.created_at else null end,
  tournament.id,
  tournament.created_at
from public.tournament as tournament
where tournament.season_id is null
on conflict (source_tournament_id) do nothing;

update public.tournament as tournament
set season_id = season.id
from public.season as season
where tournament.season_id is null
  and season.source_tournament_id = tournament.id;

create table if not exists private.rate_limit_bucket (
  key text primary key,
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null
);

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_started_at timestamptz;
begin
  if length(p_key) <> 64 or p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  insert into private.rate_limit_bucket as bucket (key, request_count, window_started_at)
  values (p_key, 1, v_now)
  on conflict (key) do update
  set
    request_count = case
      when bucket.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
      else bucket.request_count + 1
    end,
    window_started_at = case
      when bucket.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
      else bucket.window_started_at
    end
  returning request_count, window_started_at into v_count, v_started_at;

  allowed := v_count <= p_limit;
  retry_after_seconds := greatest(
    1,
    ceil(extract(epoch from (v_started_at + make_interval(secs => p_window_seconds) - v_now)))::integer
  );

  if random() < 0.01 then
    delete from private.rate_limit_bucket
    where window_started_at < v_now - interval '2 days';
  end if;

  return next;
end;
$$;

create or replace function public.create_tournament_atomic(
  p_name text,
  p_format text,
  p_pin_hash text,
  p_season_id uuid default null,
  p_player_selections jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tournament public.tournament%rowtype;
  v_season_id uuid := p_season_id;
  v_expected integer;
  v_inserted integer;
begin
  if length(btrim(p_name)) < 1 or length(btrim(p_name)) > 100 then
    raise exception 'Tournament name must be between 1 and 100 characters';
  end if;
  if p_format not in ('league', 'knockout', 'cup') then
    raise exception 'Invalid tournament format';
  end if;
  if length(p_pin_hash) < 20 then
    raise exception 'Invalid PIN hash';
  end if;
  if jsonb_typeof(p_player_selections) <> 'array' then
    raise exception 'Player selections must be an array';
  end if;

  if v_season_id is null then
    select id into v_season_id
    from public.season
    where status = 'active'
    order by created_at desc
    limit 1
    for update;

    if v_season_id is null then
      insert into public.season (name, status, starts_at)
      values ('Active Season', 'active', now())
      returning id into v_season_id;
    end if;
  elsif not exists (select 1 from public.season where id = v_season_id) then
    raise exception 'Season not found';
  end if;

  insert into public.tournament (name, format, pin, season_id)
  values (btrim(p_name), p_format, p_pin_hash, v_season_id)
  returning * into v_tournament;

  v_expected := jsonb_array_length(p_player_selections);
  if v_expected > 0 then
    if v_expected > 64 then
      raise exception 'A tournament supports at most 64 players';
    end if;

    insert into public.player (tournament_id, registered_player_id, name, team, seed)
    select
      v_tournament.id,
      registered.id,
      registered.name,
      btrim(selection.team),
      selection.ordinality::integer
    from jsonb_to_recordset(p_player_selections) with ordinality
      as selection(registered_player_id uuid, team text, ordinality bigint)
    join public.registered_player as registered on registered.id = selection.registered_player_id
    where length(btrim(selection.team)) between 1 and 80;

    get diagnostics v_inserted = row_count;
    if v_inserted <> v_expected then
      raise exception 'One or more player selections are invalid';
    end if;
  end if;

  return to_jsonb(v_tournament) - 'pin';
end;
$$;

create or replace function public.create_schedule_atomic(
  p_tournament_id uuid,
  p_match_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tournament public.tournament%rowtype;
  v_match_count integer;
  v_round1_count integer;
  v_total_count integer;
  v_bye public.match%rowtype;
  v_next_match_number integer;
  v_next_match_id uuid;
  v_position integer;
begin
  if jsonb_typeof(p_match_rows) <> 'array' or jsonb_array_length(p_match_rows) < 1 then
    raise exception 'Schedule must contain at least one match';
  end if;

  select * into v_tournament
  from public.tournament
  where id = p_tournament_id
  for update;

  if not found then raise exception 'Tournament not found'; end if;
  if exists (select 1 from public.match where tournament_id = p_tournament_id) then
    raise exception 'Schedule already generated';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_match_rows) as row(home_player_id uuid, away_player_id uuid)
    where (row.home_player_id is not null and not exists (
      select 1 from public.player p where p.id = row.home_player_id and p.tournament_id = p_tournament_id
    )) or (row.away_player_id is not null and not exists (
      select 1 from public.player p where p.id = row.away_player_id and p.tournament_id = p_tournament_id
    ))
  ) then
    raise exception 'Schedule contains a player outside the tournament';
  end if;

  insert into public.match (
    tournament_id, home_player_id, away_player_id, round_number,
    match_number, stage, is_bye, match_order
  )
  select
    p_tournament_id,
    row.home_player_id,
    row.away_player_id,
    row.round_number,
    row.match_number,
    row.stage,
    coalesce(row.is_bye, false),
    row.match_order
  from jsonb_to_recordset(p_match_rows) as row(
    home_player_id uuid,
    away_player_id uuid,
    round_number integer,
    match_number integer,
    stage text,
    is_bye boolean,
    match_order integer
  );

  get diagnostics v_match_count = row_count;

  if v_tournament.format = 'knockout' then
    select count(*) into v_round1_count
    from public.match
    where tournament_id = p_tournament_id and round_number = 1;

    select count(*) into v_total_count
    from public.match
    where tournament_id = p_tournament_id;

    for v_bye in
      select * from public.match
      where tournament_id = p_tournament_id and round_number = 1 and is_bye
      order by match_number
      for update
    loop
      update public.match
      set is_played = true, home_score = 0, away_score = 0, played_at = now()
      where id = v_bye.id;

      v_position := v_bye.match_number - 1;
      v_next_match_number := v_round1_count + 1 + floor(v_position / 2.0)::integer;

      if v_next_match_number <= v_total_count then
        select id into v_next_match_id
        from public.match
        where tournament_id = p_tournament_id and match_number = v_next_match_number
        for update;

        if v_position % 2 = 0 then
          update public.match set home_player_id = v_bye.home_player_id where id = v_next_match_id;
        else
          update public.match set away_player_id = v_bye.home_player_id where id = v_next_match_id;
        end if;
      end if;
    end loop;
  end if;

  update public.tournament set status = 'active' where id = p_tournament_id;
  return jsonb_build_object('success', true, 'matchCount', v_match_count);
end;
$$;

create or replace function public.replace_match_goals_atomic(
  p_match_id uuid,
  p_goals jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.match%rowtype;
  v_goal jsonb;
  v_player_id uuid;
  v_minute integer;
  v_home_goal_count integer := 0;
  v_away_goal_count integer := 0;
begin
  if jsonb_typeof(p_goals) <> 'array' then raise exception 'Goals must be an array'; end if;

  select * into v_match from public.match where id = p_match_id for update;
  if not found then raise exception 'Match not found'; end if;
  if v_match.is_bye then raise exception 'BYE matches cannot have goals'; end if;
  if not v_match.is_played then raise exception 'Save the match result before adding goals'; end if;

  for v_goal in select * from jsonb_array_elements(p_goals)
  loop
    v_player_id := (v_goal ->> 'player_id')::uuid;
    v_minute := nullif(v_goal ->> 'minute', '')::integer;
    if v_player_id is distinct from v_match.home_player_id
       and v_player_id is distinct from v_match.away_player_id then
      raise exception 'Goals must use match players';
    end if;
    if v_minute is not null and (v_minute < 1 or v_minute > 130) then
      raise exception 'Goal minutes must be between 1 and 130';
    end if;
    if v_player_id = v_match.home_player_id then
      v_home_goal_count := v_home_goal_count + 1;
    elsif v_player_id = v_match.away_player_id then
      v_away_goal_count := v_away_goal_count + 1;
    end if;
  end loop;

  if v_home_goal_count <> v_match.home_score or v_away_goal_count <> v_match.away_score then
    raise exception 'Goal scorers must match the saved score';
  end if;

  delete from public.goal where match_id = p_match_id;
  insert into public.goal (match_id, player_id, minute)
  select p_match_id, (goal ->> 'player_id')::uuid, nullif(goal ->> 'minute', '')::integer
  from jsonb_array_elements(p_goals) as goal;

  return coalesce(
    (select jsonb_agg(to_jsonb(g) order by g.created_at) from public.goal g where g.match_id = p_match_id),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.advance_bracket_atomic(
  p_tournament_id uuid,
  p_match_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.match%rowtype;
  v_winner_id uuid;
  v_round1_count integer;
  v_total_count integer;
  v_cumulative integer := 0;
  v_matches_in_round integer;
  v_position integer;
  v_next_match_number integer;
  v_next public.match%rowtype;
begin
  select * into v_match
  from public.match
  where id = p_match_id and tournament_id = p_tournament_id
  for update;

  if not found or not v_match.is_played then raise exception 'Match not found or not played'; end if;
  if v_match.home_score = v_match.away_score then raise exception 'Cannot advance a drawn match'; end if;

  v_winner_id := case when v_match.home_score > v_match.away_score
    then v_match.home_player_id else v_match.away_player_id end;

  select count(*) into v_round1_count from public.match
  where tournament_id = p_tournament_id and round_number = 1;
  select count(*) into v_total_count from public.match where tournament_id = p_tournament_id;

  if v_match.match_number = v_total_count then
    update public.tournament set status = 'completed' where id = p_tournament_id;
    return jsonb_build_object('success', true, 'final', true, 'winnerId', v_winner_id);
  end if;

  v_matches_in_round := v_round1_count;
  while v_cumulative + v_matches_in_round < v_match.match_number loop
    v_cumulative := v_cumulative + v_matches_in_round;
    v_matches_in_round := v_matches_in_round / 2;
  end loop;

  v_position := v_match.match_number - v_cumulative - 1;
  v_next_match_number := v_cumulative + v_matches_in_round + 1 + floor(v_position / 2.0)::integer;

  select * into v_next from public.match
  where tournament_id = p_tournament_id and match_number = v_next_match_number
  for update;

  if not found then raise exception 'Next match not found'; end if;
  if v_next.is_played then raise exception 'The next match is already played'; end if;

  if v_position % 2 = 0 then
    update public.match set home_player_id = v_winner_id where id = v_next.id;
  else
    update public.match set away_player_id = v_winner_id where id = v_next.id;
  end if;

  return jsonb_build_object('success', true, 'final', false, 'winnerId', v_winner_id, 'nextMatchId', v_next.id);
end;
$$;

create or replace function private.guard_played_bracket_edit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_round1_count integer;
  v_total_count integer;
  v_cumulative integer := 0;
  v_matches_in_round integer;
  v_position integer;
  v_next_match_number integer;
  v_next_played boolean;
begin
  if old.is_played and old.stage is not null
     and (old.home_score is distinct from new.home_score or old.away_score is distinct from new.away_score)
  then
    select count(*) into v_round1_count from public.match
    where tournament_id = old.tournament_id and round_number = 1;
    select count(*) into v_total_count from public.match where tournament_id = old.tournament_id;

    if old.match_number < v_total_count then
      v_matches_in_round := v_round1_count;
      while v_cumulative + v_matches_in_round < old.match_number loop
        v_cumulative := v_cumulative + v_matches_in_round;
        v_matches_in_round := v_matches_in_round / 2;
      end loop;
      v_position := old.match_number - v_cumulative - 1;
      v_next_match_number := v_cumulative + v_matches_in_round + 1 + floor(v_position / 2.0)::integer;
      select is_played into v_next_played from public.match
      where tournament_id = old.tournament_id and match_number = v_next_match_number;
      if v_next_played then
        raise exception 'Cannot edit this result because the next bracket match has already been played';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_played_bracket_edit on public.match;
create trigger guard_played_bracket_edit
before update of home_score, away_score on public.match
for each row execute function private.guard_played_bracket_edit();

alter view public.standings set (security_invoker = true);
alter function public.save_match_result_atomic(uuid, integer, integer, jsonb, jsonb, boolean)
  set search_path = public;

create index if not exists idx_match_played_recent
  on public.match (played_at desc)
  where is_played and not is_bye;
create index if not exists idx_tournament_status_created
  on public.tournament (status, created_at desc);

revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.create_tournament_atomic(text, text, text, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.create_schedule_atomic(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.replace_match_goals_atomic(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.advance_bracket_atomic(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.save_match_result_atomic(uuid, integer, integer, jsonb, jsonb, boolean) from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.create_tournament_atomic(text, text, text, uuid, jsonb) to service_role;
grant execute on function public.create_schedule_atomic(uuid, jsonb) to service_role;
grant execute on function public.replace_match_goals_atomic(uuid, jsonb) to service_role;
grant execute on function public.advance_bracket_atomic(uuid, uuid) to service_role;
grant execute on function public.save_match_result_atomic(uuid, integer, integer, jsonb, jsonb, boolean) to service_role;
