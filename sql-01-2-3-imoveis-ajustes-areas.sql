-- DocGestor by Carminatti - 01.2.3 Imoveis
-- Ajuste: impedir valores negativos em campos de m2 e Ha.

update properties
set
  urban_area_m2 = case when urban_area_m2 is null then null else greatest(urban_area_m2, 0) end,
  rural_area_m2 = case when rural_area_m2 is null then null else greatest(rural_area_m2, 0) end,
  legal_reserve_m2 = case when legal_reserve_m2 is null then null else greatest(legal_reserve_m2, 0) end,
  app_area_m2 = case when app_area_m2 is null then null else greatest(app_area_m2, 0) end,
  construction_area_m2 = case when construction_area_m2 is null then null else greatest(construction_area_m2, 0) end;

alter table properties
drop constraint if exists properties_non_negative_areas_check;

alter table properties
add constraint properties_non_negative_areas_check
check (
  coalesce(urban_area_m2, 0) >= 0
  and coalesce(rural_area_m2, 0) >= 0
  and coalesce(legal_reserve_m2, 0) >= 0
  and coalesce(app_area_m2, 0) >= 0
  and coalesce(construction_area_m2, 0) >= 0
);
