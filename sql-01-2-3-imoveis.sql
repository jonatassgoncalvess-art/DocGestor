-- DocGestor Exprt - 01.2.3 Imoveis
-- Execute este bloco depois dos SQLs 01.2.1 Socios e 01.2.2 Empresas e Filiais.

create extension if not exists "pgcrypto";

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  owner_type text not null,
  owner_partner_id uuid references partners(id) on delete restrict,
  owner_company_id uuid references companies(id) on delete restrict,
  type text not null,
  registration text not null,
  reference text,
  lot text,
  block text,
  glebe text,
  car_number text,
  ccir_incra_number text,
  urban_property_registration text,
  urban_area_m2 numeric(14,2),
  rural_area_m2 numeric(14,2),
  rural_area_ha numeric(14,4) generated always as (coalesce(rural_area_m2, 0) / 10000) stored,
  legal_reserve_m2 numeric(14,2),
  legal_reserve_ha numeric(14,4) generated always as (coalesce(legal_reserve_m2, 0) / 10000) stored,
  app_area_m2 numeric(14,2),
  app_area_ha numeric(14,4) generated always as (coalesce(app_area_m2, 0) / 10000) stored,
  legal_reserve_required_m2 numeric(14,2) generated always as (
    case
      when type = 'rural' then coalesce(rural_area_m2, 0) * 0.20
      else 0
    end
  ) stored,
  legal_reserve_required_ha numeric(14,4) generated always as (
    case
      when type = 'rural' then (coalesce(rural_area_m2, 0) * 0.20) / 10000
      else 0
    end
  ) stored,
  legal_reserve_is_ok boolean generated always as (
    case
      when type = 'rural' then coalesce(legal_reserve_m2, 0) >= (coalesce(rural_area_m2, 0) * 0.20)
      else true
    end
  ) stored,
  use_type text,
  has_construction boolean not null default false,
  construction_area_m2 numeric(14,2),
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_registration_by_organization_unique unique (organization_id, registration),
  constraint properties_owner_type_check check (owner_type in ('pf', 'pj')),
  constraint properties_type_check check (type in ('urban', 'rural')),
  constraint properties_status_check check (status in ('Ativo', 'Inativo')),
  constraint properties_owner_check check (
    (owner_type = 'pf' and owner_partner_id is not null and owner_company_id is null)
    or
    (owner_type = 'pj' and owner_company_id is not null and owner_partner_id is null)
  ),
  constraint properties_urban_rural_fields_check check (
    (
      type = 'urban'
      and block is not null
      and glebe is null
      and rural_area_m2 is null
      and legal_reserve_m2 is null
      and app_area_m2 is null
    )
    or
    (
      type = 'rural'
      and glebe is not null
      and block is null
      and urban_area_m2 is null
    )
  ),
  constraint properties_use_type_check check (
    use_type is null
    or use_type in ('Residencia', 'Comercio', 'Lavoura', 'Empreendimento')
  ),
  constraint properties_urban_use_check check (
    type <> 'urban'
    or use_type is null
    or use_type in ('Residencia', 'Comercio')
  ),
  constraint properties_rural_use_check check (
    type <> 'rural'
    or use_type in ('Lavoura', 'Empreendimento')
  ),
  constraint properties_lavoura_construction_check check (
    not (type = 'rural' and use_type = 'Lavoura' and has_construction = true)
  ),
  constraint properties_positive_areas_check check (
    coalesce(urban_area_m2, 0) >= 0
    and coalesce(rural_area_m2, 0) >= 0
    and coalesce(legal_reserve_m2, 0) >= 0
    and coalesce(app_area_m2, 0) >= 0
    and coalesce(construction_area_m2, 0) >= 0
  )
);

create index if not exists properties_organization_id_idx on properties(organization_id);
create index if not exists properties_owner_partner_id_idx on properties(owner_partner_id);
create index if not exists properties_owner_company_id_idx on properties(owner_company_id);
create index if not exists properties_registration_idx on properties(registration);
create index if not exists properties_type_idx on properties(type);
create index if not exists properties_car_number_idx on properties(car_number);
create index if not exists properties_ccir_incra_number_idx on properties(ccir_incra_number);
create index if not exists properties_urban_property_registration_idx on properties(urban_property_registration);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on properties;

create trigger properties_set_updated_at
before update on properties
for each row
execute function set_updated_at();

alter table properties enable row level security;

drop policy if exists properties_prototype_all on properties;

create policy properties_prototype_all
on properties
for all
using (true)
with check (true);
