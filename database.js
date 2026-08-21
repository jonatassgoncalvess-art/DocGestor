(function () {
  const config = window.DOCGESTOR_SUPABASE_CONFIG;
  const DELETED_RECORDS_KEY = "docgestor.deletedRecords.v1";

  function status(message, tone) {
    const target = document.querySelector("#supabase-status");
    if (!target) return;
    target.textContent = message;
    target.dataset.tone = tone || "neutral";
  }

  function endpoint(table, query) {
    const base = `${config.url}/rest/v1/${table}`;
    return query ? `${base}?${query}` : base;
  }

  function normalizeValue(value) {
    return String(value || "").trim().toLowerCase();
  }

  function deletedRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(DELETED_RECORDS_KEY) || "{}");
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }

  function saveDeletedRecords(data) {
    localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(data));
  }

  function tableDeletedRecords(table) {
    const data = deletedRecords();
    const current = data[table] || {};
    return {
      ids: Array.isArray(current.ids) ? current.ids.map(String) : [],
      carNumbers: Array.isArray(current.carNumbers) ? current.carNumbers.map(normalizeValue) : [],
    };
  }

  function saveTableDeletedRecords(table, current) {
    const data = deletedRecords();
    data[table] = {
      ids: Array.from(new Set(current.ids || [])),
      carNumbers: Array.from(new Set(current.carNumbers || [])),
    };
    saveDeletedRecords(data);
  }

  function decodedQueryValue(value) {
    try {
      return decodeURIComponent(String(value || ""));
    } catch {
      return String(value || "");
    }
  }

  function queryValue(query, field) {
    const direct = String(query || "").match(new RegExp(`(?:^|&)${field}=eq\\.([^&]+)`));
    if (direct) return decodedQueryValue(direct[1]);
    const grouped = String(query || "").match(new RegExp(`${field}\\.eq\\.([^,)]+)`));
    return grouped ? decodedQueryValue(grouped[1]) : "";
  }

  function markDeletedFromQuery(table, query) {
    const current = tableDeletedRecords(table);
    const id = queryValue(query, "id");
    if (id) current.ids.push(String(id));
    if (table === "car_registries") {
      const carNumber = queryValue(query, "car_number");
      if (carNumber) current.carNumbers.push(normalizeValue(carNumber));
    }
    saveTableDeletedRecords(table, current);
  }

  function forgetDeletedRow(table, row) {
    if (!row || typeof row !== "object") return;
    const current = tableDeletedRecords(table);
    const id = String(row.id || "");
    const carNumber = normalizeValue(row.car_number);
    saveTableDeletedRecords(table, {
      ids: current.ids.filter((item) => item !== id),
      carNumbers: current.carNumbers.filter((item) => item !== carNumber),
    });
  }

  function rowWasDeleted(table, row) {
    if (!row || typeof row !== "object") return false;
    const current = tableDeletedRecords(table);
    if (row.id && current.ids.includes(String(row.id))) return true;
    if (table === "car_registries" && row.car_number && current.carNumbers.includes(normalizeValue(row.car_number))) return true;
    return false;
  }

  function filterDeletedRows(table, data) {
    if (!Array.isArray(data)) return data;
    return data.filter((row) => !rowWasDeleted(table, row));
  }

  async function request(table, options = {}) {
    const method = options.method || "GET";
    const response = await fetch(endpoint(table, options.query), {
      method,
      cache: "no-store",
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Prefer: "return=representation",
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = data?.message || data?.hint || response.statusText;
      throw new Error(message);
    }

    if (method === "GET") return filterDeletedRows(table, data);
    if (method === "POST" || method === "PATCH") {
      (Array.isArray(data) ? data : [data]).filter(Boolean).forEach((row) => forgetDeletedRow(table, row));
    }
    return data;
  }

  async function backendDelete(table, query) {
    const response = await fetch("/api/excluir-registro", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: JSON.stringify({ table, query }),
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || response.statusText || "Falha ao excluir pelo backend");
    }

    return Array.isArray(data.rows) ? data.rows : [];
  }

  async function deleteRequest(table, query) {
    markDeletedFromQuery(table, query);
    try {
      return await backendDelete(table, query);
    } catch (error) {
      console.warn("Exclusão pelo backend indisponível; usando Supabase público.", error.message);
      try {
        return await request(table, { method: "DELETE", query });
      } catch (publicError) {
        console.warn("Exclusão pública também falhou; o registro ficará oculto no sistema.", publicError.message);
        return [];
      }
    }
  }

  const db = {
    async ping() {
      return fetch(`${config.url}/auth/v1/health`, {
        headers: {
          apikey: config.publishableKey,
          Authorization: `Bearer ${config.publishableKey}`,
        },
      });
    },

    list(table, query = "select=*") {
      return request(table, { query });
    },

    create(table, record) {
      return request(table, { method: "POST", body: record });
    },

    update(table, id, patch) {
      return request(table, {
        method: "PATCH",
        query: `id=eq.${encodeURIComponent(id)}`,
        body: patch,
      });
    },

    remove(table, id) {
      return deleteRequest(table, `id=eq.${encodeURIComponent(id)}`);
    },

    removeWhere(table, query) {
      return deleteRequest(table, query);
    },
  };

  window.DocGestorDB = db;

  db.ping()
    .then((response) => {
      if (response.ok) status("Supabase: conectado", "success");
      else status("Supabase: aguardando schema", "warning");
    })
    .catch(() => status("Supabase: modo local", "warning"));
})();
