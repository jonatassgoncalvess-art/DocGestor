-- DocGestor by Carminatti
-- Ambiente 01.4.3 - Histórico de Alertas
-- Execute no SQL Editor do Supabase para permitir abrir "Ver e-mail"
-- com o texto enviado ou programado.

alter table alert_history
add column if not exists message_html text;

alter table alert_history
add column if not exists raw_payload jsonb not null default '{}'::jsonb;
