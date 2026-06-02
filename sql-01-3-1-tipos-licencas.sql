-- DocGestor Exprt - 01.3.1 Tipos de Licencas
-- Execute este bloco depois do SQL 01.2.1 Socios.

create extension if not exists "pgcrypto";

create table if not exists environmental_license_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint environmental_license_types_name_by_organization_unique unique (organization_id, name),
  constraint environmental_license_types_status_check check (status in ('Ativo', 'Inativo'))
);

create table if not exists environmental_license_type_phases (
  license_type_id uuid not null references environmental_license_types(id) on delete cascade,
  phase text not null,
  created_at timestamptz not null default now(),
  primary key (license_type_id, phase),
  constraint environmental_license_type_phases_check check (phase in ('Monofasica', 'Bifasica', 'Trifasica'))
);

create index if not exists environmental_license_types_organization_id_idx
on environmental_license_types(organization_id);

create index if not exists environmental_license_types_name_idx
on environmental_license_types(name);

create index if not exists environmental_license_type_phases_license_type_id_idx
on environmental_license_type_phases(license_type_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists environmental_license_types_set_updated_at on environmental_license_types;

create trigger environmental_license_types_set_updated_at
before update on environmental_license_types
for each row
execute function set_updated_at();

alter table environmental_license_types enable row level security;
alter table environmental_license_type_phases enable row level security;

drop policy if exists environmental_license_types_prototype_all on environmental_license_types;
drop policy if exists environmental_license_type_phases_prototype_all on environmental_license_type_phases;

create policy environmental_license_types_prototype_all
on environmental_license_types
for all
using (true)
with check (true);

create policy environmental_license_type_phases_prototype_all
on environmental_license_type_phases
for all
using (true)
with check (true);
