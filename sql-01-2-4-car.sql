create extension if not exists pgcrypto;

create table if not exists public.car_registries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  car_number text not null,
  property_id uuid references public.properties(id) on delete set null,
  status text not null default 'Ativo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint car_registries_status_check check (status in ('Ativo', 'Pendente', 'Retificado', 'Cancelado'))
);

alter table public.car_registries
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists car_number text,
  add column if not exists property_id uuid references public.properties(id) on delete set null,
  add column if not exists status text not null default 'Ativo',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.car_registries
  alter column car_number set not null;

create unique index if not exists car_registries_org_number_unique
  on public.car_registries (organization_id, lower(car_number));

create index if not exists car_registries_organization_id_idx
  on public.car_registries (organization_id);

create index if not exists car_registries_property_id_idx
  on public.car_registries (property_id);

create index if not exists car_registries_status_idx
  on public.car_registries (status);

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
