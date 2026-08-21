-- DocGestor by Carminatti
-- Correção de exclusão permanente para CAR e Imóveis/Matrículas
-- Execute no Supabase caso o registro suma da tela, mas volte após recarregar o sistema.
-- O script não apaga dados; apenas garante política de DELETE para as tabelas usadas pelo app.

alter table public.car_registries enable row level security;
alter table public.properties enable row level security;
alter table public.enterprise_properties enable row level security;
alter table public.enterprises enable row level security;

drop policy if exists car_registries_delete on public.car_registries;
create policy car_registries_delete
on public.car_registries
for delete
using (true);

drop policy if exists properties_delete on public.properties;
create policy properties_delete
on public.properties
for delete
using (true);

drop policy if exists enterprise_properties_delete on public.enterprise_properties;
create policy enterprise_properties_delete
on public.enterprise_properties
for delete
using (true);

drop policy if exists enterprises_delete on public.enterprises;
create policy enterprises_delete
on public.enterprises
for delete
using (true);
