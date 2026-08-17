-- DocGestor by Carminatti - 03 Modulos Operacionais
-- Registra os modulos exibidos em 03 Modulos e usados por alertas/vinculos.

create extension if not exists "pgcrypto";

create table if not exists app_modules (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text,
  parent_code text,
  display_order numeric,
  is_admin_area boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table app_modules add column if not exists code text;
alter table app_modules add column if not exists name text;
alter table app_modules add column if not exists parent_code text;
alter table app_modules add column if not exists display_order numeric;
alter table app_modules add column if not exists is_admin_area boolean not null default false;
alter table app_modules add column if not exists is_active boolean not null default true;
alter table app_modules add column if not exists created_at timestamptz not null default now();
alter table app_modules alter column id set default gen_random_uuid();

create unique index if not exists app_modules_code_unique_idx
on app_modules(code);

insert into app_modules (id, code, name, parent_code, display_order, is_admin_area, is_active)
values
  (gen_random_uuid(), 'environmental', '03.1 Licenças Ambientais', '03', 3.1, false, true),
  (gen_random_uuid(), 'iptu', '03.2 IPTU', '03', 3.2, false, true),
  (gen_random_uuid(), 'alvara', '03.3 Alvará', '03', 3.3, false, true),
  (gen_random_uuid(), 'bombeiros', '03.4 Bombeiros', '03', 3.4, false, true),
  (gen_random_uuid(), 'adapar', '03.5 ADAPAR', '03', 3.5, false, true),
  (gen_random_uuid(), 'renasem', '03.6 RENASEM', '03', 3.6, false, true),
  (gen_random_uuid(), 'ccir', '03.7 CCIR', '03', 3.7, false, true),
  (gen_random_uuid(), 'mapa', '03.8 MAPA', '03', 3.8, false, true),
  (gen_random_uuid(), 'diverse-documents', '03.9 Lembretes Diversos', '03', 3.9, false, true),
  (gen_random_uuid(), 'forms', '03.10 Formulários', '03', 3.10, false, true)
on conflict (code) do update
set
  name = excluded.name,
  parent_code = excluded.parent_code,
  display_order = excluded.display_order,
  is_admin_area = excluded.is_admin_area,
  is_active = excluded.is_active;
