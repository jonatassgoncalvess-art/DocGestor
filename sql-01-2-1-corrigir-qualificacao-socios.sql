-- DocGestor by Carminatti - Correção 01.2.1 Sócios
-- Corrige a regra do campo "role" para aceitar as qualificações com acento usadas pelo sistema.

alter table if exists partners
drop constraint if exists partners_role_check;

update partners
set role = case role
  when 'Socio' then 'Sócio'
  when 'Socio administrador' then 'Sócio administrador'
  when 'Responsavel legal' then 'Responsável legal'
  else role
end
where role in ('Socio', 'Socio administrador', 'Responsavel legal');

alter table if exists partners
add constraint partners_role_check
check (role in (
  'Sócio',
  'Sócio administrador',
  'Procurador',
  'Responsável legal',
  'Socio',
  'Socio administrador',
  'Responsavel legal'
));
