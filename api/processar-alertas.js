import { Resend } from "resend";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://trpjsvlpgaplksfhoxau.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_xSppe3iQC7YAcA2moLMrgw_yvS54coJ";
const resend = new Resend(process.env.RESEND_API_KEY);
const SENT_HISTORY_RETENTION_DAYS = 120;

function headers() {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function supabaseRequest(table, query, options = {}) {
  const url = `${supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: headers(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.hint || response.statusText;
    throw new Error(message);
  }
  return data || [];
}

async function recipientById(recipientId) {
  if (!recipientId) return null;
  const rows = await supabaseRequest(
    "alert_recipients",
    `select=id,email,name,status&id=eq.${encodeURIComponent(recipientId)}&limit=1`,
  );
  return rows[0] || null;
}

async function markQueue(queueItem, patch) {
  return supabaseRequest("alert_queue", `id=eq.${encodeURIComponent(queueItem.id)}`, {
    method: "PATCH",
    body: patch,
  });
}

function sentHistoryCutoffIso() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SENT_HISTORY_RETENTION_DAYS);
  return cutoff.toISOString();
}

async function cleanupOldSentHistory() {
  const cutoff = encodeURIComponent(sentHistoryCutoffIso());
  await Promise.all([
    supabaseRequest("alert_history", `status=eq.sent&sent_at=lt.${cutoff}`, { method: "DELETE" }),
    supabaseRequest("alert_history", `status=eq.sent&sent_at=is.null&last_event_at=lt.${cutoff}`, { method: "DELETE" }),
  ]);
}

async function updateHistory(queueItem, recipient, status, resendResult = null) {
  const historyRows = queueItem.alert_key
    ? await supabaseRequest(
        "alert_history",
        `select=id&alert_key=eq.${encodeURIComponent(queueItem.alert_key)}&recipient_id=eq.${encodeURIComponent(queueItem.recipient_id)}&status=eq.waiting&limit=1`,
      )
    : [];
  const payload = {
    status,
    status_label: status === "sent" ? "Enviado" : "Falha",
    sent_at: status === "sent" ? new Date().toISOString() : null,
    last_event_at: new Date().toISOString(),
    resend_email_id: resendResult?.id || null,
    message_html: queueItem.message_html || null,
    raw_payload: {
      queue_id: queueItem.id,
      resend_result: resendResult || null,
      message_html: queueItem.message_html || null,
    },
  };
  if (historyRows[0]?.id) {
    return supabaseRequest("alert_history", `id=eq.${encodeURIComponent(historyRows[0].id)}`, {
      method: "PATCH",
      body: payload,
    });
  }
  return supabaseRequest("alert_history", "", {
    method: "POST",
    body: {
      ...payload,
      alert_key: queueItem.alert_key || null,
      recipient_id: queueItem.recipient_id,
      module_id: queueItem.module_id || "environmental",
      subject: queueItem.subject,
      sender_email: process.env.RESEND_FROM_EMAIL || "docgestor@systemdirect.org",
      recipient_emails: recipient?.email ? [recipient.email] : [],
      related_type: queueItem.related_type,
      related_id: queueItem.related_id,
      related_label: queueItem.related_label,
    },
  });
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ success: false, error: "Método não permitido" });
  }
  if (!process.env.RESEND_API_KEY) {
    return response.status(500).json({ success: false, error: "RESEND_API_KEY não configurada na Vercel." });
  }

  try {
    await cleanupOldSentHistory().catch(() => null);
    const now = new Date().toISOString();
    const queue = await supabaseRequest(
      "alert_queue",
      `select=*&status=eq.pending&scheduled_for=lte.${encodeURIComponent(now)}&order=scheduled_for.asc&limit=50`,
    );
    const results = [];

    for (const item of queue) {
      try {
        const recipient = await recipientById(item.recipient_id);
        if (!recipient?.email || String(recipient.status || "active").toLowerCase() === "inactive") {
          await markQueue(item, { status: "failed", updated_at: new Date().toISOString() });
          await updateHistory(item, recipient, "failed");
          results.push({ id: item.id, status: "failed", reason: "Destinatário inválido ou inativo." });
          continue;
        }

        const sent = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "DocGestor by Carminatti <docgestor@systemdirect.org>",
          to: [recipient.email],
          subject: item.subject,
          html: item.message_html,
        });
        if (sent?.error) {
          throw new Error(sent.error.message || "Resend retornou erro no envio.");
        }
        const resendId = sent?.data?.id || sent?.id || null;
        await markQueue(item, {
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_email_id: resendId,
          updated_at: new Date().toISOString(),
        });
        await updateHistory(item, recipient, "sent", { id: resendId });
        results.push({ id: item.id, status: "sent", resendId });
      } catch (itemError) {
        await markQueue(item, { status: "failed", updated_at: new Date().toISOString() }).catch(() => null);
        await updateHistory(item, null, "failed").catch(() => null);
        results.push({ id: item.id, status: "failed", reason: itemError.message });
      }
    }

    return response.status(200).json({ success: true, processed: results.length, results });
  } catch (error) {
    return response.status(500).json({ success: false, error: error.message });
  }
}
