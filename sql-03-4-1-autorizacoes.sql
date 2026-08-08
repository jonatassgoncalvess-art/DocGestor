create extension if not exists pgcrypto;

create table if not exists public.form_authorizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  authorization_number text not null,
  authorized_by_partner_id uuid references public.partners(id) on delete set null,
  authorized_by_name text not null,
  granted_to text not null,
  subject text not null,
  issued_date date not null default current_date,
  has_validity boolean not null default false,
  validity_start date,
  validity_end date,
  body_text text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint form_authorizations_status_check check (status in ('active', 'cancelled', 'deleted')),
  constraint form_authorizations_validity_check check (
    has_validity = false
    or (
      validity_start is not null
      and validity_end is not null
      and validity_end >= validity_start
    )
  )
);

create index if not exists form_authorizations_organization_idx
  on public.form_authorizations (organization_id);

create index if not exists form_authorizations_partner_idx
  on public.form_authorizations (authorized_by_partner_id);

create unique index if not exists form_authorizations_org_number_idx
  on public.form_authorizations (organization_id, authorization_number);

alter table public.form_authorizations enable row level security;

drop policy if exists form_authorizations_public_select on public.form_authorizations;
create policy form_authorizations_public_select
  on public.form_authorizations for select
  using (true);

drop policy if exists form_authorizations_public_insert on public.form_authorizations;
create policy form_authorizations_public_insert
  on public.form_authorizations for insert
  with check (true);

drop policy if exists form_authorizations_public_update on public.form_authorizations;
create policy form_authorizations_public_update
  on public.form_authorizations for update
  using (true)
  with check (true);

drop policy if exists form_authorizations_public_delete on public.form_authorizations;
create policy form_authorizations_public_delete
  on public.form_authorizations for delete
  using (true);
