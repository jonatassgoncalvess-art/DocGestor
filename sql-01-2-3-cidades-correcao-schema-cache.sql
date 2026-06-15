-- DocGestor by Carminatti
-- Correção do ambiente 01.2.3 Cidades
-- Use este SQL quando aparecer:
-- "Could not find the table 'public.cities' in the schema cache"

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  state char(2) not null,
  status text not null default 'Ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cities_state_check check (state in (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
  )),
  constraint cities_status_check check (status in ('Ativa', 'Inativa'))
);

create unique index if not exists cities_organization_name_state_key
  on cities (organization_id, lower(name), state);

alter table if exists properties
  add column if not exists address text,
  add column if not exists city_id uuid references cities(id) on delete set null;

do $$
begin
  if to_regclass('public.properties') is not null then
    create index if not exists properties_city_id_idx on properties(city_id);
  end if;
end;
$$;

drop trigger if exists trg_cities_updated_at on cities;
create trigger trg_cities_updated_at
before update on cities
for each row execute function set_updated_at();

alter table cities enable row level security;

drop policy if exists "Allow public read cities" on cities;
create policy "Allow public read cities"
on cities for select
using (true);

drop policy if exists "Allow public insert cities" on cities;
create policy "Allow public insert cities"
on cities for insert
with check (true);

drop policy if exists "Allow public update cities" on cities;
create policy "Allow public update cities"
on cities for update
using (true)
with check (true);

drop policy if exists "Allow public delete cities" on cities;
create policy "Allow public delete cities"
on cities for delete
using (true);

notify pgrst, 'reload schema';
