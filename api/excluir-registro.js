const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const allowedTables = new Set([
  "car_registries",
  "properties",
  "enterprise_properties",
  "enterprises",
]);

function json(response, status, payload) {
  return response.status(status).json(payload);
}

async function supabaseRequest(table, query, method = "GET") {
  const endpoint = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const result = await fetch(endpoint, {
    method,
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
  return data;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return json(response, 405, { success: false, error: "Método não permitido" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(response, 500, { success: false, error: "Supabase service role não configurada na Vercel" });
  }

  try {
    const { table, id } = request.body || {};
    if (!allowedTables.has(table)) {
      return json(response, 400, { success: false, error: "Tabela não autorizada para exclusão pelo backend" });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ""))) {
      return json(response, 400, { success: false, error: "ID inválido para exclusão" });
    }

    if (table === "properties") {
      const enterpriseRows = await supabaseRequest("enterprises", `select=id&property_id=eq.${encodeURIComponent(id)}`);
      const enterpriseIds = (enterpriseRows || []).map((enterprise) => enterprise.id).filter(Boolean);
      await Promise.all(enterpriseIds.flatMap((enterpriseId) => [
        supabaseRequest("enterprise_properties", `enterprise_id=eq.${encodeURIComponent(enterpriseId)}`, "DELETE").catch(() => null),
        supabaseRequest("enterprise_modules", `enterprise_id=eq.${encodeURIComponent(enterpriseId)}`, "DELETE").catch(() => null),
        supabaseRequest("activity_enterprises", `enterprise_id=eq.${encodeURIComponent(enterpriseId)}`, "DELETE").catch(() => null),
      ]));
      await supabaseRequest("enterprises", `property_id=eq.${encodeURIComponent(id)}`, "DELETE").catch(() => null);
      await supabaseRequest("enterprise_properties", `property_id=eq.${encodeURIComponent(id)}`, "DELETE").catch(() => null);
    }

    await supabaseRequest(table, `id=eq.${encodeURIComponent(id)}`, "DELETE");
    const remaining = await supabaseRequest(table, `select=id&id=eq.${encodeURIComponent(id)}`);
    if (Array.isArray(remaining) && remaining.length > 0) {
      throw new Error("Registro ainda existe após a exclusão pelo backend");
    }

    return json(response, 200, { success: true });
  } catch (error) {
    return json(response, 500, { success: false, error: error.message });
  }
}
