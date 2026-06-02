-- DocGestor by Carminatti
-- Ambiente 01.2.4 Empreendimento
-- Vinculo dos empreendimentos aos modulos operacionais.

create table if not exists enterprise_modules (
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  module_id text not null,
  created_at timestamptz not null default now(),
  primary key (enterprise_id, module_id)
);

create index if not exists enterprise_modules_enterprise_id_idx
on enterprise_modules(enterprise_id);

create index if not exists enterprise_modules_module_id_idx
on enterprise_modules(module_id);

alter table enterprise_modules enable row level security;

drop policy if exists enterprise_modules_prototype_all on enterprise_modules;

create policy enterprise_modules_prototype_all
on enterprise_modules
for all
using (true)
with check (true);

insert into enterprise_modules (enterprise_id, module_id)
select id, 'environmental'
from enterprises
where not exists (
  select 1
  from enterprise_modules
  where enterprise_modules.enterprise_id = enterprises.id
    and enterprise_modules.module_id = 'environmental'
);
