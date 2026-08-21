-- DocGestor by Carminatti
-- Ambiente 01.2.4 CAR
-- Cadastro Ambiental Rural anterior ao cadastro de matrícula/imóvel.
-- Execute no Supabase. O script é seguro para banco já existente: cria ou amplia a tabela sem apagar dados.

create extension if not exists pgcrypto;

create table if not exists public.car_registries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  car_number text not null,
  registrations jsonb not null default '[]'::jsonb,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  total_area_m2 numeric(14, 2),
  perimeter_description text,
  legal_reserve_area_m2 numeric(14, 2),
  legal_reserve_status text,
  app_area_m2 numeric(14, 2),
  app_in_legal_reserve text,
  app_description text,
  native_vegetation_area_m2 numeric(14, 2),
  native_vegetation_description text,
  consolidated_area_m2 numeric(14, 2),
  fallow_area_m2 numeric(14, 2),
  restricted_use_area_m2 numeric(14, 2),
  restricted_use_description text,
  rivers_area_m2 numeric(14, 2),
  rivers_description text,
  springs_area_m2 numeric(14, 2),
  springs_description text,
  lakes_area_m2 numeric(14, 2),
  lakes_description text,
  wetlands_area_m2 numeric(14, 2),
  wetlands_description text,
  improvements_area_m2 numeric(14, 2),
  improvements_description text,
  roads_area_m2 numeric(14, 2),
  roads_description text,
  easement_area_m2 numeric(14, 2),
  easement_description text,
  public_utility_area_m2 numeric(14, 2),
  public_utility_description text,
  status text not null default 'Ativo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint car_registries_status_check check (status in ('Ativo', 'Pendente', 'Retificado', 'Cancelado')),
  constraint car_registries_app_rl_coverage_check check (app_in_legal_reserve is null or app_in_legal_reserve in ('integral', 'parcial')),
  constraint car_registries_total_area_non_negative check (total_area_m2 is null or total_area_m2 >= 0),
  constraint car_registries_legal_reserve_non_negative check (legal_reserve_area_m2 is null or legal_reserve_area_m2 >= 0),
  constraint car_registries_app_area_non_negative check (app_area_m2 is null or app_area_m2 >= 0),
  constraint car_registries_native_vegetation_non_negative check (native_vegetation_area_m2 is null or native_vegetation_area_m2 >= 0),
  constraint car_registries_consolidated_non_negative check (consolidated_area_m2 is null or consolidated_area_m2 >= 0),
  constraint car_registries_fallow_non_negative check (fallow_area_m2 is null or fallow_area_m2 >= 0),
  constraint car_registries_restricted_use_non_negative check (restricted_use_area_m2 is null or restricted_use_area_m2 >= 0),
  constraint car_registries_rivers_non_negative check (rivers_area_m2 is null or rivers_area_m2 >= 0),
  constraint car_registries_springs_non_negative check (springs_area_m2 is null or springs_area_m2 >= 0),
  constraint car_registries_lakes_non_negative check (lakes_area_m2 is null or lakes_area_m2 >= 0),
  constraint car_registries_wetlands_non_negative check (wetlands_area_m2 is null or wetlands_area_m2 >= 0),
  constraint car_registries_improvements_non_negative check (improvements_area_m2 is null or improvements_area_m2 >= 0),
  constraint car_registries_roads_non_negative check (roads_area_m2 is null or roads_area_m2 >= 0),
  constraint car_registries_easement_non_negative check (easement_area_m2 is null or easement_area_m2 >= 0),
  constraint car_registries_public_utility_non_negative check (public_utility_area_m2 is null or public_utility_area_m2 >= 0)
);

