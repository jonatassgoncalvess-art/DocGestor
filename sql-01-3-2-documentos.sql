-- DocGestor Exprt - 01.3.2 Documentos
-- Execute este bloco depois do SQL 01.3.1 Tipos de Licencas.

create extension if not exists "pgcrypto";

create table if not exists environmental_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  expiration text not null default 'Nao',
  required text not null default 'Sim',
  document_parameters text,
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

create index if not exists environmental_documents_organization_id_idx
on environmental_documents(organization_id);

create index if not exists environmental_documents_name_idx
on environmental_documents(name);

create index if not exists environmental_document_license_types_document_id_idx
on environmental_document_license_types(document_id);

create index if not exists environmental_document_license_types_license_type_id_idx
on environmental_document_license_types(license_type_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists environmental_documents_set_updated_at on environmental_documents;

create trigger environmental_documents_set_updated_at
before update on environmental_documents
for each row
execute function set_updated_at();

alter table environmental_documents enable row level security;
alter table environmental_document_license_types enable row level security;

drop policy if exists environmental_documents_prototype_all on environmental_documents;
drop policy if exists environmental_document_license_types_prototype_all on environmental_document_license_types;

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
