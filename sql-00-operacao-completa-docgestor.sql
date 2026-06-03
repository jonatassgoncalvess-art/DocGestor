-- DocGestor by Carminatti - SQL operacional completo
-- Use este arquivo para deixar o Supabase pronto para tudo que ja esta em producao.
-- Nao apaga dados. Nao implementa operacao dos modulos 03.2 IPTU e 03.3 Documentos Diversos.

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exclusive_label text,
  status text not null default 'Ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table organizations add column if not exists exclusive_label text;
alter table organizations add column if not exists status text not null default 'Ativa';
alter table organizations add column if not exists created_at timestamptz not null default now();
alter table organizations add column if not exists updated_at timestamptz not null default now();

insert into organizations (name, exclusive_label, status)
select 'Grupo Carminatti', 'DocGestor', 'Ativa'
where not exists (select 1 from organizations);

create table if not exists app_modules (
  id text primary key default gen_random_uuid()::text,
  code text,
  name text not null,
  parent_code text,
  display_order numeric,
  is_admin_area boolean not null default false,
  is_active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_modules add column if not exists code text;
alter table app_modules add column if not exists parent_code text;
alter table app_modules add column if not exists display_order numeric;
alter table app_modules add column if not exists is_admin_area boolean not null default false;
alter table app_modules add column if not exists is_active boolean not null default true;
alter table app_modules add column if not exists status text not null default 'active';
alter table app_modules add column if not exists updated_at timestamptz not null default now();

do $$
declare
  id_type text;
begin
  select data_type into id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'app_modules'
    and column_name = 'id';

  if id_type = 'uuid' then
    execute 'alter table app_modules alter column id set default gen_random_uuid()';
  else
    execute 'alter table app_modules alter column id set default gen_random_uuid()::text';
  end if;
end;
$$;

create unique index if not exists app_modules_code_unique_idx on app_modules(code);

insert into app_modules (code, name, parent_code, display_order, is_admin_area, is_active, status)
values
  ('environmental', '03.1 Licenças Ambientais', '03', 3.1, false, true, 'active'),
  ('iptu', '03.2 IPTU', '03', 3.2, false, true, 'development'),
  ('diverse-documents', '03.3 Documentos Diversos', '03', 3.3, false, true, 'development')
on conflict (code) do update set
  name = excluded.name,
  parent_code = excluded.parent_code,
  display_order = excluded.display_order,
  is_admin_area = excluded.is_admin_area,
  is_active = excluded.is_active,
  status = excluded.status;

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  document text,
  role text,
  contact text,
  phone text,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  kind text not null default 'matrix',
  parent_id uuid,
  name text not null,
  cnpj text,
  trade_name text,
  status text not null default 'Ativa',
  show_branches boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table companies add column if not exists show_branches boolean not null default true;

create table if not exists company_partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  partner_id uuid not null,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  owner_type text not null,
  owner_partner_id uuid,
  owner_company_id uuid,
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
  legal_reserve_m2 numeric(14,2),
  app_area_m2 numeric(14,2),
  use_type text,
  has_construction boolean not null default false,
  construction_area_m2 numeric(14,2) not null default 0,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coalesce(urban_area_m2, 0) >= 0),
  check (coalesce(rural_area_m2, 0) >= 0),
  check (coalesce(legal_reserve_m2, 0) >= 0),
  check (coalesce(app_area_m2, 0) >= 0),
  check (coalesce(construction_area_m2, 0) >= 0)
);

alter table properties add column if not exists reference text;
alter table properties add column if not exists car_number text;
alter table properties add column if not exists ccir_incra_number text;
alter table properties add column if not exists urban_property_registration text;

