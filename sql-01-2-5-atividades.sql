-- DocGestor by Carminatti - 01.2.5 Atividades
-- Execute depois dos SQLs 01.2.2 Empresas e Filiais e 01.2.4 Empreendimento.

create extension if not exists "pgcrypto";

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid not null references companies(id) on delete restrict,
  name text not null,
  cnae text,
  ctf_app boolean not null default false,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_name_by_company_unique unique (organization_id, company_id, name),
  constraint activities_status_check check (status in ('Ativo', 'Inativo'))
);

create table if not exists activity_enterprises (
  activity_id uuid not null references activities(id) on delete cascade,
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, enterprise_id)
);

create table if not exists activity_companies (
  activity_id uuid not null references activities(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, company_id)
);

create index if not exists activities_organization_id_idx on activities(organization_id);
create index if not exists activities_company_id_idx on activities(company_id);
create index if not exists activities_name_idx on activities(name);
create index if not exists activity_companies_activity_id_idx on activity_companies(activity_id);
create index if not exists activity_companies_company_id_idx on activity_companies(company_id);
create index if not exists activity_enterprises_activity_id_idx on activity_enterprises(activity_id);
create index if not exists activity_enterprises_enterprise_id_idx on activity_enterprises(enterprise_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists activities_set_updated_at on activities;

create trigger activities_set_updated_at
before update on activities
for each row
execute function set_updated_at();

alter table activities enable row level security;
alter table activity_companies enable row level security;
alter table activity_enterprises enable row level security;

drop policy if exists activities_prototype_all on activities;

create policy activities_prototype_all
on activities
for all
using (true)
with check (true);

drop policy if exists activity_companies_prototype_all on activity_companies;

create policy activity_companies_prototype_all
on activity_companies
for all
using (true)
with check (true);

drop policy if exists activity_enterprises_prototype_all on activity_enterprises;

create policy activity_enterprises_prototype_all
on activity_enterprises
for all
using (true)
with check (true);

notify pgrst, 'reload schema';
