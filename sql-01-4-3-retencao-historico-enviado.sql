-- DocGestor by Carminatti
-- Ambiente 01.4.3.2 - Enviados
-- Regra: avisos enviados permanecem no historico por 120 dias.

create index if not exists idx_alert_history_status_sent_at
on alert_history(status, sent_at);

-- Limpeza opcional imediata de enviados antigos.
-- A Vercel Function /api/processar-alertas tambem executa esta limpeza.
delete from alert_history
where status = 'sent'
  and sent_at is not null
  and sent_at < now() - interval '120 days';

delete from alert_history
where status = 'sent'
  and sent_at is null
  and last_event_at is not null
  and last_event_at < now() - interval '120 days';