create table if not exists enterprises (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  company_id uuid,
  property_id uuid,
  type text,
  status text not null default 'Planejado',
  responsible_partner_id uuid,
  reference text,
  potential_polluter boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table enterprises add column if not exists reference text;
alter table enterprises add column if not exists potential_polluter boolean not null default false;

create table if not exists enterprise_modules (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null,
  module_id text not null default 'environmental',
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  company_id uuid,
  name text not null,
  cnae text,
  ctf_app boolean not null default false,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity_enterprises (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null,
  enterprise_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  email text not null,
  phone text,
  cpf text,
  role_title text,
  company_id uuid,
  branch_id uuid,
  profile text not null default 'Consulta',
  status text not null default 'Ativo',
  password text not null default '123456',
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_users add column if not exists permissions text[] not null default '{}';
alter table app_users add column if not exists password text not null default '123456';
alter table app_users add column if not exists status text not null default 'Ativo';

create table if not exists environmental_license_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  code text,
  validity text,
  renewal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists environmental_license_type_phases (
  id uuid primary key default gen_random_uuid(),
  license_type_id uuid not null,
  phase text not null,
  created_at timestamptz not null default now()
);

create table if not exists environmental_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  expiration text,
  required text,
  document_parameters text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table environmental_documents add column if not exists document_parameters text;

create table if not exists environmental_document_license_types (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  license_type_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists environmental_checklist_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  license_type_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists environmental_checklist_model_documents (
  id uuid primary key default gen_random_uuid(),
  checklist_model_id uuid not null,
  document_id uuid not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists environmental_licenses (
  id uuid primary key default gen_random_uuid()
);

alter table environmental_licenses add column if not exists organization_id uuid;
alter table environmental_licenses add column if not exists enterprise_id uuid;
alter table environmental_licenses add column if not exists company_id uuid;
alter table environmental_licenses add column if not exists branch_id uuid;
alter table environmental_licenses add column if not exists property_id uuid;
alter table environmental_licenses add column if not exists responsible_partner_id uuid;
alter table environmental_licenses add column if not exists license_type_id uuid;
alter table environmental_licenses add column if not exists checklist_model_id uuid;
alter table environmental_licenses add column if not exists environmental_agency text;
alter table environmental_licenses add column if not exists license_number text;
alter table environmental_licenses add column if not exists process_number text;
alter table environmental_licenses add column if not exists issue_date date;
alter table environmental_licenses add column if not exists expiration_date date;
alter table environmental_licenses add column if not exists renewal_recommended_at date;
alter table environmental_licenses add column if not exists status text not null default 'Planejado';
alter table environmental_licenses add column if not exists risk_level text;
alter table environmental_licenses add column if not exists progress_percent numeric(5,2) not null default 0;
alter table environmental_licenses add column if not exists notes text;
alter table environmental_licenses add column if not exists process_due_alert_time time not null default '09:00';
alter table environmental_licenses add column if not exists created_at timestamptz not null default now();
alter table environmental_licenses add column if not exists updated_at timestamptz not null default now();

create table if not exists environmental_process_stage_deadlines (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null,
  stage_number integer not null,
  stage_name text not null,
  block_number integer not null default 1,
  stage_kind text not null default 'checklist',
  validity_date date,
  warning_days integer not null default 60,
  warning_time time not null default '09:00',
  critical_days integer not null default 15,
  critical_time time not null default '09:00',
  emergency_days integer not null default 3,
  emergency_time time not null default '09:00',
  renewal_days integer not null default 120,
  renewal_time time not null default '09:00',
  deadline_time time not null default '09:00',
  status text not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agenda_events (
  id uuid primary key default gen_random_uuid(),
  alert_key text,
  event_date date not null,
  event_time time not null default '09:00',
  title text not null,
  description text,
  module_id text,
  status text not null default 'waiting',
  related_type text,
  related_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table agenda_events add column if not exists alert_key text;

create table if not exists alert_recipients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  relation text,
  status text not null default 'active',
  require_read_confirmation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists alert_recipient_modules (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  module_id text not null default 'environmental',
  created_at timestamptz not null default now()
);

create table if not exists alert_queue (
  id uuid primary key default gen_random_uuid(),
  alert_key text,
  module_id text not null default 'environmental',
  recipient_id uuid,
  related_type text not null,
  related_id uuid,
  related_label text,
  subject text not null,
  message_html text not null,
  status text not null default 'pending',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  resend_email_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table alert_queue add column if not exists alert_key text;
alter table alert_queue alter column related_id drop not null;

create table if not exists alert_history (
  id uuid primary key default gen_random_uuid(),
  alert_key text,
  resend_email_id text unique,
  recipient_id uuid,
  module_id text,
  subject text,
  sender_email text,
  recipient_emails text[] not null default '{}',
  status text not null default 'waiting',
  status_label text not null default 'Aguardando',
  related_type text,
  related_id uuid,
  related_label text,
  sent_at timestamptz,
  last_event_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table alert_history add column if not exists alert_key text;

create table if not exists system_email_configs (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null default 'DocGestor by Carminatti',
  sender_email text not null default 'docgestor@systemdirect.org',
  authorized_domain text not null default 'systemdirect.org',
  provider text not null default 'Resend',
  host text,
  port integer,
  username_or_key text,
  status text not null default 'Aguardando validação',
  last_test_at text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists system_backup_configs (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default false,
  frequency text not null default 'daily',
  backup_time time not null default '02:00',
  retention_days integer not null default 90,
  weekday integer not null default 1,
  monthday integer not null default 1,
  provider text not null default 'supabase',
  destination text,
  status text not null default 'Configurado',
  last_backup_at timestamptz,
  next_backup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partners_organization on partners(organization_id);
create index if not exists idx_companies_organization on companies(organization_id);
create index if not exists idx_companies_parent on companies(parent_id);
create index if not exists idx_properties_owner_partner on properties(owner_partner_id);
create index if not exists idx_properties_owner_company on properties(owner_company_id);
create index if not exists idx_enterprises_company on enterprises(company_id);
create index if not exists idx_enterprises_property on enterprises(property_id);
create index if not exists idx_activities_company on activities(company_id);
create index if not exists idx_environmental_licenses_process_number on environmental_licenses(process_number);
create index if not exists idx_environmental_licenses_expiration on environmental_licenses(expiration_date);
create index if not exists idx_environmental_stage_deadlines_process on environmental_process_stage_deadlines(process_id);
create index if not exists idx_agenda_events_date on agenda_events(event_date, event_time);
create index if not exists idx_alert_queue_due_status on alert_queue(status, scheduled_for);
create index if not exists idx_alert_queue_alert_key on alert_queue(alert_key);
create index if not exists idx_alert_history_created_at on alert_history(created_at desc);
create index if not exists idx_alert_history_alert_key on alert_history(alert_key);

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
    'properties',
    'enterprises',
    'enterprise_modules',
    'activities',
    'activity_enterprises',
    'app_users',
    'environmental_license_types',
    'environmental_license_type_phases',
    'environmental_documents',
    'environmental_document_license_types',
    'environmental_checklist_models',
    'environmental_checklist_model_documents',
    'environmental_licenses',
    'environmental_process_stage_deadlines',
    'agenda_events',
    'alert_recipients',
    'alert_recipient_modules',
    'alert_queue',
    'alert_history',
    'system_email_configs',
    'system_backup_configs'
  ] loop
    execute format('alter table %I enable row level security', table_name);
    execute format('drop policy if exists %I on %I', table_name || '_prototype_all', table_name);
    execute format('create policy %I on %I for all using (true) with check (true)', table_name || '_prototype_all', table_name);
  end loop;
end;
$$;
