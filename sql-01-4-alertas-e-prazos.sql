-- DocGestor by Carminatti - Alertas, historico e prazos ambientais
-- Execute no SQL Editor do Supabase depois dos SQLs 01.1, 01.2.*, 01.3.* e 03.1.

create extension if not exists "pgcrypto";

create table if not exists app_modules (
  id text primary key,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

insert into app_modules (id, name)
values ('environmental', '03.1 Licenças Ambientais')
on conflict (id) do update set
  name = excluded.name,
  status = 'active';

create table if not exists alert_recipients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  relation text,
  status text not null default 'active',
  require_read_confirmation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alert_recipients_email_check check (
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  )
);

create table if not exists alert_recipient_modules (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references alert_recipients(id) on delete cascade,
  module_id text not null references app_modules(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint alert_recipient_modules_unique unique (recipient_id, module_id)
);

create table if not exists alert_history (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text unique,
  recipient_id uuid references alert_recipients(id) on delete set null,
  module_id text references app_modules(id) on delete set null,
  subject text,
  sender_email text,
  recipient_emails text[] not null default '{}',
  status text not null default 'sent',
  status_label text not null default 'Enviado',
  related_type text,
  related_id uuid,
  related_label text,
  sent_at timestamptz,
  last_event_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table alert_history add column if not exists module_id text;
alter table alert_history add column if not exists recipient_id uuid;
alter table alert_history add column if not exists related_type text;
alter table alert_history add column if not exists related_id uuid;
alter table alert_history add column if not exists related_label text;
alter table alert_history add column if not exists raw_payload jsonb not null default '{}'::jsonb;

create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references app_modules(id) on delete cascade,
  name text not null,
  event_type text not null,
  enabled boolean not null default true,
  warning_days integer not null default 60,
  critical_days integer not null default 15,
  send_to_module_recipients boolean not null default true,
  require_read_confirmation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into alert_rules (module_id, name, event_type, warning_days, critical_days)
values
  ('environmental', 'Aviso de vencimento ambiental', 'vencimento', 60, 15),
  ('environmental', 'Aviso de agendamento ambiental', 'agendamento', 7, 1),
  ('environmental', 'Aviso de etapa do processo ambiental', 'etapa_processo', 60, 15),
  ('environmental', 'Aviso de vencimento de licença ambiental', 'licenca', 60, 15)
on conflict do nothing;

create table if not exists environmental_process_stage_deadlines (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null,
  stage_number integer not null,
  stage_name text not null,
  validity_date date,
  warning_days integer not null default 60,
  critical_days integer not null default 15,
  status text not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint environmental_stage_deadlines_unique unique (process_id, stage_number),
  constraint environmental_stage_deadlines_status_check check (
    status in ('open', 'warning', 'critical', 'expired', 'completed')
  )
);

create table if not exists alert_queue (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references app_modules(id) on delete cascade,
  recipient_id uuid references alert_recipients(id) on delete cascade,
  related_type text not null,
  related_id uuid not null,
  related_label text,
  subject text not null,
  message_html text not null,
  status text not null default 'pending',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  resend_email_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alert_queue_status_check check (
    status in ('pending', 'sent', 'failed', 'cancelled')
  )
);

create index if not exists idx_alert_recipients_email on alert_recipients(email);
create index if not exists idx_alert_recipient_modules_module on alert_recipient_modules(module_id);
create index if not exists idx_alert_history_status on alert_history(status);
create index if not exists idx_alert_history_module on alert_history(module_id);
create index if not exists idx_alert_history_sent_at on alert_history(sent_at desc);
create index if not exists idx_environmental_stage_deadlines_process on environmental_process_stage_deadlines(process_id);
create index if not exists idx_environmental_stage_deadlines_validity on environmental_process_stage_deadlines(validity_date);
create index if not exists idx_environmental_stage_deadlines_status on environmental_process_stage_deadlines(status);
create index if not exists idx_alert_queue_status on alert_queue(status, scheduled_for);
create index if not exists idx_alert_queue_module on alert_queue(module_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_alert_recipients_updated_at on alert_recipients;
create trigger trg_alert_recipients_updated_at
before update on alert_recipients
for each row execute function set_updated_at();

drop trigger if exists trg_alert_history_updated_at on alert_history;
create trigger trg_alert_history_updated_at
before update on alert_history
for each row execute function set_updated_at();

drop trigger if exists trg_alert_rules_updated_at on alert_rules;
create trigger trg_alert_rules_updated_at
before update on alert_rules
for each row execute function set_updated_at();

drop trigger if exists trg_environmental_stage_deadlines_updated_at on environmental_process_stage_deadlines;
create trigger trg_environmental_stage_deadlines_updated_at
before update on environmental_process_stage_deadlines
for each row execute function set_updated_at();

drop trigger if exists trg_alert_queue_updated_at on alert_queue;
create trigger trg_alert_queue_updated_at
before update on alert_queue
for each row execute function set_updated_at();

alter table app_modules enable row level security;
alter table alert_recipients enable row level security;
alter table alert_recipient_modules enable row level security;
alter table alert_history enable row level security;
alter table alert_rules enable row level security;
alter table environmental_process_stage_deadlines enable row level security;
alter table alert_queue enable row level security;

drop policy if exists app_modules_prototype_all on app_modules;
create policy app_modules_prototype_all on app_modules for all using (true) with check (true);

drop policy if exists alert_recipients_prototype_all on alert_recipients;
create policy alert_recipients_prototype_all on alert_recipients for all using (true) with check (true);

drop policy if exists alert_recipient_modules_prototype_all on alert_recipient_modules;
create policy alert_recipient_modules_prototype_all on alert_recipient_modules for all using (true) with check (true);

drop policy if exists alert_history_prototype_all on alert_history;
create policy alert_history_prototype_all on alert_history for all using (true) with check (true);

drop policy if exists alert_rules_prototype_all on alert_rules;
create policy alert_rules_prototype_all on alert_rules for all using (true) with check (true);

drop policy if exists environmental_process_stage_deadlines_prototype_all on environmental_process_stage_deadlines;
create policy environmental_process_stage_deadlines_prototype_all on environmental_process_stage_deadlines for all using (true) with check (true);

drop policy if exists alert_queue_prototype_all on alert_queue;
create policy alert_queue_prototype_all on alert_queue for all using (true) with check (true);
