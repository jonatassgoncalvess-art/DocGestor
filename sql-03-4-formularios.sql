-- DocGestor by Carminatti
-- Modulo 03.4 - Formularios
-- Registra o modulo em app_modules sem apagar dados existentes.

create extension if not exists "pgcrypto";

create table if not exists app_modules (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  parent_code text,
  display_order numeric,
  is_admin_area boolean not null default false,
  is_active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_modules add column if not exists code text;
alter table app_modules add column if not exists name text;
alter table app_modules add column if not exists parent_code text;
alter table app_modules add column if not exists display_order numeric;
alter table app_modules add column if not exists is_admin_area boolean not null default false;
alter table app_modules add column if not exists is_active boolean not null default true;
alter table app_modules add column if not exists status text not null default 'active';
alter table app_modules add column if not exists updated_at timestamptz not null default now();

create unique index if not exists app_modules_code_unique_idx on app_modules(code);

insert into app_modules (code, name, parent_code, display_order, is_admin_area, is_active, status)
values ('forms', '03.4 Formulários', '03', 3.4, false, true, 'active')
on conflict (code) do update set
  name = excluded.name,
  parent_code = excluded.parent_code,
  display_order = excluded.display_order,
  is_admin_area = excluded.is_admin_area,
  is_active = excluded.is_active,
  status = excluded.status,
  updated_at = now();

notify pgrst, 'reload schema';
