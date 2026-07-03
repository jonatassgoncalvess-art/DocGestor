alter table if exists public.properties
  add column if not exists cib_itr_number text;

comment on column public.properties.cib_itr_number is
  'Número CIB/ITR informado para imóveis rurais.';
