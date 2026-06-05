-- DocGestor by Carminatti
-- SQL completo da tabela environmental_licenses
-- Ambiente: 03.1 Licenças Ambientais
--
-- Execute no SQL Editor do Supabase.
-- Este script é idempotente: pode ser executado mais de uma vez.
-- Objetivo:
-- 1. Garantir a estrutura atual usada pelo sistema.
-- 2. Corrigir colunas legadas obrigatórias que causam erro ao salvar processos.
-- 3. Não apagar dados existentes.

create extension if not exists pgcrypto;

create table if not exists environmental_licenses (
  id uuid primary key default gen_random_uuid()
);

-- Identificação e vínculos principais
alter table environmental_licenses add column if not exists organization_id uuid;
alter table environmental_licenses add column if not exists enterprise_id uuid;
alter table environmental_licenses add column if not exists company_id uuid;
alter table environmental_licenses add column if not exists branch_id uuid;
alter table environmental_licenses add column if not exists property_id uuid;
alter table environmental_licenses add column if not exists responsible_partner_id uuid;
alter table environmental_licenses add column if not exists license_type_id uuid;
alter table environmental_licenses add column if not exists license_type text;
alter table environmental_licenses add column if not exists checklist_model_id uuid;

-- Campos atuais do processo/licença
alter table environmental_licenses add column if not exists process_number text;
alter table environmental_licenses add column if not exists license_number text;
alter table environmental_licenses add column if not exists environmental_agency text;
alter table environmental_licenses add column if not exists issue_date date;
alter table environmental_licenses add column if not exists expiration_date date;
alter table environmental_licenses add column if not exists expiry_date date;
alter table environmental_licenses add column if not exists renewal_recommended_at date;
alter table environmental_licenses add column if not exists process_due_alert_time time not null default '09:00';
alter table environmental_licenses add column if not exists status text not null default 'Planejado';
alter table environmental_licenses add column if not exists risk_level text;
alter table environmental_licenses add column if not exists progress_percent numeric(5,2) not null default 0;
alter table environmental_licenses add column if not exists notes text;

-- Campos operacionais úteis para o módulo ambiental
alter table environmental_licenses add column if not exists licensing_format text;
alter table environmental_licenses add column if not exists licensing_format_label text;
alter table environmental_licenses add column if not exists current_stage_number integer not null default 1;
alter table environmental_licenses add column if not exists current_block_number integer not null default 1;
alter table environmental_licenses add column if not exists acquisition_due_date date;
alter table environmental_licenses add column if not exists acquisition_alert_time time not null default '09:00';
alter table environmental_licenses add column if not exists completed_at timestamptz;

-- Colunas legadas: mantidas para compatibilidade, mas sem travar cadastro
alter table environmental_licenses add column if not exists process_id uuid;
alter table environmental_licenses add column if not exists process_internal_number text;
alter table environmental_licenses add column if not exists stage_number integer;
alter table environmental_licenses add column if not exists stage_name text;
alter table environmental_licenses add column if not exists block_number integer;
alter table environmental_licenses add column if not exists stage_kind text;

-- Auditoria
alter table environmental_licenses add column if not exists created_at timestamptz not null default now();
alter table environmental_licenses add column if not exists updated_at timestamptz not null default now();

-- Normalização de dados existentes
do $$
declare
  process_id_type text;
begin
  select data_type
    into process_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'environmental_licenses'
    and column_name = 'process_id';

  if process_id_type = 'uuid' then
    update environmental_licenses
    set process_id = id
    where process_id is null
      and id is not null;

    alter table environmental_licenses alter column process_id set default gen_random_uuid();
  else
    update environmental_licenses
    set process_id = id::text
    where process_id is null
      and id is not null;

    alter table environmental_licenses alter column process_id set default gen_random_uuid()::text;
  end if;
end $$;

update environmental_licenses
set process_internal_number = process_number
where (process_internal_number is null or process_internal_number = '')
  and process_number is not null;

