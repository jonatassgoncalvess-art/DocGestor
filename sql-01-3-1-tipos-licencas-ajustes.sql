-- DocGestor by Carminatti - 01.3.1 Tipos de Licencas
-- Ajuste: validade padrao e renovacao recomendada saem do cadastro mestre.
-- Essas informacoes passam a ser informadas no processo ambiental.

alter table environmental_license_types
drop column if exists validity;

alter table environmental_license_types
drop column if exists renewal;
