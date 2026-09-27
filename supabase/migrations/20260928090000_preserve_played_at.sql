-- Keep a played match's original date when its result is edited.
--
-- save_match_result_atomic sets played_at = now() on every save, so editing an
-- old result (or undoing an edit) silently moved it to today, which changed
-- "last 30/90 days" stats and form order. This trigger keeps the first
-- played_at once a match has been played; a match's first save still sets it.

create or replace function private.preserve_played_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_played and new.is_played and old.played_at is not null then
    new.played_at := old.played_at;
  end if;
  return new;
end;
$$;

drop trigger if exists preserve_played_at on public.match;
create trigger preserve_played_at
before update of played_at on public.match
for each row execute function private.preserve_played_at();
