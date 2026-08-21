const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://trpjsvlpgaplksfhoxau.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_xSppe3iQC7YAcA2moLMrgw_yvS54coJ";
const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
const BACKUP_TIMEZONE = "America/Sao_Paulo";
const BACKUP_TIMEZONE_OFFSET = "-03:00";

const BACKUP_TABLES = [
  "organizations",
  "app_modules",
  "app_users",
  "user_permissions",
  "partners",
  "companies",
  "company_partners",
  "cities",
  "car_registries",
  "properties",
  "enterprises",
  "enterprise_modules",
  "enterprise_properties",
  "activities",
  "activity_companies",
  "activity_enterprises",
  "environmental_license_types",
  "environmental_license_type_phases",
  "environmental_documents",
  "environmental_document_license_types",
  "environmental_checklist_models",
  "environmental_checklist_model_documents",
  "environmental_licenses",
  "environmental_process_stage_deadlines",
  "agenda_events",
  "diverse_reminders",
  "form_authorizations",
  "alert_recipients",
  "alert_recipient_modules",
  "alert_queue",
  "alert_history",
  "alert_rules",
  "system_email_configs",
  "system_backup_configs",
  "system_backup_runs",
];

function headers(extra = {}) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

async function supabaseRequest(table, query = "", options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method: options.method || "GET",
    headers: headers(options.headers),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || data?.hint || response.statusText);
  }
  return data || [];
}

async function safeSupabaseRequest(table, query = "", options = {}) {
  try {
    return await supabaseRequest(table, query, options);
  } catch (error) {
    return { error: error.message };
  }
}

function parseBackupTime(value) {
  const [hour, minute] = String(value || "02:00").split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 2,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function saoPauloDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BACKUP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdayMap[get("weekday")] ?? date.getDay(),
  };
}

function zonedCandidateFromParts(parts, hour, minute) {
  return new Date(
    `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${BACKUP_TIMEZONE_OFFSET}`,
  );
}

