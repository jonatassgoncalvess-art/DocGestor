-- DocGestor by Carminatti
-- Correção do módulo 03.3 Lembretes Diversos na fila de alertas.
-- Execute no SQL Editor do Supabase se os lembretes não aparecerem no 01.4.3.

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
    insert into app_modules (code, name, parent_code, display_order, is_admin_area, is_active, status)
    values ('diverse-documents', '03.3 Lembretes Diversos', '03', 3.3, false, true, 'active')
    on conflict (code) do update
    set name = excluded.name,
        parent_code = excluded.parent_code,
        display_order = excluded.display_order,
        is_admin_area = excluded.is_admin_area,
        is_active = excluded.is_active,
        status = excluded.status;
  else
    if exists (select 1 from app_modules where id = 'diverse-documents') then
      update app_modules
      set code = 'diverse-documents',
          name = '03.3 Lembretes Diversos',
          parent_code = '03',
          display_order = 3.3,
          is_admin_area = false,
          is_active = true,
          status = 'active'
      where id = 'diverse-documents';
    else
      update app_modules
      set code = coalesce(code, id) || '-legacy'
      where code = 'diverse-documents';

      insert into app_modules (id, code, name, parent_code, display_order, is_admin_area, is_active, status)
      values ('diverse-documents', 'diverse-documents', '03.3 Lembretes Diversos', '03', 3.3, false, true, 'active');
    end if;
  end if;
end;
$$;

create index if not exists idx_alert_queue_module_status
on alert_queue(module_id, status, scheduled_for);

create index if not exists idx_alert_history_module_status
on alert_history(module_id, status, created_at desc);
