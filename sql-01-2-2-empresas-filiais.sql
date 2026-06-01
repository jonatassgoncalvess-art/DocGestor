-- DocGestor Exprt - 01.2.2 Empresas e Filiais
-- Execute este bloco depois do SQL 01.2.1 Socios.

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  kind text not null,
  parent_id uuid references companies(id) on delete cascade,
  name text not null,
  cnpj text not null,
  trade_name text,
  status text not null default 'Ativa',
  show_branches boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_cnpj_by_organization_unique unique (organization_id, cnpj),
  constraint companies_kind_check check (kind in ('matrix', 'branch')),
  constraint companies_status_check check (status in ('Ativa', 'Inativa')),
  constraint companies_parent_check check (
    (kind = 'matrix' and parent_id is null)
    or
    (kind = 'branch' and parent_id is not null)
  )
);

create table if not exists company_partners (
  company_id uuid not null references companies(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (company_id, partner_id)
);

create index if not exists companies_organization_id_idx on companies(organization_id);
create index if not exists companies_parent_id_idx on companies(parent_id);
create index if not exists companies_cnpj_idx on companies(cnpj);
create index if not exists company_partners_partner_id_idx on company_partners(partner_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_set_updated_at on companies;

create trigger companies_set_updated_at
before update on companies
for each row
execute function set_updated_at();

alter table companies enable row level security;
alter table company_partners enable row level security;

drop policy if exists companies_prototype_all on companies;
drop policy if exists company_partners_prototype_all on company_partners;

create policy companies_prototype_all
on companies
for all
using (true)
with check (true);

create policy company_partners_prototype_all
on company_partners
for all
using (true)
with check (true);

