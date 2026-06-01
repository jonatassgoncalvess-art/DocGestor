-- DocGestor Exprt - 01.3 Ambiental
-- Inclui:
-- 01.3.1 Tipos de Licencas
-- 01.3.2 Documentos
-- 01.3.3 Modelos de Check-List
-- Execute este bloco depois dos SQLs 01.2.1 a 01.2.4.

create extension if not exists "pgcrypto";

create table if not exists environmental_license_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  validity text,
  renewal text,
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

create table if not exists environmental_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  expiration text not null default 'Nao',
  required text not null default 'Sim',
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint environmental_documents_name_by_organization_unique unique (organization_id, name),
  constraint environmental_documents_expiration_check check (expiration in ('Sim', 'Nao')),
  constraint environmental_documents_required_check check (required in ('Sim', 'Nao')),
  constraint environmental_documents_status_check check (status in ('Ativo', 'Inativo'))
);

create table if not exists environmental_document_license_types (
  document_id uuid not null references environmental_documents(id) on delete cascade,
  license_type_id uuid not null references environmental_license_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, license_type_id)
);

create table if not exists environmental_checklist_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  license_type_id uuid not null references environmental_license_types(id) on delete restrict,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint environmental_checklist_models_name_by_organization_unique unique (organization_id, name),
  constraint environmental_checklist_models_status_check check (status in ('Ativo', 'Inativo'))
);

create table if not exists environmental_checklist_model_documents (
  checklist_model_id uuid not null references environmental_checklist_models(id) on delete cascade,
  document_id uuid not null references environmental_documents(id) on delete restrict,
  display_order integer not null default 0,
  is_selected boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (checklist_model_id, document_id)
);

create index if not exists environmental_license_types_organization_id_idx
on environmental_license_types(organization_id);

create index if not exists environmental_documents_organization_id_idx
on environmental_documents(organization_id);

create index if not exists environmental_document_license_types_license_type_id_idx
on environmental_document_license_types(license_type_id);

create index if not exists environmental_checklist_models_organization_id_idx
on environmental_checklist_models(organization_id);

create index if not exists environmental_checklist_models_license_type_id_idx
on environmental_checklist_models(license_type_id);

create index if not exists environmental_checklist_model_documents_document_id_idx
on environmental_checklist_model_documents(document_id);

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

drop trigger if exists environmental_documents_set_updated_at on environmental_documents;

create trigger environmental_documents_set_updated_at
before update on environmental_documents
for each row
execute function set_updated_at();

drop trigger if exists environmental_checklist_models_set_updated_at on environmental_checklist_models;

create trigger environmental_checklist_models_set_updated_at
before update on environmental_checklist_models
for each row
execute function set_updated_at();

alter table environmental_license_types enable row level security;
alter table environmental_license_type_phases enable row level security;
alter table environmental_documents enable row level security;
alter table environmental_document_license_types enable row level security;
alter table environmental_checklist_models enable row level security;
alter table environmental_checklist_model_documents enable row level security;

drop policy if exists environmental_license_types_prototype_all on environmental_license_types;
drop policy if exists environmental_license_type_phases_prototype_all on environmental_license_type_phases;
drop policy if exists environmental_documents_prototype_all on environmental_documents;
drop policy if exists environmental_document_license_types_prototype_all on environmental_document_license_types;
drop policy if exists environmental_checklist_models_prototype_all on environmental_checklist_models;
drop policy if exists environmental_checklist_model_documents_prototype_all on environmental_checklist_model_documents;

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

create policy environmental_documents_prototype_all
on environmental_documents
for all
using (true)
with check (true);

create policy environmental_document_license_types_prototype_all
on environmental_document_license_types
for all
using (true)
with check (true);

create policy environmental_checklist_models_prototype_all
on environmental_checklist_models
for all
using (true)
with check (true);

create policy environmental_checklist_model_documents_prototype_all
on environmental_checklist_model_documents
for all
using (true)
with check (true);

