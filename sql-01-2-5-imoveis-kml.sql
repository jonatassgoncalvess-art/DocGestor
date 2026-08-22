-- DocGestor by Carminatti
-- Ambiente 01.2.5 Imóveis
-- Georreferência: armazenamento de arquivo .KML no cadastro da matrícula/imóvel.
-- Execute no Supabase. Este script não apaga dados existentes.

alter table public.properties
  add column if not exists kml_file_name text,
  add column if not exists kml_content text,
  add column if not exists kml_imported_at timestamptz;

comment on column public.properties.kml_file_name is 'Nome original do arquivo KML importado para o imóvel.';
comment on column public.properties.kml_content is 'Conteúdo XML do arquivo KML importado para o imóvel.';
comment on column public.properties.kml_imported_at is 'Data e hora em que o KML foi importado no DocGestor.';

create index if not exists idx_properties_kml_imported_at
  on public.properties (kml_imported_at desc)
  where kml_content is not null;
