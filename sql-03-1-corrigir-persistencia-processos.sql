-- DocGestor by Carminatti - Correcao de persistencia do ambiente 03.1
-- Execute este SQL no Supabase se os processos ambientais somem ao atualizar a pagina.

create extension if not exists "pgcrypto";

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

create index if not exists idx_environmental_licenses_company on environmental_licenses(company_id);
create index if not exists idx_environmental_licenses_property on environmental_licenses(property_id);
create index if not exists idx_environmental_licenses_process_number on environmental_licenses(process_number);
create index if not exists idx_environmental_licenses_expiration on environmental_licenses(expiration_date);
create index if not exists idx_environmental_licenses_status on environmental_licenses(status);

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

alter table environmental_process_stage_deadlines add column if not exists block_number integer not null default 1;
alter table environmental_process_stage_deadlines add column if not exists stage_kind text not null default 'checklist';
alter table environmental_process_stage_deadlines add column if not exists warning_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists critical_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists emergency_days integer not null default 3;
alter table environmental_process_stage_deadlines add column if not exists emergency_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists renewal_days integer not null default 120;
alter table environmental_process_stage_deadlines add column if not exists renewal_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists deadline_time time not null default '09:00';

create index if not exists idx_alert_queue_due_status on alert_queue(status, scheduled_for);
create index if not exists idx_alert_queue_alert_key on alert_queue(alert_key);
create index if not exists idx_alert_history_alert_key on alert_history(alert_key);
create index if not exists idx_agenda_events_alert_key on agenda_events(alert_key);
create index if not exists idx_environmental_stage_deadlines_process on environmental_process_stage_deadlines(process_id);

alter table environmental_licenses enable row level security;
alter table agenda_events enable row level security;
alter table alert_queue enable row level security;
alter table alert_history enable row level security;
alter table environmental_process_stage_deadlines enable row level security;

drop policy if exists environmental_licenses_prototype_all on environmental_licenses;
create policy environmental_licenses_prototype_all on environmental_licenses for all using (true) with check (true);

drop policy if exists agenda_events_prototype_all on agenda_events;
create policy agenda_events_prototype_all on agenda_events for all using (true) with check (true);

drop policy if exists alert_queue_prototype_all on alert_queue;
create policy alert_queue_prototype_all on alert_queue for all using (true) with check (true);

drop policy if exists alert_history_prototype_all on alert_history;
create policy alert_history_prototype_all on alert_history for all using (true) with check (true);

drop policy if exists environmental_stage_deadlines_prototype_all on environmental_process_stage_deadlines;
create policy environmental_stage_deadlines_prototype_all on environmental_process_stage_deadlines for all using (true) with check (true);