alter table public.car_registries
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists car_number text,
  add column if not exists registrations jsonb not null default '[]'::jsonb,
  add column if not exists latitude numeric(10, 6),
  add column if not exists longitude numeric(10, 6),
  add column if not exists total_area_m2 numeric(14, 2),
  add column if not exists perimeter_description text,
  add column if not exists legal_reserve_area_m2 numeric(14, 2),
  add column if not exists legal_reserve_status text,
  add column if not exists app_area_m2 numeric(14, 2),
  add column if not exists app_in_legal_reserve text,
  add column if not exists app_description text,
  add column if not exists native_vegetation_area_m2 numeric(14, 2),
  add column if not exists native_vegetation_description text,
  add column if not exists consolidated_area_m2 numeric(14, 2),
  add column if not exists fallow_area_m2 numeric(14, 2),
  add column if not exists restricted_use_area_m2 numeric(14, 2),
  add column if not exists restricted_use_description text,
  add column if not exists rivers_area_m2 numeric(14, 2),
  add column if not exists rivers_description text,
  add column if not exists springs_area_m2 numeric(14, 2),
  add column if not exists springs_description text,
  add column if not exists lakes_area_m2 numeric(14, 2),
  add column if not exists lakes_description text,
  add column if not exists wetlands_area_m2 numeric(14, 2),
  add column if not exists wetlands_description text,
  add column if not exists improvements_area_m2 numeric(14, 2),
  add column if not exists improvements_description text,
  add column if not exists roads_area_m2 numeric(14, 2),
  add column if not exists roads_description text,
  add column if not exists easement_area_m2 numeric(14, 2),
  add column if not exists easement_description text,
  add column if not exists public_utility_area_m2 numeric(14, 2),
  add column if not exists public_utility_description text,
  add column if not exists status text not null default 'Ativo',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.car_registries
  alter column car_number set not null,
  alter column registrations set default '[]'::jsonb,
  alter column status set default 'Ativo';

update public.car_registries
set registrations = '[]'::jsonb
where registrations is null;

alter table public.car_registries
  alter column registrations set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'car_registries_app_rl_coverage_check') then
    alter table public.car_registries
      add constraint car_registries_app_rl_coverage_check
      check (app_in_legal_reserve is null or app_in_legal_reserve in ('integral', 'parcial'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_total_area_non_negative') then
    alter table public.car_registries add constraint car_registries_total_area_non_negative check (total_area_m2 is null or total_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_app_area_non_negative') then
    alter table public.car_registries add constraint car_registries_app_area_non_negative check (app_area_m2 is null or app_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_native_vegetation_non_negative') then
    alter table public.car_registries add constraint car_registries_native_vegetation_non_negative check (native_vegetation_area_m2 is null or native_vegetation_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_restricted_use_non_negative') then
    alter table public.car_registries add constraint car_registries_restricted_use_non_negative check (restricted_use_area_m2 is null or restricted_use_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_rivers_non_negative') then
    alter table public.car_registries add constraint car_registries_rivers_non_negative check (rivers_area_m2 is null or rivers_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_springs_non_negative') then
    alter table public.car_registries add constraint car_registries_springs_non_negative check (springs_area_m2 is null or springs_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_lakes_non_negative') then
    alter table public.car_registries add constraint car_registries_lakes_non_negative check (lakes_area_m2 is null or lakes_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_wetlands_non_negative') then
    alter table public.car_registries add constraint car_registries_wetlands_non_negative check (wetlands_area_m2 is null or wetlands_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_improvements_non_negative') then
    alter table public.car_registries add constraint car_registries_improvements_non_negative check (improvements_area_m2 is null or improvements_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_roads_non_negative') then
    alter table public.car_registries add constraint car_registries_roads_non_negative check (roads_area_m2 is null or roads_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_easement_non_negative') then
    alter table public.car_registries add constraint car_registries_easement_non_negative check (easement_area_m2 is null or easement_area_m2 >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'car_registries_public_utility_non_negative') then
    alter table public.car_registries add constraint car_registries_public_utility_non_negative check (public_utility_area_m2 is null or public_utility_area_m2 >= 0);
  end if;
end;
$$;

create unique index if not exists car_registries_org_number_unique
  on public.car_registries (organization_id, lower(car_number));

create index if not exists car_registries_organization_id_idx
  on public.car_registries (organization_id);

create index if not exists car_registries_status_idx
  on public.car_registries (status);

create index if not exists car_registries_registrations_gin_idx
  on public.car_registries using gin (registrations);

create or replace function public.set_car_registries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_car_registries_updated_at on public.car_registries;

create trigger trg_car_registries_updated_at
before update on public.car_registries
for each row
execute function public.set_car_registries_updated_at();

alter table public.car_registries enable row level security;

drop policy if exists "car_registries_select" on public.car_registries;
drop policy if exists "car_registries_insert" on public.car_registries;
drop policy if exists "car_registries_update" on public.car_registries;
drop policy if exists "car_registries_delete" on public.car_registries;

create policy "car_registries_select"
on public.car_registries for select
using (true);

create policy "car_registries_insert"
on public.car_registries for insert
with check (true);

create policy "car_registries_update"
on public.car_registries for update
using (true)
with check (true);

create policy "car_registries_delete"
on public.car_registries for delete
using (true);
