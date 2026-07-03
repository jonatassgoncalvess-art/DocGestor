const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://trpjsvlpgaplksfhoxau.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_xSppe3iQC7YAcA2moLMrgw_yvS54coJ";

async function listAlertHistory() {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/alert_history?select=*&order=created_at.desc&limit=200`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) {
    throw new Error(data?.message || data?.hint || response.statusText);
  }
  return data;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ success: false, error: "Metodo nao permitido" });
  }

  try {
    const rows = await listAlertHistory();
    return response.status(200).json({
      success: true,
      emails: rows.map((row) => ({
        id: row.id,
        subject: row.subject || "Sem assunto",
        to: row.recipient_emails || [],
        from: row.sender_email || "",
        created_at: row.created_at || row.sent_at || row.last_event_at,
        sent_at: row.sent_at || null,
        last_event: row.status || "waiting",
        status: row.status || "waiting",
        status_label: row.status_label || "",
        resend_email_id: row.resend_email_id || "",
        message_html: row.message_html || "",
        raw_payload: row.raw_payload || {},
        related_label: row.related_label || "",
        related_id: row.related_id || "",
      })),
      hasMore: rows.length >= 200,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      error: error.message || "Erro ao buscar historico de alertas.",
    });
  }
}
