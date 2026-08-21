-- DocGestor by Carminatti
-- Ambiente 01.2.4 CAR - coordenadas em texto para Google Maps
-- Rode este SQL se a tabela car_registries ja existir no Supabase.
-- Ele permite salvar coordenadas no formato 26°04'00.1"S 53°43'07.5"W sem overflow numerico.

alter table public.car_registries
  add column if not exists latitude text,
  add column if not exists longitude text;

alter table public.car_registries
  alter column latitude type text using latitude::text,
  alter column longitude type text using longitude::text;

comment on column public.car_registries.latitude is
  'Latitude em texto. Aceita decimal ou graus/minutos/segundos, ex.: 26°04''00.1"S.';

comment on column public.car_registries.longitude is
  'Longitude em texto. Aceita decimal ou graus/minutos/segundos, ex.: 53°43''07.5"W.';
