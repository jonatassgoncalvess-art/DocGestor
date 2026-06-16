-- DocGestor by Carminatti
-- Ambiente 01.2.6 Atividades - vínculo de uma atividade com múltiplos CNPJs
-- Execute este SQL no Supabase para habilitar seleção de mais de um CNPJ.

create extension if not exists pgcrypto;

create table if not exists activity_companies (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists activity_companies_activity_company_key
  on activity_companies(activity_id, company_id);

create index if not exists activity_companies_activity_id_idx on activity_companies(activity_id);
create index if not exists activity_companies_company_id_idx on activity_companies(company_id);

insert into activity_companies (activity_id, company_id)
select id, company_id
from activities
where company_id is not null
on conflict do nothing;

alter table activity_companies enable row level security;

drop policy if exists activity_companies_prototype_all on activity_companies;
create policy activity_companies_prototype_all
on activity_companies
for all
using (true)
with check (true);

notify pgrst, 'reload schema';
