-- DocGestor by Carminatti
-- Ambiente 01.4.2 - E-mails por Módulo
-- Permite diferenciar destinatários externos e usuários automáticos do sistema.

alter table alert_recipients
add column if not exists source text not null default 'external';

alter table alert_recipients
add column if not exists user_id uuid;

create index if not exists idx_alert_recipients_user_id
on alert_recipients(user_id);

create index if not exists idx_alert_recipients_email
on alert_recipients(lower(email));
