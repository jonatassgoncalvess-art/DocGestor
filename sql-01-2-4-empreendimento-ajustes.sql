-- DocGestor by Carminatti - 01.2.4 Empreendimento
-- Ajustes: selecao de imovel por janela e classificacao CTF/APP do empreendimento.

do $$
begin
  if exists (select 1 from pg_type where typname = 'process_status') then
    alter type process_status add value if not exists 'Operando';
    alter type process_status add value if not exists 'Paralisado';
    alter type process_status add value if not exists 'Suspenso';
  end if;
end $$;

alter table enterprises
add column if not exists potential_polluter boolean not null default false;

alter table enterprises
drop constraint if exists enterprises_status_check;

alter table enterprises
add constraint enterprises_status_check
check (status in ('Planejado', 'Em implantacao', 'Em analise', 'Ativo', 'Operando', 'Paralisado', 'Suspenso', 'Encerrado'));

alter table enterprises
drop constraint if exists enterprises_type_check;

alter table enterprises
add constraint enterprises_type_check
check (
  type is null
  or type in ('Industrial', 'Rural', 'Comercial', 'Residencial', 'Infraestrutura', 'Outro')
);

create index if not exists enterprises_potential_polluter_idx
on enterprises(potential_polluter);
