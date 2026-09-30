-- New tournaments no longer need an admin PIN. A tournament without one
-- (pin is null) is open: anyone can enter results and manage it. Existing
-- tournaments keep their PINs.

alter table public.tournament alter column pin drop not null;

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
as $function$
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
  -- A null hash means an open tournament; a given hash must look like one.
  if p_pin_hash is not null and length(p_pin_hash) < 20 then
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
    from rows from (
      jsonb_to_recordset(p_player_selections) as (registered_player_id uuid, team text)
    ) with ordinality as selection(registered_player_id, team, ordinality)
    join public.registered_player as registered on registered.id = selection.registered_player_id
    where length(btrim(selection.team)) between 1 and 80;

    get diagnostics v_inserted = row_count;
    if v_inserted <> v_expected then
      raise exception 'One or more player selections are invalid';
    end if;
  end if;

  return to_jsonb(v_tournament) - 'pin';
end;
$function$;

revoke execute on function public.create_tournament_atomic(text, text, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_tournament_atomic(text, text, text, uuid, jsonb) to service_role;
