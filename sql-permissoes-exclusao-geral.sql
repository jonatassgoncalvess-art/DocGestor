-- DocGestor by Carminatti
-- Permissões gerais de exclusão pelo sistema
-- Execute no Supabase SQL Editor.
-- Objetivo: permitir que os botões "Excluir" do sistema apaguem registros pela API pública do Supabase.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
grant select, insert, update, delete on tables to anon, authenticated;

alter default privileges in schema public
grant usage, select on sequences to anon, authenticated;

do $$
declare
  table_name text;
  table_names text[] := array[
    'organizations',
    'app_modules',
    'partners',
    'companies',
    'company_partners',
    'app_users',
    'user_permissions',
    'cities',
    'car_registries',
    'properties',
    'enterprises',
    'enterprise_modules',
    'enterprise_properties',
    'activities',
    'activity_companies',
    'activity_enterprises',
    'environmental_license_types',
    'environmental_license_type_phases',
    'environmental_documents',
    'environmental_document_license_types',
    'environmental_checklist_models',
    'environmental_checklist_model_documents',
    'environmental_licenses',
    'environmental_license_checklist_items',
    'environmental_conditions',
    'environmental_alerts',
    'environmental_process_stage_deadlines',
    'agenda_events',
    'alert_queue',
    'alert_history',
    'alert_recipients',
    'alert_recipient_modules',
    'system_email_configs',
    'system_backup_configs',
    'system_backup_runs',
    'alert_rules',
    'diverse_reminders',
    'form_authorizations'
  ];
begin
  foreach table_name in array table_names loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists docgestor_public_all on public.%I', table_name);
      execute format(
        'create policy docgestor_public_all on public.%I for all using (true) with check (true)',
        table_name
      );
    end if;
  end loop;
end $$;
