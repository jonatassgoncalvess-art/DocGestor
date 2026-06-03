-- DocGestor by Carminatti - Regras de alertas do modulo 03.1 Licencas Ambientais
-- Execute no SQL Editor do Supabase depois dos SQLs de cadastros, 01.4 e 03.1.

create extension if not exists "pgcrypto";

create table if not exists agenda_events (
  id uuid primary key default gen_random_uuid(),
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

alter table agenda_events add column if not exists module_id text;
alter table agenda_events add column if not exists status text not null default 'waiting';
alter table agenda_events add column if not exists related_type text;
alter table agenda_events add column if not exists related_id uuid;

create table if not exists environmental_process_stage_deadlines (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null,
  stage_number integer not null,
  stage_name text not null,
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
  updated_at timestamptz not null default now(),
  constraint environmental_stage_deadlines_unique unique (process_id, stage_number)
);

alter table environmental_process_stage_deadlines add column if not exists warning_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists emergency_days integer not null default 3;
alter table environmental_process_stage_deadlines add column if not exists emergency_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists critical_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists renewal_days integer not null default 120;
alter table environmental_process_stage_deadlines add column if not exists renewal_time time not null default '09:00';
alter table environmental_process_stage_deadlines add column if not exists deadline_time time not null default '09:00';

create table if not exists alert_history (
  id uuid primary key default gen_random_uuid(),
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

create table if not exists alert_queue (
  id uuid primary key default gen_random_uuid(),
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

alter table alert_queue alter column related_id drop not null;
alter table alert_history add column if not exists recipient_id uuid;
alter table alert_history add column if not exists module_id text;
alter table alert_history add column if not exists related_type text;
alter table alert_history add column if not exists related_id uuid;
alter table alert_history add column if not exists related_label text;
alter table alert_history add column if not exists sender_email text;
alter table alert_history add column if not exists recipient_emails text[] not null default '{}'::text[];
alter table alert_history add column if not exists sent_at timestamptz;
alter table alert_history add column if not exists last_event_at timestamptz;
alter table alert_history add column if not exists status_label text not null default 'Aguardando';
alter table alert_history add column if not exists raw_payload jsonb not null default '{}'::jsonb;
alter table environmental_licenses add column if not exists process_due_alert_time time not null default '09:00';

create index if not exists idx_agenda_events_date on agenda_events(event_date, event_time);
create index if not exists idx_agenda_events_module on agenda_events(module_id);
create index if not exists idx_environmental_stage_deadlines_process on environmental_process_stage_deadlines(process_id);
create index if not exists idx_environmental_stage_deadlines_validity on environmental_process_stage_deadlines(validity_date);
create index if not exists idx_environmental_stage_deadlines_status on environmental_process_stage_deadlines(status);

create or replace function set_updated_at()
returns trigger
as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_agenda_events_updated_at on agenda_events;
create trigger trg_agenda_events_updated_at
before update on agenda_events
for each row execute function set_updated_at();

drop trigger if exists trg_environmental_stage_deadlines_updated_at on environmental_process_stage_deadlines;
create trigger trg_environmental_stage_deadlines_updated_at
before update on environmental_process_stage_deadlines
for each row execute function set_updated_at();

alter table agenda_events enable row level security;
alter table environmental_process_stage_deadlines enable row level security;

drop policy if exists agenda_events_prototype_all on agenda_events;
create policy agenda_events_prototype_all on agenda_events for all using (true) with check (true);

drop policy if exists environmental_stage_deadlines_prototype_all on environmental_process_stage_deadlines;
create policy environmental_stage_deadlines_prototype_all on environmental_process_stage_deadlines for all using (true) with check (true);
