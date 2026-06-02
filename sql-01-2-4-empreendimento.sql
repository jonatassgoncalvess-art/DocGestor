-- DocGestor Exprt - 01.2.4 Empreendimento
-- Execute este bloco depois dos SQLs 01.2.1, 01.2.2 e 01.2.3.

create extension if not exists "pgcrypto";

create table if not exists enterprises (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  company_id uuid not null references companies(id) on delete restrict,
  property_id uuid not null references properties(id) on delete restrict,
  type text,
  status text not null default 'Planejado',
  responsible_partner_id uuid references partners(id) on delete set null,
  reference text,
  potential_polluter boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enterprises_name_by_organization_unique unique (organization_id, name),
  constraint enterprises_status_check check (status in ('Planejado', 'Em implantacao', 'Em analise', 'Ativo', 'Operando', 'Paralisado', 'Suspenso', 'Encerrado')),
  constraint enterprises_type_check check (
    type is null
    or type in ('Industrial', 'Rural', 'Comercial', 'Residencial', 'Infraestrutura', 'Outro')
  )
);

alter table enterprises
add column if not exists potential_polluter boolean not null default false;

alter table enterprises
drop constraint if exists enterprises_status_check;

alter table enterprises
add constraint enterprises_status_check
check (status in ('Planejado', 'Em implantacao', 'Em analise', 'Ativo', 'Operando', 'Paralisado', 'Suspenso', 'Encerrado'));

alter table enterprises
drop constraint if exists enterprises_type_check;

alter table enterprises
add constraint enterprises_type_check
check (
  type is null
  or type in ('Industrial', 'Rural', 'Comercial', 'Residencial', 'Infraestrutura', 'Outro')
);

create index if not exists enterprises_organization_id_idx on enterprises(organization_id);
create index if not exists enterprises_company_id_idx on enterprises(company_id);
create index if not exists enterprises_property_id_idx on enterprises(property_id);
create index if not exists enterprises_responsible_partner_id_idx on enterprises(responsible_partner_id);
create index if not exists enterprises_status_idx on enterprises(status);

create table if not exists enterprise_modules (
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  module_id text not null,
  created_at timestamptz not null default now(),
  primary key (enterprise_id, module_id)
);

create index if not exists enterprise_modules_enterprise_id_idx on enterprise_modules(enterprise_id);
create index if not exists enterprise_modules_module_id_idx on enterprise_modules(module_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists enterprises_set_updated_at on enterprises;

create trigger enterprises_set_updated_at
before update on enterprises
for each row
execute function set_updated_at();

alter table enterprises enable row level security;
alter table enterprise_modules enable row level security;

drop policy if exists enterprises_prototype_all on enterprises;

create policy enterprises_prototype_all
on enterprises
for all
using (true)
with check (true);

drop policy if exists enterprise_modules_prototype_all on enterprise_modules;

create policy enterprise_modules_prototype_all
on enterprise_modules
for all
using (true)
with check (true);