function computeNextBackupDate(config) {
  if (!config?.enabled) return null;
  const now = new Date();
  const { hour, minute } = parseBackupTime(config.backup_time || config.time);
  const localParts = saoPauloDateParts(now);
  const candidate = zonedCandidateFromParts(localParts, hour, minute);

  if ((config.frequency || "daily") === "daily") {
    while (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate.toISOString();
  }

  if (config.frequency === "weekly" || config.frequency === "biweekly") {
    const targetDay = Number(config.weekday ?? 1);
    const interval = config.frequency === "biweekly" ? 14 : 7;
    const diff = (targetDay - localParts.weekday + 7) % 7;
    candidate.setDate(candidate.getDate() + diff);
    if (candidate <= now) candidate.setDate(candidate.getDate() + interval);
    return candidate.toISOString();
  }

  const monthday = Math.min(Math.max(Number(config.monthday || 1), 1), 28);
  candidate.setDate(monthday);
  if (candidate <= now) {
    candidate.setMonth(candidate.getMonth() + 1);
    candidate.setDate(monthday);
  }
  return candidate.toISOString();
}

function normalizeConfig(config = {}) {
  return {
    id: config.id || null,
    enabled: config.enabled !== false,
    frequency: config.frequency || "daily",
    backup_time: config.backup_time || config.time || "02:00",
    retention_days: Number(config.retention_days || config.retentionDays || 90),
    weekday: Number(config.weekday || 1),
    monthday: Number(config.monthday || 1),
    provider: config.provider || "supabase",
    destination: config.destination || "docgestor-backups/ambiental",
    status: config.status || "Configurado",
    last_backup_at: config.last_backup_at || config.lastBackup || null,
    next_backup_at: config.next_backup_at || config.nextBackup || null,
  };
}

function parseDestination(destination) {
  const clean = String(destination || "docgestor-backups/ambiental")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
  const [bucket, ...folderParts] = clean.split("/");
  return {
    bucket: bucket || "docgestor-backups",
    folder: folderParts.join("/"),
  };
}

function backupFileName(config, now = new Date()) {
  const date = now.toISOString().replace(/[:.]/g, "-");
  return `docgestor-backup-${date}.json`;
}

async function ensureBucket(bucket) {
  const response = await fetch(`${supabaseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
    headers: headers(),
  });
  if (response.ok) return true;
  const create = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ id: bucket, name: bucket, public: false }),
  });
  if (create.ok || create.status === 409) return true;
  const text = await create.text();
  throw new Error(text || `Não foi possível criar o bucket ${bucket}.`);
}

async function uploadToSupabaseStorage(config, fileName, backupPayload) {
  const { bucket, folder } = parseDestination(config.destination);
  await ensureBucket(bucket);
  const objectPath = [folder, fileName].filter(Boolean).join("/");
  const encodedObjectPath = objectPath.split("/").map((part) => encodeURIComponent(part)).join("/");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedObjectPath}`, {
    method: "POST",
    headers: headers({
      "Content-Type": "application/json; charset=utf-8",
      "x-upsert": "true",
    }),
    body: JSON.stringify(backupPayload, null, 2),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || data?.error || response.statusText);
  }
  return {
    bucket,
    objectPath,
    fileUrl: `${bucket}/${objectPath}`,
  };
}

async function readTableRows(table) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  for (;;) {
    const page = await supabaseRequest(table, "select=*", {
      headers: {
        Range: `${from}-${from + pageSize - 1}`,
        "Range-Unit": "items",
      },
    });
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function buildBackupPayload(config, runId) {
  const tables = {};
  const tableErrors = {};
  for (const table of BACKUP_TABLES) {
    try {
      tables[table] = await readTableRows(table);
    } catch (error) {
      tables[table] = [];
      tableErrors[table] = error.message;
    }
  }
  return {
    meta: {
      product: "DocGestor by Carminatti",
      generated_at: new Date().toISOString(),
      run_id: runId || null,
      config_id: config.id || null,
      provider: config.provider,
      destination: config.destination,
      format: "json",
      schema_version: 1,
    },
    tables,
    table_errors: tableErrors,
  };
}

async function createRun(config, mode) {
  const [run] = await supabaseRequest("system_backup_runs", "", {
    method: "POST",
    body: {
      config_id: config.id || null,
      provider: config.provider,
      destination: config.destination,
      status: "running",
      metadata: { mode },
    },
  });
  return run;
}

async function updateRun(runId, patch) {
  if (!runId) return [];
  return safeSupabaseRequest("system_backup_runs", `id=eq.${encodeURIComponent(runId)}`, {
    method: "PATCH",
    body: patch,
  });
}

async function updateConfig(configId, patch) {
  if (!configId) return [];
  return safeSupabaseRequest("system_backup_configs", `id=eq.${encodeURIComponent(configId)}`, {
    method: "PATCH",
    body: patch,
  });
}

async function cleanupOldRuns(retentionDays) {
  const days = Math.max(Number(retentionDays || 90), 1);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return safeSupabaseRequest("system_backup_runs", `finished_at=lt.${encodeURIComponent(cutoff.toISOString())}`, {
    method: "DELETE",
  });
}

async function runBackup(config, mode = "manual") {
  const normalized = normalizeConfig(config);
  if (normalized.provider !== "supabase") {
    throw new Error("A rotina backend atual gera backups reais somente em Supabase Storage.");
  }
  const run = await createRun(normalized, mode);
  const startedAt = new Date();
  try {
    const fileName = backupFileName(normalized, startedAt);
    const payload = await buildBackupPayload(normalized, run?.id);
    const stored = await uploadToSupabaseStorage(normalized, fileName, payload);
    const finishedAt = new Date().toISOString();
    const nextBackup = computeNextBackupDate(normalized);
    await updateRun(run?.id, {
      file_name: fileName,
      file_url: stored.fileUrl,
      status: "success",
      finished_at: finishedAt,
      metadata: {
        mode,
        bucket: stored.bucket,
        object_path: stored.objectPath,
        table_count: Object.keys(payload.tables).length,
        table_errors: payload.table_errors,
      },
    });
    await updateConfig(normalized.id, {
      status: "Configurado",
      last_backup_at: finishedAt,
      next_backup_at: nextBackup,
    });
    await cleanupOldRuns(normalized.retention_days);
    return {
      success: true,
      runId: run?.id || null,
      fileName,
      fileUrl: stored.fileUrl,
      lastBackup: finishedAt,
      nextBackup,
      tableErrors: payload.table_errors,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    await updateRun(run?.id, {
      status: "failed",
      finished_at: finishedAt,
      error_message: error.message,
    });
    await updateConfig(normalized.id, {
      status: "Falhou",
      next_backup_at: computeNextBackupDate(normalized),
    });
    throw error;
  }
}

async function latestConfig() {
  const rows = await supabaseRequest("system_backup_configs", "select=*&order=updated_at.desc&limit=1");
  return rows[0] || null;
}

async function dueConfigs() {
  const now = new Date().toISOString();
  return supabaseRequest(
    "system_backup_configs",
    `select=*&enabled=eq.true&or=(next_backup_at.is.null,next_backup_at.lte.${encodeURIComponent(now)})&order=next_backup_at.asc.nullsfirst&limit=5`,
  );
}

async function requestBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return response.status(405).json({ success: false, error: "Método não permitido" });
  }
  if (!hasServiceRoleKey) {
    return response.status(500).json({
      success: false,
      error: "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel. A rotina de backup precisa da service role key no backend.",
    });
  }

  try {
    if (request.method === "POST") {
      const body = await requestBody(request);
      const config = body.configId
        ? (await supabaseRequest("system_backup_configs", `select=*&id=eq.${encodeURIComponent(body.configId)}&limit=1`))[0]
        : body.config || (await latestConfig());
      if (!config) throw new Error("Nenhuma configuração de backup encontrada.");
      const result = await runBackup(config, "manual");
      return response.status(200).json(result);
    }

    const configs = await dueConfigs();
    const results = [];
    for (const config of configs) {
      try {
        results.push(await runBackup(config, "scheduled"));
      } catch (error) {
        results.push({ success: false, configId: config.id, error: error.message });
      }
    }
    return response.status(200).json({ success: true, processed: results.length, results });
  } catch (error) {
    return response.status(500).json({ success: false, error: error.message });
  }
}
