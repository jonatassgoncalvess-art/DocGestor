-- DocGestor by Carminatti
-- Sincronização conservadora de vínculos do banco
-- Este SQL apenas cria vínculos que estão faltando.
-- Não apaga, não limpa e não substitui nenhum dado existente.

create extension if not exists pgcrypto;

-- 01.2.6 Atividades: preserva o CNPJ principal antigo como vínculo múltiplo.
create table if not exists activity_companies (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists activity_companies_activity_company_key
  on activity_companies(activity_id, company_id);

insert into activity_companies (activity_id, company_id)
select a.id, a.company_id
from activities a
where a.company_id is not null
  and not exists (
    select 1
    from activity_companies ac
    where ac.activity_id = a.id
      and ac.company_id = a.company_id
  );

-- 01.2.5 Empreendimentos: preserva o imóvel principal antigo como vínculo múltiplo.
insert into enterprise_properties (enterprise_id, property_id)
select e.id, e.property_id
from enterprises e
where e.property_id is not null
  and not exists (
    select 1
    from enterprise_properties ep
    where ep.enterprise_id = e.id
      and ep.property_id = e.property_id
  );

alter table activity_companies enable row level security;

drop policy if exists activity_companies_prototype_all on activity_companies;
create policy activity_companies_prototype_all
on activity_companies
for all
using (true)
with check (true);

notify pgrst, 'reload schema';
