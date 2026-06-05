-- Correção do ambiente 03.1 - coluna legada process_id
-- Execute no SQL Editor do Supabase.
-- Motivo: algumas versões antigas da tabela environmental_licenses criaram
-- process_id como obrigatório, mas o sistema atual usa id como identificador.

create extension if not exists pgcrypto;

alter table environmental_licenses
  add column if not exists process_id uuid;

alter table environmental_licenses
  alter column process_id drop not null;

do $$
declare
  process_id_type text;
begin
  select data_type
    into process_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'environmental_licenses'
    and column_name = 'process_id';

  if process_id_type = 'uuid' then
    update environmental_licenses
    set process_id = id
    where process_id is null
      and id is not null;

    alter table environmental_licenses
      alter column process_id set default gen_random_uuid();
  else
    update environmental_licenses
    set process_id = id::text
    where process_id is null
      and id is not null;

    alter table environmental_licenses
      alter column process_id set default gen_random_uuid()::text;
  end if;
end $$;

create index if not exists idx_environmental_licenses_process_id
  on environmental_licenses(process_id);
