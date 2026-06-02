-- DocGestor by Carminatti
-- Ambiente 01.5.1 Backup
-- Execute este SQL no Supabase para persistir a configuracao e o historico de backups.

create extension if not exists pgcrypto;

create table if not exists system_backup_configs (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default true,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'biweekly', 'monthly')),
  backup_time text not null default '02:00',
  retention_days integer not null default 90 check (retention_days > 0),
  weekday integer not null default 1 check (weekday between 0 and 6),
  monthday integer not null default 1 check (monthday between 1 and 28),
  provider text not null default 'supabase' check (provider in ('supabase', 'vercel-blob', 'google-drive', 'onedrive', 's3', 'backblaze')),
  destination text not null default 'docgestor-backups/ambiental',
  status text not null default 'Configurado',
  last_backup_at timestamptz,
  next_backup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists system_backup_runs (
  id uuid primary key default gen_random_uuid(),
  config_id uuid references system_backup_configs(id) on delete set null,
  provider text not null,
  destination text not null,
  file_name text,
  file_url text,
  status text not null default 'scheduled' check (status in ('scheduled', 'running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create or replace function set_system_backup_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_system_backup_configs_updated_at on system_backup_configs;
create trigger trg_system_backup_configs_updated_at
before update on system_backup_configs
for each row execute function set_system_backup_updated_at();

create index if not exists idx_system_backup_configs_updated_at on system_backup_configs(updated_at desc);
create index if not exists idx_system_backup_runs_started_at on system_backup_runs(started_at desc);
create index if not exists idx_system_backup_runs_status on system_backup_runs(status);

alter table system_backup_configs enable row level security;
alter table system_backup_runs enable row level security;

drop policy if exists "Allow public read system backup configs" on system_backup_configs;
create policy "Allow public read system backup configs"
on system_backup_configs for select
using (true);

drop policy if exists "Allow public insert system backup configs" on system_backup_configs;
create policy "Allow public insert system backup configs"
on system_backup_configs for insert
with check (true);

drop policy if exists "Allow public update system backup configs" on system_backup_configs;
create policy "Allow public update system backup configs"
on system_backup_configs for update
using (true)
with check (true);

drop policy if exists "Allow public read system backup runs" on system_backup_runs;
create policy "Allow public read system backup runs"
on system_backup_runs for select
using (true);

drop policy if exists "Allow public insert system backup runs" on system_backup_runs;
create policy "Allow public insert system backup runs"
on system_backup_runs for insert
with check (true);

insert into system_backup_configs (
  enabled,
  frequency,
  backup_time,
  retention_days,
  weekday,
  monthday,
  provider,
  destination,
  status
)
select
  true,
  'daily',
  '02:00',
  90,
  1,
  1,
  'supabase',
  'docgestor-backups/ambiental',
  'Configurado'
where not exists (select 1 from system_backup_configs);
