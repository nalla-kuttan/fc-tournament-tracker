-- Defense in depth for the non-exposed distributed rate-limit store.
alter table private.rate_limit_bucket enable row level security;
revoke all on table private.rate_limit_bucket from public, anon, authenticated;
