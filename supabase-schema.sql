-- DocGestor Exprt - Grupo Carminatti
-- Schema completo ate o modulo ambiental atual.
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

do $$ begin
  create type user_status as enum ('Ativo', 'Inativo', 'Bloqueado', 'Convite enviado', 'Senha pendente');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type company_kind as enum ('matrix', 'branch');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type property_owner_type as enum ('pf', 'pj');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type property_type as enum ('urban', 'rural');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type property_use as enum ('Residencia', 'Comercio', 'Lavoura', 'Empreendimento');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type license_phase as enum ('Monofasica', 'Bifasica', 'Trifasica');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type yes_no as enum ('Sim', 'Nao');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type process_status as enum ('Planejado', 'Em implantacao', 'Em analise', 'Ativo', 'Renovar', 'Critico', 'Encerrado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type checklist_status as enum ('Pendente', 'Anexado', 'Dispensado', 'Em analise', 'Aprovado', 'Reprovado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type condition_status as enum ('Pendente', 'Em dia', 'Atrasado', 'Concluido');
exception when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  exclusive_label text,
  status text not null default 'Ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_modules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  parent_code text,
  display_order numeric not null,
  is_admin_area boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  document text not null,
  role text not null,
  contact text,
  phone text,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, document)
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  kind company_kind not null,
  parent_id uuid references companies(id) on delete cascade,
  name text not null,
  cnpj text not null,
  trade_name text,
  status text not null default 'Ativa',
  show_branches boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, cnpj),
  check ((kind = 'matrix' and parent_id is null) or (kind = 'branch' and parent_id is not null))
);

create table if not exists company_partners (
  company_id uuid not null references companies(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (company_id, partner_id)
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid,
  name text not null,
  email text not null,
  phone text,
  cpf text,
  role_title text,
  company_id uuid references companies(id) on delete set null,
  branch_id uuid references companies(id) on delete set null,
  profile text not null,
  status user_status not null default 'Ativo',
  temporary_password text,
  password_reset_required boolean not null default false,
  last_password_reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email),
  unique (organization_id, cpf)
);

create table if not exists user_permissions (
  user_id uuid not null references app_users(id) on delete cascade,
  module_code text not null references app_modules(code) on delete cascade,
  can_view boolean not null default true,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, module_code)
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  owner_type property_owner_type not null,
  owner_partner_id uuid references partners(id) on delete restrict,
  owner_company_id uuid references companies(id) on delete restrict,
  type property_type not null,
  registration text not null,
  reference text,
  lot text,
  block text,
  glebe text,
  urban_area_m2 numeric(14,2),
  rural_area_m2 numeric(14,2),
  rural_area_ha numeric(14,4) generated always as (coalesce(rural_area_m2, 0) / 10000) stored,
  legal_reserve_m2 numeric(14,2),
  legal_reserve_ha numeric(14,4) generated always as (coalesce(legal_reserve_m2, 0) / 10000) stored,
  app_area_m2 numeric(14,2),
  app_area_ha numeric(14,4) generated always as (coalesce(app_area_m2, 0) / 10000) stored,
  use_type property_use,
  has_construction boolean not null default false,
  construction_area_m2 numeric(14,2),
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, registration),
  check ((owner_type = 'pf' and owner_partner_id is not null and owner_company_id is null) or (owner_type = 'pj' and owner_company_id is not null and owner_partner_id is null)),
  check ((type = 'urban' and block is not null and glebe is null) or (type = 'rural' and glebe is not null and block is null)),
  check (legal_reserve_m2 is null or rural_area_m2 is null or legal_reserve_m2 >= 0),
  check (app_area_m2 is null or app_area_m2 >= 0)
);

