-- DocGestor Exprt - 01.2.1 Socios
-- Execute este bloco no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  exclusive_label text,
  status text not null default 'Ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  constraint partners_document_by_organization_unique unique (organization_id, document),
  constraint partners_status_check check (status in ('Ativo', 'Inativo')),
  constraint partners_role_check check (role in ('Sócio', 'Sócio administrador', 'Procurador', 'Responsável legal', 'Socio', 'Socio administrador', 'Responsavel legal'))
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists partners_set_updated_at on partners;

create trigger partners_set_updated_at
before update on partners
for each row
execute function set_updated_at();

alter table organizations enable row level security;
alter table partners enable row level security;

drop policy if exists organizations_prototype_all on organizations;
drop policy if exists partners_prototype_all on partners;

create policy organizations_prototype_all
on organizations
for all
using (true)
with check (true);

create policy partners_prototype_all
on partners
for all
using (true)
with check (true);
