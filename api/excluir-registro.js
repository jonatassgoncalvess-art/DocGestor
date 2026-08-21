const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_TABLES = new Set([
  "activity_companies",
  "activity_enterprises",
  "activities",
  "agenda_events",
  "alert_history",
  "alert_queue",
  "alert_recipient_modules",
  "alert_recipients",
  "app_users",
  "app_modules",
  "alert_rules",
  "car_registries",
  "cities",
  "companies",
  "company_partners",
  "diverse_reminders",
  "enterprise_modules",
  "enterprise_properties",
  "enterprises",
  "environmental_checklist_model_documents",
  "environmental_checklist_models",
  "environmental_document_license_types",
  "environmental_documents",
  "environmental_license_type_phases",
  "environmental_license_types",
  "environmental_alerts",
  "environmental_conditions",
  "environmental_license_checklist_items",
  "environmental_licenses",
  "environmental_process_stage_deadlines",
  "form_authorizations",
  "partners",
  "properties",
  "system_backup_configs",
  "system_backup_runs",
  "user_permissions",
]);

function send(response, status, payload) {
  return response.status(status).json(payload);
}

function safeTableName(table) {
  return typeof table === "string" && /^[a-zA-Z0-9_]+$/.test(table) && ALLOWED_TABLES.has(table);
}

async function deleteFromSupabase(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const result = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });
  const text = await result.text();
  const data = text ? JSON.parse(text) : null;
  if (!result.ok) {
    throw new Error(data?.message || data?.hint || result.statusText);
  }
  return Array.isArray(data) ? data : [];
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return send(response, 405, { success: false, error: "Método não permitido" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return send(response, 500, {
      success: false,
      error: "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel",
    });
  }

  try {
    const { table, query } = request.body || {};
    if (!safeTableName(table)) {
      return send(response, 400, { success: false, error: "Tabela não autorizada para exclusão" });
    }
    if (!query || typeof query !== "string") {
      return send(response, 400, { success: false, error: "Filtro de exclusão não informado" });
    }

    const rows = await deleteFromSupabase(table, query);
    return send(response, 200, { success: true, rows });
  } catch (error) {
    return send(response, 500, { success: false, error: error.message });
  }
}
