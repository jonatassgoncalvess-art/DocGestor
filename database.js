(function () {
  const config = window.DOCGESTOR_SUPABASE_CONFIG;

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

  async function request(table, options = {}) {
    const response = await fetch(endpoint(table, options.query), {
      method: options.method || "GET",
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
    try {
      return await backendDelete(table, query);
    } catch (error) {
      console.warn("Exclusão pelo backend indisponível; usando Supabase público.", error.message);
      return request(table, { method: "DELETE", query });
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