update environmental_licenses
set process_number = process_internal_number
where (process_number is null or process_number = '')
  and process_internal_number is not null;

update environmental_licenses
set stage_number = coalesce(current_stage_number, 1)
where stage_number is null;

update environmental_licenses
set block_number = coalesce(current_block_number, 1)
where block_number is null;

update environmental_licenses
set stage_kind = 'checklist'
where stage_kind is null or stage_kind = '';

update environmental_licenses
set license_type = coalesce(license_number, process_number, 'Licença ambiental')
where license_type is null or license_type = '';

update environmental_licenses
set acquisition_due_date = expiration_date
where acquisition_due_date is null
  and license_number is null
  and expiration_date is not null;

update environmental_licenses
set expiry_date = expiration_date
where expiry_date is null
  and expiration_date is not null;

update environmental_licenses
set expiration_date = expiry_date
where expiration_date is null
  and expiry_date is not null;

-- Remove obrigatoriedades antigas que impedem salvar processo novo.
-- O sistema atual grava etapas detalhadas em environmental_process_stage_deadlines.
alter table environmental_licenses alter column process_id drop not null;
alter table environmental_licenses alter column process_internal_number drop not null;
alter table environmental_licenses alter column stage_number drop not null;
alter table environmental_licenses alter column stage_name drop not null;
alter table environmental_licenses alter column block_number drop not null;
alter table environmental_licenses alter column stage_kind drop not null;
alter table environmental_licenses alter column license_type drop not null;
alter table environmental_licenses alter column license_type_id drop not null;
alter table environmental_licenses alter column checklist_model_id drop not null;
alter table environmental_licenses alter column environmental_agency drop not null;
alter table environmental_licenses alter column license_number drop not null;
alter table environmental_licenses alter column issue_date drop not null;
alter table environmental_licenses alter column expiration_date drop not null;
alter table environmental_licenses alter column expiry_date drop not null;
alter table environmental_licenses alter column renewal_recommended_at drop not null;
alter table environmental_licenses alter column risk_level drop not null;
alter table environmental_licenses alter column notes drop not null;

-- Defaults de segurança para colunas legadas e atuais
alter table environmental_licenses alter column stage_number set default 1;
alter table environmental_licenses alter column block_number set default 1;
alter table environmental_licenses alter column stage_kind set default 'checklist';
alter table environmental_licenses alter column license_type set default 'Licença ambiental';
alter table environmental_licenses alter column current_stage_number set default 1;
alter table environmental_licenses alter column current_block_number set default 1;
alter table environmental_licenses alter column process_due_alert_time set default '09:00';
alter table environmental_licenses alter column acquisition_alert_time set default '09:00';
alter table environmental_licenses alter column status set default 'Planejado';
alter table environmental_licenses alter column progress_percent set default 0;
alter table environmental_licenses alter column created_at set default now();
alter table environmental_licenses alter column updated_at set default now();

-- Índices principais
create index if not exists idx_environmental_licenses_organization on environmental_licenses(organization_id);
create index if not exists idx_environmental_licenses_enterprise on environmental_licenses(enterprise_id);
create index if not exists idx_environmental_licenses_company on environmental_licenses(company_id);
create index if not exists idx_environmental_licenses_property on environmental_licenses(property_id);
create index if not exists idx_environmental_licenses_license_type on environmental_licenses(license_type_id);
create index if not exists idx_environmental_licenses_process_number on environmental_licenses(process_number);
create index if not exists idx_environmental_licenses_process_internal_number on environmental_licenses(process_internal_number);
create index if not exists idx_environmental_licenses_process_id on environmental_licenses(process_id);
create index if not exists idx_environmental_licenses_expiration on environmental_licenses(expiration_date);
create index if not exists idx_environmental_licenses_status on environmental_licenses(status);

-- RLS para o protótipo atual
alter table environmental_licenses enable row level security;

drop policy if exists environmental_licenses_prototype_all on environmental_licenses;
create policy environmental_licenses_prototype_all
on environmental_licenses
for all
using (true)
with check (true);
