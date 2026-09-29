-- Match predictions: each registered player can pick home / draw / away for
-- a fixture before it is played. Writes go through the API (service role);
-- everyone can read.

create table if not exists public.prediction (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match(id) on delete cascade,
  predictor_id uuid not null references public.registered_player(id) on delete cascade,
  pick text not null check (pick in ('home', 'draw', 'away')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, predictor_id)
);

create index if not exists prediction_match_id_idx on public.prediction (match_id);

alter table public.prediction enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'prediction' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.prediction for select using (true);
  end if;
end
$$;

revoke all on table public.prediction from anon, authenticated;
grant select on table public.prediction to anon, authenticated;
grant all on table public.prediction to service_role;
