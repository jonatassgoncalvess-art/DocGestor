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
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        "Content-Type": "application/json",
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
      return request(table, {
        method: "DELETE",
        query: `id=eq.${encodeURIComponent(id)}`,
      });
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
