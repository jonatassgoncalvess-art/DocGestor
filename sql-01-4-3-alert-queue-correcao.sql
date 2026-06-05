-- Correção complementar do ambiente 01.4.3 - Histórico/Fila de Alertas
-- Execute no SQL Editor do Supabase.
-- Este script é idempotente: pode rodar mais de uma vez sem apagar dados.

create extension if not exists pgcrypto;

create table if not exists alert_queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table alert_queue add column if not exists organization_id uuid;
alter table alert_queue add column if not exists alert_key text;
alter table alert_queue add column if not exists module_id text not null default 'environmental';
alter table alert_queue add column if not exists recipient_id uuid;
alter table alert_queue add column if not exists recipient_email text;
alter table alert_queue add column if not exists related_type text;
alter table alert_queue add column if not exists related_id uuid;
alter table alert_queue add column if not exists related_label text;
alter table alert_queue add column if not exists subject text not null default 'Alerta DocGestor';
alter table alert_queue add column if not exists message_html text not null default '<p>Alerta DocGestor</p>';
alter table alert_queue add column if not exists status text not null default 'pending';
alter table alert_queue add column if not exists scheduled_for timestamptz not null default now();
alter table alert_queue add column if not exists sent_at timestamptz;
alter table alert_queue add column if not exists resend_email_id text;
alter table alert_queue alter column related_id drop not null;

create table if not exists alert_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table alert_history add column if not exists alert_key text;
alter table alert_history add column if not exists recipient_id uuid;
alter table alert_history add column if not exists module_id text not null default 'environmental';
alter table alert_history add column if not exists subject text;
alter table alert_history add column if not exists sender_email text;
alter table alert_history add column if not exists recipient_emails text[] not null default '{}';
alter table alert_history add column if not exists status text not null default 'waiting';
alter table alert_history add column if not exists status_label text not null default 'Aguardando';
alter table alert_history add column if not exists related_type text;
alter table alert_history add column if not exists related_id uuid;
alter table alert_history add column if not exists related_label text;
alter table alert_history add column if not exists sent_at timestamptz;
alter table alert_history add column if not exists last_event_at timestamptz;
alter table alert_history add column if not exists resend_email_id text;
alter table alert_history add column if not exists raw_payload jsonb not null default '{}'::jsonb;

create index if not exists idx_alert_queue_due_status on alert_queue(status, scheduled_for);
create index if not exists idx_alert_queue_alert_key on alert_queue(alert_key);
create index if not exists idx_alert_history_alert_key on alert_history(alert_key);
create index if not exists idx_alert_history_status on alert_history(status);

update alert_queue
set status = 'pending'
where status in ('waiting', 'Aguardando');

update alert_history
set status_label = case
  when status = 'sent' then 'Enviado'
  when status = 'failed' then 'Falha'
  else 'Aguardando'
end
where status_label is null or status_label = '';
