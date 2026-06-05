-- DocGestor by Carminatti
-- Módulo 03.3 - Lembretes Diversos

create extension if not exists pgcrypto;

alter table app_modules add column if not exists code text;
alter table app_modules add column if not exists name text;
alter table app_modules add column if not exists parent_code text;
alter table app_modules add column if not exists display_order numeric;
alter table app_modules add column if not exists is_admin_area boolean not null default false;
alter table app_modules add column if not exists is_active boolean not null default true;
alter table app_modules add column if not exists status text not null default 'active';

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

create unique index if not exists app_modules_code_unique_idx
on app_modules(code);

create table if not exists diverse_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  name text not null,
  company_id uuid,
  company_label text,
  alert_format integer not null default 1 check (alert_format between 1 and 4),
  alerts jsonb not null default '[]'::jsonb,
  repeat_enabled boolean not null default false,
  repeat_count integer not null default 1 check (repeat_count >= 1),
  repeat_interval_days integer not null default 30 check (repeat_interval_days >= 1),
  description text,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table diverse_reminders add column if not exists organization_id uuid;
alter table diverse_reminders add column if not exists company_id uuid;
alter table diverse_reminders add column if not exists company_label text;
alter table diverse_reminders add column if not exists alert_format integer not null default 1;
alter table diverse_reminders add column if not exists alerts jsonb not null default '[]'::jsonb;
alter table diverse_reminders add column if not exists repeat_enabled boolean not null default false;
alter table diverse_reminders add column if not exists repeat_count integer not null default 1;
alter table diverse_reminders add column if not exists repeat_interval_days integer not null default 30;
alter table diverse_reminders add column if not exists description text;
alter table diverse_reminders add column if not exists status text not null default 'pending';
alter table diverse_reminders add column if not exists created_at timestamptz not null default now();
alter table diverse_reminders add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_diverse_reminders_status
on diverse_reminders(status);

create index if not exists idx_diverse_reminders_company
on diverse_reminders(company_id);

create index if not exists idx_diverse_reminders_updated_at
on diverse_reminders(updated_at desc);

insert into app_modules (code, name, parent_code, display_order, is_admin_area, is_active, status)
values ('diverse-documents', '03.3 Lembretes Diversos', '03', 3.3, false, true, 'active')
on conflict (code) do update
set name = excluded.name,
    parent_code = excluded.parent_code,
    display_order = excluded.display_order,
    is_admin_area = excluded.is_admin_area,
    is_active = excluded.is_active,
    status = excluded.status;
