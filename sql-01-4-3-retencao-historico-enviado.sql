-- DocGestor by Carminatti
-- Ambiente 01.4.3 - Histórico de Alertas
-- Regra: avisos enviados permanecem no histórico por 3 meses.

create index if not exists idx_alert_history_status_sent_at
on alert_history(status, sent_at);

-- Limpeza opcional imediata de enviados antigos.
-- A Vercel Function /api/processar-alertas também executa esta limpeza.
delete from alert_history
where status = 'sent'
  and sent_at is not null
  and sent_at < now() - interval '3 months';

delete from alert_history
where status = 'sent'
  and sent_at is null
  and last_event_at is not null
  and last_event_at < now() - interval '3 months';
