-- VITA — Supabase schema (P0). Run once in the Supabase SQL editor (project in an EU region).
-- Model: the client keeps its whole app state (V.state) as ONE JSON snapshot per user,
-- protected by Row Level Security; doctors get their own rows via profiles.role.

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'patient' check (role in ('patient','doctor','org')),
  name        text,
  lang        text not null default 'ka',
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles: read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles p where p.id = auth.uid())); -- role is never self-assigned

-- auto-create the profile row on sign-up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- state snapshot (the app's V.state, one row per user) ----------
create table if not exists public.state_snapshots (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  state       jsonb not null,
  saved_at    timestamptz not null,               -- client clock: last-write-wins across devices
  updated_at  timestamptz not null default now(),
  version     int not null default 1,
  constraint state_size check (pg_column_size(state) < 2000000)   -- 2 MB: photos are stripped client-side
);
alter table public.state_snapshots enable row level security;
create policy "state: own" on public.state_snapshots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists state_touch on public.state_snapshots;
create trigger state_touch before update on public.state_snapshots for each row execute procedure public.touch_updated_at();
-- realtime (multi-device live sync)
alter publication supabase_realtime add table public.state_snapshots;

-- ---------- consults + EHR (P1 moves routing here from backend.py) ----------
create table if not exists public.consults (
  id          text primary key,
  patient_id  uuid not null references auth.users(id) on delete cascade,
  doctor_id   uuid references auth.users(id),
  status      text not null default 'waiting' check (status in ('waiting','active','done','cancelled')),
  patient     jsonb,                               -- sanitized snapshot: name, age, sex, reason, vitals
  rx          text,
  notes       text,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);
alter table public.consults enable row level security;
create policy "consults: patient own"   on public.consults for select using (auth.uid() = patient_id);
create policy "consults: patient create" on public.consults for insert with check (auth.uid() = patient_id);
create policy "consults: doctors read queue" on public.consults for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'doctor'));
create policy "consults: doctor claims/ends" on public.consults for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'doctor'))
  with check (doctor_id = auth.uid());

create table if not exists public.ehr_records (
  id          bigserial primary key,
  patient_id  uuid not null references auth.users(id) on delete cascade,
  consult_id  text references public.consults(id),
  doctor_id   uuid references auth.users(id),
  notes       text,
  rx          text,
  vitals      jsonb,
  created_at  timestamptz not null default now()
);
alter table public.ehr_records enable row level security;
create policy "ehr: patient reads own" on public.ehr_records for select using (auth.uid() = patient_id);
create policy "ehr: doctor writes own consults" on public.ehr_records for insert
  with check (doctor_id = auth.uid() and exists (select 1 from public.consults c where c.id = consult_id and c.doctor_id = auth.uid()));
create policy "ehr: doctor reads own consults" on public.ehr_records for select using (doctor_id = auth.uid());

-- doctor-access audit (every doctor read of a patient record is logged by the app)
create table if not exists public.access_log (
  id          bigserial primary key,
  actor_id    uuid not null,
  patient_id  uuid not null,
  action      text not null,
  at          timestamptz not null default now()
);
alter table public.access_log enable row level security;
create policy "audit: insert own actions" on public.access_log for insert with check (actor_id = auth.uid());

-- ---------- orders (marketplace, P2) ----------
create table if not exists public.orders (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  items       jsonb not null,
  total       numeric(10,2) not null,
  courier     text,
  status      text not null default 'placed',
  created_at  timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "orders: own" on public.orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