create table if not exists enterprises (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  company_id uuid not null references companies(id) on delete restrict,
  property_id uuid not null references properties(id) on delete restrict,
  type text,
  status process_status not null default 'Planejado',
  responsible_partner_id uuid references partners(id) on delete set null,
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists environmental_license_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  validity text,
  renewal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists environmental_license_type_phases (
  license_type_id uuid not null references environmental_license_types(id) on delete cascade,
  phase license_phase not null,
  primary key (license_type_id, phase)
);

create table if not exists environmental_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  expiration yes_no not null default 'Nao',
  required yes_no not null default 'Sim',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists environmental_document_license_types (
  document_id uuid not null references environmental_documents(id) on delete cascade,
  license_type_id uuid not null references environmental_license_types(id) on delete cascade,
  primary key (document_id, license_type_id)
);

create table if not exists environmental_checklist_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  license_type_id uuid not null references environmental_license_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists environmental_checklist_model_documents (
  checklist_model_id uuid not null references environmental_checklist_models(id) on delete cascade,
  document_id uuid not null references environmental_documents(id) on delete restrict,
  display_order int not null default 0,
  is_selected boolean not null default true,
  primary key (checklist_model_id, document_id)
);

create table if not exists environmental_licenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  enterprise_id uuid references enterprises(id) on delete set null,
  company_id uuid not null references companies(id) on delete restrict,
  branch_id uuid references companies(id) on delete set null,
  property_id uuid not null references properties(id) on delete restrict,
  responsible_partner_id uuid references partners(id) on delete set null,
  license_type_id uuid not null references environmental_license_types(id) on delete restrict,
  checklist_model_id uuid references environmental_checklist_models(id) on delete set null,
  environmental_agency text,
  license_number text,
  process_number text,
  issue_date date,
  expiration_date date,
  renewal_recommended_at date,
  status process_status not null default 'Planejado',
  risk_level text,
  progress_percent numeric(5,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (progress_percent >= 0 and progress_percent <= 100)
);

create table if not exists environmental_license_checklist_items (
  id uuid primary key default gen_random_uuid(),
  environmental_license_id uuid not null references environmental_licenses(id) on delete cascade,
  document_id uuid references environmental_documents(id) on delete set null,
  title text not null,
  source text,
  status checklist_status not null default 'Pendente',
  due_date date,
  attached_at timestamptz,
  file_url text,
  notes text,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists environmental_conditions (
  id uuid primary key default gen_random_uuid(),
  environmental_license_id uuid not null references environmental_licenses(id) on delete cascade,
  obligation text not null,
  due_date date,
  status condition_status not null default 'Pendente',
  responsible_user_id uuid references app_users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists environmental_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  environmental_license_id uuid references environmental_licenses(id) on delete cascade,
  title text not null,
  message text,
  alert_date date not null,
  status text not null default 'Pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_companies_parent_id on companies(parent_id);
create index if not exists idx_properties_owner_partner on properties(owner_partner_id);
create index if not exists idx_properties_owner_company on properties(owner_company_id);
create index if not exists idx_enterprises_company on enterprises(company_id);
create index if not exists idx_enterprises_property on enterprises(property_id);
create index if not exists idx_environmental_licenses_company on environmental_licenses(company_id);
create index if not exists idx_environmental_licenses_property on environmental_licenses(property_id);
create index if not exists idx_environmental_licenses_expiration on environmental_licenses(expiration_date);
create index if not exists idx_environmental_checklist_license on environmental_license_checklist_items(environmental_license_id);
create index if not exists idx_environmental_conditions_license on environmental_conditions(environmental_license_id);
create index if not exists idx_environmental_alerts_date on environmental_alerts(alert_date);

drop trigger if exists trg_organizations_updated_at on organizations;
create trigger trg_organizations_updated_at before update on organizations for each row execute function set_updated_at();

drop trigger if exists trg_partners_updated_at on partners;
create trigger trg_partners_updated_at before update on partners for each row execute function set_updated_at();

drop trigger if exists trg_companies_updated_at on companies;
create trigger trg_companies_updated_at before update on companies for each row execute function set_updated_at();

drop trigger if exists trg_app_users_updated_at on app_users;
create trigger trg_app_users_updated_at before update on app_users for each row execute function set_updated_at();

drop trigger if exists trg_user_permissions_updated_at on user_permissions;
create trigger trg_user_permissions_updated_at before update on user_permissions for each row execute function set_updated_at();

drop trigger if exists trg_properties_updated_at on properties;
create trigger trg_properties_updated_at before update on properties for each row execute function set_updated_at();

drop trigger if exists trg_enterprises_updated_at on enterprises;
create trigger trg_enterprises_updated_at before update on enterprises for each row execute function set_updated_at();

drop trigger if exists trg_environmental_license_types_updated_at on environmental_license_types;
create trigger trg_environmental_license_types_updated_at before update on environmental_license_types for each row execute function set_updated_at();

drop trigger if exists trg_environmental_documents_updated_at on environmental_documents;
create trigger trg_environmental_documents_updated_at before update on environmental_documents for each row execute function set_updated_at();

drop trigger if exists trg_environmental_checklist_models_updated_at on environmental_checklist_models;
create trigger trg_environmental_checklist_models_updated_at before update on environmental_checklist_models for each row execute function set_updated_at();

drop trigger if exists trg_environmental_licenses_updated_at on environmental_licenses;
create trigger trg_environmental_licenses_updated_at before update on environmental_licenses for each row execute function set_updated_at();

drop trigger if exists trg_environmental_license_checklist_items_updated_at on environmental_license_checklist_items;
create trigger trg_environmental_license_checklist_items_updated_at before update on environmental_license_checklist_items for each row execute function set_updated_at();

drop trigger if exists trg_environmental_conditions_updated_at on environmental_conditions;
create trigger trg_environmental_conditions_updated_at before update on environmental_conditions for each row execute function set_updated_at();

drop trigger if exists trg_environmental_alerts_updated_at on environmental_alerts;
create trigger trg_environmental_alerts_updated_at before update on environmental_alerts for each row execute function set_updated_at();

-- Os registros iniciais serao criados pelo proprio sistema quando conectarmos as telas ao banco.
-- Mantive este arquivo focado na estrutura para evitar erro de execucao parcial no SQL Editor.

-- Politicas iniciais para prototipo frontend com chave publishable.
-- Em producao, trocaremos por regras vinculadas ao auth.uid().
alter table organizations enable row level security;
alter table app_modules enable row level security;
alter table partners enable row level security;
alter table companies enable row level security;
alter table company_partners enable row level security;
alter table app_users enable row level security;
alter table user_permissions enable row level security;
alter table properties enable row level security;
alter table enterprises enable row level security;
alter table environmental_license_types enable row level security;
alter table environmental_license_type_phases enable row level security;
alter table environmental_documents enable row level security;
alter table environmental_document_license_types enable row level security;
alter table environmental_checklist_models enable row level security;
alter table environmental_checklist_model_documents enable row level security;
alter table environmental_licenses enable row level security;
alter table environmental_license_checklist_items enable row level security;
alter table environmental_conditions enable row level security;
alter table environmental_alerts enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations',
    'app_modules',
    'partners',
    'companies',
    'company_partners',
    'app_users',
    'user_permissions',
    'properties',
    'enterprises',
    'environmental_license_types',
    'environmental_license_type_phases',
    'environmental_documents',
    'environmental_document_license_types',
    'environmental_checklist_models',
    'environmental_checklist_model_documents',
    'environmental_licenses',
    'environmental_license_checklist_items',
    'environmental_conditions',
    'environmental_alerts'
  ]
  loop
    execute format('drop policy if exists "prototype_all_%1$s" on %1$I', table_name);
    execute format('create policy "prototype_all_%1$s" on %1$I for all using (true) with check (true)', table_name);
  end loop;
end $$;
