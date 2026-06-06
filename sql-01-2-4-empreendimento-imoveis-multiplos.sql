-- DocGestor by Carminatti
-- 01.2.4 Empreendimento - Vínculo de múltiplos imóveis por empreendimento

create table if not exists enterprise_properties (
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  property_id uuid not null references properties(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (enterprise_id, property_id)
);

create index if not exists enterprise_properties_enterprise_id_idx
on enterprise_properties(enterprise_id);

create index if not exists enterprise_properties_property_id_idx
on enterprise_properties(property_id);

alter table enterprise_properties enable row level security;

drop policy if exists enterprise_properties_prototype_all on enterprise_properties;

create policy enterprise_properties_prototype_all
on enterprise_properties
for all
using (true)
with check (true);

insert into enterprise_properties (enterprise_id, property_id)
select id, property_id
from enterprises
where property_id is not null
on conflict (enterprise_id, property_id) do nothing;

