-- Correção do ambiente 03.1 - coluna legada process_internal_number
-- Execute no SQL Editor do Supabase.
-- Motivo: algumas versões antigas da tabela environmental_licenses criaram
-- process_internal_number como obrigatório. O sistema atual usa process_number.

alter table environmental_licenses
  add column if not exists process_internal_number text;

update environmental_licenses
set process_internal_number = process_number
where (process_internal_number is null or process_internal_number = '')
  and process_number is not null;

alter table environmental_licenses
  alter column process_internal_number drop not null;

create index if not exists idx_environmental_licenses_process_internal_number
  on environmental_licenses(process_internal_number);
