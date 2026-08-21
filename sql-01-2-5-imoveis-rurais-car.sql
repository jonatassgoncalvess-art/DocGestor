-- DocGestor by Carminatti
-- Ambiente 01.2.5 Imóveis
-- Adequação dos imóveis rurais para cruzamento com CAR e controle de averbação de Reserva Legal.
-- Execute no Supabase. Este script não apaga dados existentes.

alter table public.properties
  add column if not exists legal_reserve_averment_exists boolean not null default false,
  add column if not exists legal_reserve_averment_percent numeric(7, 2),
  add column if not exists legal_reserve_averment_m2 numeric(14, 2);

update public.properties
set
  legal_reserve_averment_exists = coalesce(legal_reserve_averment_exists, false),
  legal_reserve_averment_percent = case
    when type = 'rural' and legal_reserve_averment_percent is null and coalesce(rural_area_m2, 0) > 0 and coalesce(legal_reserve_m2, 0) > 0
      then round((legal_reserve_m2 / rural_area_m2) * 100, 2)
    else legal_reserve_averment_percent
  end,
  legal_reserve_averment_m2 = case
    when type = 'rural' and legal_reserve_averment_m2 is null and coalesce(legal_reserve_m2, 0) > 0
      then legal_reserve_m2
    else legal_reserve_averment_m2
  end
where type = 'rural';

update public.properties
set legal_reserve_averment_exists = true
where type = 'rural'
  and coalesce(legal_reserve_averment_m2, 0) > 0;

alter table public.properties
  alter column legal_reserve_averment_exists set not null,
  alter column legal_reserve_averment_exists set default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_legal_reserve_averment_non_negative') then
    alter table public.properties
      add constraint properties_legal_reserve_averment_non_negative
      check (
        coalesce(legal_reserve_averment_percent, 0) >= 0
        and coalesce(legal_reserve_averment_percent, 0) <= 100
        and coalesce(legal_reserve_averment_m2, 0) >= 0
      );
  end if;
end;
$$;

create index if not exists properties_legal_reserve_averment_idx
  on public.properties (legal_reserve_averment_exists);
