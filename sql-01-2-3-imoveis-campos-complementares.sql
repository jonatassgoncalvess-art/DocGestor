-- DocGestor by Carminatti
-- Ambiente 01.2.3 Imoveis
-- Campos complementares para imoveis rurais e urbanos.

alter table properties
add column if not exists car_number text,
add column if not exists ccir_incra_number text,
add column if not exists urban_property_registration text;

create index if not exists properties_car_number_idx
on properties(car_number);

create index if not exists properties_ccir_incra_number_idx
on properties(ccir_incra_number);

create index if not exists properties_urban_property_registration_idx
on properties(urban_property_registration);

comment on column properties.car_number is 'Numero do CAR para imoveis rurais.';
comment on column properties.ccir_incra_number is 'Numero CCIR/INCRA para imoveis rurais.';
comment on column properties.urban_property_registration is 'Numero da inscricao imobiliaria para imoveis urbanos.';
