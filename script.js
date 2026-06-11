const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const title = document.querySelector("#page-title");
const appShell = document.querySelector("#app-shell");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarFlyout = document.querySelector("#sidebar-flyout");
const adminSubnav = document.querySelector("#admin-subnav");
const dashboardSubnav = document.querySelector("#dashboard-subnav");
const moduleSubnav = document.querySelector("#module-subnav");
const agendaSubnav = document.querySelector("#agenda-subnav");
const settingsSubnav = document.querySelector("#settings-subnav");
const SESSION_USER_KEY = "docgestor.sessionUser";
const SESSION_VIEW_KEY = "docgestor.sessionView";
const SESSION_LICENSE_STATUS_KEY = "docgestor.licenseStatus";
const SIDEBAR_COLLAPSED_KEY = "docgestor.sidebarCollapsed";
const APP_VERSION_MANIFEST_URL = "downloads/app-version.json";
const APP_INSTALLER_URL = "downloads/DocGestor-by-Carminatti-1.0.2-x64.exe";
let sidebarFlyoutTimer = null;

const titles = {
  home: "Home",
  admin: "Painel Admin",
  dashboard: "Painel geral",
  "dashboard-ambiental": "02.1 Painel Ambiental",
  "dashboard-iptu": "02.2 Painel IPTU",
  "dashboard-agendamentos": "02.3 Painel Agendamentos",
  cadastros: "Cadastros",
  modulos: "Módulos",
  licencas: "03.1 Licenças Ambientais",
  iptu: "03.2 IPTU",
  "documentos-diversos": "03.3 Lembretes Diversos",
  usuarios: "Usuários e permissões",
  agenda: "04.1 Calendário",
  "agenda-notes": "04.2 Anotações",
  settings: "05 Configurações",
  "profile-settings": "05.1 Perfil",
};

function setSidebarCollapsed(collapsed) {
  appShell?.classList.toggle("sidebar-collapsed", collapsed);
  sidebarToggle?.setAttribute("aria-expanded", String(!collapsed));
  sidebarToggle?.setAttribute("aria-label", collapsed ? "Expandir menu lateral" : "Minimizar menu lateral");
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "true" : "false");
  if (!collapsed) hideSidebarFlyout();
}

setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");

sidebarToggle?.addEventListener("click", () => {
  setSidebarCollapsed(!appShell?.classList.contains("sidebar-collapsed"));
});

function subnavForNavItem(item) {
  if (item.hasAttribute("data-admin-menu-toggle")) return adminSubnav;
  if (item.hasAttribute("data-dashboard-menu-toggle")) return dashboardSubnav;
  if (item.hasAttribute("data-module-menu-toggle")) return moduleSubnav;
  if (item.hasAttribute("data-agenda-menu-toggle")) return agendaSubnav;
  if (item.hasAttribute("data-settings-menu-toggle")) return settingsSubnav;
  return null;
}

function visibleSidebarButtons(container) {
  return [...container.querySelectorAll(".admin-link")].filter((button) => !button.hidden);
}

function sidebarItemLabel(element) {
  return String(element.textContent || "").replace(/\s+/g, " ").trim();
}

function hideSidebarFlyout() {
  if (sidebarFlyoutTimer) window.clearTimeout(sidebarFlyoutTimer);
  sidebarFlyoutTimer = null;
  sidebarFlyout?.classList.remove("open");
  if (sidebarFlyout) sidebarFlyout.hidden = true;
}

function scheduleSidebarFlyoutHide() {
  if (sidebarFlyoutTimer) window.clearTimeout(sidebarFlyoutTimer);
  sidebarFlyoutTimer = window.setTimeout(hideSidebarFlyout, 140);
}

function keepSidebarFlyoutOpen() {
  if (sidebarFlyoutTimer) window.clearTimeout(sidebarFlyoutTimer);
  sidebarFlyoutTimer = null;
}

function addSidebarFlyoutButton(sourceButton) {
  if (!sidebarFlyout) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = `sidebar-flyout-button${sourceButton.classList.contains("active") ? " active" : ""}`;
  button.textContent = sidebarItemLabel(sourceButton);
  button.addEventListener("click", () => {
    sourceButton.click();
  });
  sidebarFlyout.appendChild(button);
}

function renderSidebarFlyout(item) {
  if (!sidebarFlyout || !appShell?.classList.contains("sidebar-collapsed")) return;
  const subnav = subnavForNavItem(item);
  const directButtons = subnav ? visibleSidebarButtons(subnav) : [];
  if (!directButtons.length && item.dataset.view) {
    sidebarFlyout.innerHTML = "";
    addSidebarFlyoutButton(item);
  } else if (subnav) {
    sidebarFlyout.innerHTML = `<div class="sidebar-flyout-title">${sidebarItemLabel(item)}</div>`;
    [...subnav.children].forEach((child) => {
      if (child.hidden) return;
      if (child.classList.contains("admin-link")) {
        addSidebarFlyoutButton(child);
        return;
      }
      if (child.classList.contains("side-tree-group")) {
        const groupButtons = visibleSidebarButtons(child);
        if (!groupButtons.length) return;
        const groupTitle = child.querySelector("strong");
        if (groupTitle) {
          const heading = document.createElement("div");
          heading.className = "sidebar-flyout-group";
          heading.textContent = sidebarItemLabel(groupTitle);
          sidebarFlyout.appendChild(heading);
        }
        groupButtons.forEach(addSidebarFlyoutButton);
      }
    });
  } else {
    return;
  }

  const rect = item.getBoundingClientRect();
  sidebarFlyout.hidden = false;
  sidebarFlyout.classList.add("open");
  sidebarFlyout.style.left = `${Math.round(rect.right + 10)}px`;
  sidebarFlyout.style.top = `${Math.max(12, Math.round(rect.top))}px`;
  const flyoutRect = sidebarFlyout.getBoundingClientRect();
  if (flyoutRect.bottom > window.innerHeight - 12) {
    sidebarFlyout.style.top = `${Math.max(12, Math.round(window.innerHeight - flyoutRect.height - 12))}px`;
  }
}

function sameId(left, right) {
  return String(left) === String(right);
}

function compareVersions(currentVersion, availableVersion) {
  const currentParts = String(currentVersion || "0").split(".").map((part) => Number(part) || 0);
  const availableParts = String(availableVersion || "0").split(".").map((part) => Number(part) || 0);
  const length = Math.max(currentParts.length, availableParts.length);
  for (let index = 0; index < length; index += 1) {
    const current = currentParts[index] || 0;
    const available = availableParts[index] || 0;
    if (available > current) return 1;
    if (available < current) return -1;
  }
  return 0;
}

async function configureDesktopDownloadButton() {
  const link = document.querySelector("#desktop-download-link");
  if (!link) return;
  link.href = APP_INSTALLER_URL;
  link.hidden = false;

  const desktopInfo = window.DocGestorDesktop;
  if (!desktopInfo?.version) {
    link.textContent = "Baixar app Windows";
    return;
  }

  link.hidden = true;
  try {
    const response = await fetch(`${APP_VERSION_MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const manifest = await response.json();
    const hasUpdate = compareVersions(desktopInfo.version, manifest.version) > 0;
    if (!hasUpdate) return;
    link.href = manifest.downloadUrl || APP_INSTALLER_URL;
    link.textContent = `Atualização disponível (${manifest.version})`;
    link.hidden = false;
  } catch (error) {
    console.warn("Não foi possível verificar atualização do app Windows.", error.message);
  }
}

function createUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  if (!window.crypto?.getRandomValues) {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.random() * 16 | 0;
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
    (Number(character) ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(character) / 4)))).toString(16),
  );
}

function openView(viewName) {
  const requiredPermission = viewPermission(viewName);
  if (currentUser && !canAccess(requiredPermission)) {
    openView(firstAccessibleView());
    return;
  }
  const parentView = ["cadastros", "usuarios"].includes(viewName)
    ? "admin"
    : ["dashboard-ambiental", "dashboard-iptu", "dashboard-agendamentos"].includes(viewName)
      ? "dashboard"
    : ["licencas", "iptu", "documentos-diversos"].includes(viewName)
      ? "modulos"
      : viewName === "agenda-notes"
        ? "agenda"
        : viewName === "profile-settings"
          ? "settings"
          : viewName;
  navItems.forEach((nav) => nav.classList.toggle("active", nav.dataset.view === parentView));
  views.forEach((view) => view.classList.toggle("active", view.id === viewName));
  title.textContent = titles[viewName];

  if (adminSubnav && parentView !== "admin") {
    adminSubnav.classList.remove("open");
    document.querySelector("[data-admin-menu-toggle]")?.setAttribute("aria-expanded", "false");
  }

  if (dashboardSubnav && parentView !== "dashboard") {
    dashboardSubnav.classList.remove("open");
    document.querySelector("[data-dashboard-menu-toggle]")?.setAttribute("aria-expanded", "false");
  }
  if (dashboardSubnav && parentView === "dashboard") {
    dashboardSubnav.classList.add("open");
    document.querySelector("[data-dashboard-menu-toggle]")?.setAttribute("aria-expanded", "true");
  }

  if (moduleSubnav && parentView !== "modulos") {
    moduleSubnav.classList.remove("open");
    document.querySelector("[data-module-menu-toggle]")?.setAttribute("aria-expanded", "false");
  }

  if (agendaSubnav && parentView !== "agenda") {
    agendaSubnav.classList.remove("open");
    document.querySelector("[data-agenda-menu-toggle]")?.setAttribute("aria-expanded", "false");
  }
  if (agendaSubnav && parentView === "agenda") {
    agendaSubnav.classList.add("open");
    document.querySelector("[data-agenda-menu-toggle]")?.setAttribute("aria-expanded", "true");
  }

  if (settingsSubnav && parentView !== "settings") {
    settingsSubnav.classList.remove("open");
    document.querySelector("[data-settings-menu-toggle]")?.setAttribute("aria-expanded", "false");
  }
  if (settingsSubnav && parentView === "settings") {
    settingsSubnav.classList.add("open");
    document.querySelector("[data-settings-menu-toggle]")?.setAttribute("aria-expanded", "true");
  }

  if (viewName !== "licencas") {
    document.querySelectorAll("[data-module-license-status]").forEach((item) => item.classList.remove("active"));
  }

  document.querySelectorAll("#module-subnav [data-view-target]").forEach((item) => {
    item.classList.toggle("active", item.dataset.viewTarget === viewName);
    if (item.dataset.viewTarget === "licencas") item.classList.toggle("parent-active", viewName === "licencas");
  });

  document.querySelectorAll("[data-dashboard-target]").forEach((item) => {
    item.classList.toggle("active", item.dataset.dashboardTarget === viewName);
  });

  document.querySelectorAll("[data-agenda-target]").forEach((item) => {
    item.classList.toggle("active", item.dataset.agendaTarget === viewName);
  });

  document.querySelectorAll("[data-settings-target]").forEach((item) => {
    item.classList.toggle("active", item.dataset.settingsTarget === viewName);
  });

  if (viewName === "profile-settings") fillProfileForm();
  if (viewName === "documentos-diversos") renderDiverseReminders();
  if (currentUser) sessionStorage.setItem(SESSION_VIEW_KEY, viewName);
}

navItems.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    if (!appShell?.classList.contains("sidebar-collapsed")) return;
    keepSidebarFlyoutOpen();
    renderSidebarFlyout(item);
  });
  item.addEventListener("mouseleave", () => {
    if (!appShell?.classList.contains("sidebar-collapsed")) return;
    scheduleSidebarFlyoutHide();
  });
  item.addEventListener("click", () => {
    const isAdminToggle = item.hasAttribute("data-admin-menu-toggle");
    const isAdminActive = item.classList.contains("active");
    const wasAdminOpen = adminSubnav?.classList.contains("open");
    const isDashboardToggle = item.hasAttribute("data-dashboard-menu-toggle");
    const isDashboardActive = item.classList.contains("active");
    const wasDashboardOpen = dashboardSubnav?.classList.contains("open");
    const isModuleToggle = item.hasAttribute("data-module-menu-toggle");
    const isModuleActive = item.classList.contains("active");
    const wasModuleOpen = moduleSubnav?.classList.contains("open");
    const isAgendaToggle = item.hasAttribute("data-agenda-menu-toggle");
    const isAgendaActive = item.classList.contains("active");
    const wasAgendaOpen = agendaSubnav?.classList.contains("open");
    const isSettingsToggle = item.hasAttribute("data-settings-menu-toggle");
    const isSettingsActive = item.classList.contains("active");
    const wasSettingsOpen = settingsSubnav?.classList.contains("open");

    openView(item.dataset.view);

    if (isAdminToggle && adminSubnav) {
      const shouldOpen = !isAdminActive || !wasAdminOpen;
      adminSubnav.classList.toggle("open", shouldOpen);
      item.setAttribute("aria-expanded", String(shouldOpen));
    }

    if (isDashboardToggle && dashboardSubnav) {
      const shouldOpen = !isDashboardActive || !wasDashboardOpen;
      dashboardSubnav.classList.toggle("open", shouldOpen);
      item.setAttribute("aria-expanded", String(shouldOpen));
    }

    if (isModuleToggle && moduleSubnav) {
      const shouldOpen = !isModuleActive || !wasModuleOpen;
      moduleSubnav.classList.toggle("open", shouldOpen);
      item.setAttribute("aria-expanded", String(shouldOpen));
    }

    if (isAgendaToggle && agendaSubnav) {
      const shouldOpen = !isAgendaActive || !wasAgendaOpen;
      agendaSubnav.classList.toggle("open", shouldOpen);
      item.setAttribute("aria-expanded", String(shouldOpen));
    }

    if (isSettingsToggle && settingsSubnav) {
      const shouldOpen = !isSettingsActive || !wasSettingsOpen;
      settingsSubnav.classList.toggle("open", shouldOpen);
      item.setAttribute("aria-expanded", String(shouldOpen));
    }

  });
});

sidebarFlyout?.addEventListener("mouseenter", keepSidebarFlyoutOpen);
sidebarFlyout?.addEventListener("mouseleave", scheduleSidebarFlyoutHide);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
  });
});

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => {
    openView(button.dataset.viewTarget);
    if (button.dataset.viewTarget === "licencas" && moduleSubnav) {
      moduleSubnav.classList.add("open");
      document.querySelector("[data-module-menu-toggle]")?.setAttribute("aria-expanded", "true");
      renderLicenseStatus("general");
      document.querySelectorAll("[data-module-license-status]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      button.classList.remove("parent-active");
    }
  });
});

function openAdminPanel(panelName) {
  document.querySelectorAll(".admin-link, .admin-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.adminTarget === panelName);
  });
  document.querySelectorAll(".admin-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `admin-${panelName}`);
  });
}

function openAdminSearchPanel(panelName) {
  openView("admin");
  if (adminSubnav) {
    adminSubnav.classList.add("open");
    document.querySelector("[data-admin-menu-toggle]")?.setAttribute("aria-expanded", "true");
  }
  openAdminPanel(panelName);
}

document.querySelectorAll("[data-admin-target]").forEach((button) => {
  button.addEventListener("click", () => {
    openView("admin");
    if (adminSubnav) {
      adminSubnav.classList.add("open");
      document.querySelector("[data-admin-menu-toggle]")?.setAttribute("aria-expanded", "true");
    }
    openAdminPanel(button.dataset.adminTarget);
  });
});

document.querySelectorAll("[data-dashboard-target]").forEach((button) => {
  button.addEventListener("click", () => {
    openView(button.dataset.dashboardTarget);
    if (dashboardSubnav) {
      dashboardSubnav.classList.add("open");
      document.querySelector("[data-dashboard-menu-toggle]")?.setAttribute("aria-expanded", "true");
    }
  });
});

document.querySelectorAll("[data-agenda-target]").forEach((button) => {
  button.addEventListener("click", () => {
    openView(button.dataset.agendaTarget);
    if (agendaSubnav) {
      agendaSubnav.classList.add("open");
      document.querySelector("[data-agenda-menu-toggle]")?.setAttribute("aria-expanded", "true");
    }
  });
});

document.querySelectorAll("[data-settings-target]").forEach((button) => {
  button.addEventListener("click", () => {
    openView(button.dataset.settingsTarget);
    if (settingsSubnav) {
      settingsSubnav.classList.add("open");
      document.querySelector("[data-settings-menu-toggle]")?.setAttribute("aria-expanded", "true");
    }
  });
});

const globalSearchInput = document.querySelector("#global-search-input");
const globalSearchResults = document.querySelector("#global-search-results");

const searchableEnvironments = [
  { code: "00", title: "Home", detail: "Entrada principal do sistema", permission: "home", action: () => openView("home") },
  { code: "01", title: "Painel Admin", detail: "Ambiente administrativo", permission: "admin", action: () => openView("admin") },
  { code: "01.1", title: "Usuários", detail: "Cadastro, acesso, senha e permissões", permission: "users", action: () => openAdminSearchPanel("usuarios-admin") },
  { code: "01.2.1", title: "Sócios", detail: "Sócios e responsáveis legais", permission: "registries", action: () => openAdminSearchPanel("socios-admin") },
  { code: "01.2.2", title: "Empresas e Filiais", detail: "Matrizes, filiais e sócios vinculados", permission: "registries", action: () => openAdminSearchPanel("empresas-filiais") },
  { code: "01.2.3", title: "Cidades", detail: "Cidades usadas nos imóveis", permission: "registries", action: () => openAdminSearchPanel("cidades-admin") },
  { code: "01.2.4", title: "Imóveis", detail: "Imóveis urbanos, rurais e proprietários", permission: "registries", action: () => openAdminSearchPanel("imoveis-admin") },
  { code: "01.2.4.1", title: "Urbanos", detail: "Listagem automática de imóveis urbanos", permission: "registries", action: () => openAdminSearchPanel("imoveis-urbanos-admin") },
  { code: "01.2.4.2", title: "Rurais", detail: "Listagem automática de imóveis rurais", permission: "registries", action: () => openAdminSearchPanel("imoveis-rurais-admin") },
  { code: "01.2.4.3", title: "Painel Imóveis", detail: "Indicadores ambientais dos imóveis rurais", permission: "registries", action: () => openAdminSearchPanel("painel-imoveis-admin") },
  { code: "01.2.5", title: "Empreendimento", detail: "Empresas vinculadas a imóveis", permission: "registries", action: () => openAdminSearchPanel("empreendimentos-admin") },
  { code: "01.2.6", title: "Atividades", detail: "Atividades, CNAE, CNPJ e CTF/APP", permission: "registries", action: () => openAdminSearchPanel("atividades-admin") },
  { code: "01.3.1", title: "Tipos de Licenças", detail: "Classificação ambiental", permission: "adminEnvironmental", action: () => openAdminSearchPanel("tipos-licencas") },
  { code: "01.3.2", title: "Documentos", detail: "Documentos ambientais por licença", permission: "adminEnvironmental", action: () => openAdminSearchPanel("documentos-ambientais") },
  { code: "01.3.3", title: "Modelos de Check-list", detail: "Modelos usados nos processos", permission: "adminEnvironmental", action: () => openAdminSearchPanel("modelos-checklist") },
  { code: "01.4.1", title: "E-mail do Sistema", detail: "Remetente oficial e domínio", permission: "admin", action: () => openAdminSearchPanel("email-sistema") },
  { code: "01.4.2", title: "E-mails por Módulo", detail: "Destinatários dos alertas", permission: "admin", action: () => openAdminSearchPanel("envios-admin") },
  { code: "01.4.3", title: "Histórico de Alertas", detail: "Status dos envios no Resend", permission: "admin", action: () => openAdminSearchPanel("historico-alertas") },
  { code: "01.5.1", title: "Backup", detail: "Frequencia, horario e armazenamento", permission: "admin", action: () => openAdminSearchPanel("backup-sistema") },
  { code: "02", title: "Painel Geral", detail: "Indicadores e prazos reais", permission: "dashboard", action: () => openView("dashboard") },
  { code: "02.1", title: "Painel Ambiental", detail: "Indicadores exclusivos ambientais", permission: "environmental", action: () => openView("dashboard-ambiental") },
  { code: "02.2", title: "Painel IPTU", detail: "Indicadores exclusivos de IPTU", permission: "iptu", action: () => openView("dashboard-iptu") },
  { code: "02.3", title: "Painel Agendamentos", detail: "Indicadores exclusivos da agenda", permission: "agenda", action: () => openView("dashboard-agendamentos") },
  { code: "03", title: "Módulos", detail: "Entrada dos módulos operacionais", permission: "modules", action: () => openView("modulos") },
  { code: "03.1", title: "Licenças Ambientais", detail: "Relatório geral de processos e licenças", permission: "environmental", action: () => openLicenseStatus("general") },
  { code: "03.1.1", title: "Abertas", detail: "Processos ambientais em aberto", permission: "environmental", action: () => openLicenseStatus("open") },
  { code: "03.1.2", title: "Pendentes", detail: "Processos pendentes", permission: "environmental", action: () => openLicenseStatus("pending") },
  { code: "03.1.3", title: "Vencidas", detail: "Processos e licenças vencidos", permission: "environmental", action: () => openLicenseStatus("expired") },
  { code: "03.1.4", title: "Concluídas", detail: "Processos concluídos", permission: "environmental", action: () => openLicenseStatus("done") },
  { code: "03.1.5", title: "Licenças", detail: "Licenças ambientais geradas", permission: "environmental", action: () => openLicenseStatus("licenses") },
  { code: "03.2", title: "IPTU", detail: "Guias, vencimentos e comprovantes", permission: "iptu", action: () => openView("iptu") },
  { code: "03.3", title: "Lembretes Diversos", detail: "Lembretes avulsos, prazos e alertas", permission: "diverseDocuments", action: () => openView("documentos-diversos") },
  { code: "04.1", title: "Calendário", detail: "Agenda em formato calendário", permission: "agenda", action: () => openView("agenda") },
  { code: "04.2", title: "Anotações", detail: "Agendamentos e alertas pendentes", permission: "agenda", action: () => openView("agenda-notes") },
  { code: "05.1", title: "Perfil", detail: "Dados cadastrais e senha do usuário", permission: "profile", action: () => openView("profile-settings") },
];

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function searchableProcessItems() {
  if (!canAccess("environmental")) return [];
  return environmentalProcesses.map((process) => ({
    code: process.internalNumber || process.number || "Processo",
    title: process.title || process.type || "Processo ambiental",
    detail: `${process.statusLabel || processStatusLabel(process.status)} - ${process.company || "Empresa não informada"} - ${process.type || "Licença ambiental"}`,
    kind: "Processo ambiental",
    permission: "environmental",
    action: () => {
      openLicenseStatus(process.status || "general");
      setTimeout(() => openEnvironmentalProcessDetail(process.id), 0);
    },
  }));
}

function globalSearchItems() {
  return [...searchableEnvironments, ...searchableProcessItems()].filter((item) => canAccess(item.permission));
}

function closeGlobalSearch() {
  if (!globalSearchResults) return;
  globalSearchResults.hidden = true;
  globalSearchResults.innerHTML = "";
}

function renderGlobalSearchResults() {
  if (!globalSearchInput || !globalSearchResults) return;
  const query = normalizeSearchText(globalSearchInput.value);
  if (query.length < 2) {
    closeGlobalSearch();
    return;
  }
  const results = globalSearchItems()
    .filter((item) => normalizeSearchText(`${item.code} ${item.title} ${item.detail} ${item.kind || "Ambiente"}`).includes(query))
    .slice(0, 10);

  globalSearchResults.hidden = false;
  globalSearchResults.innerHTML = results.length
    ? results
        .map(
          (item, index) => `
            <button type="button" data-global-search-index="${index}">
              <span>${escapeHtml(item.kind || "Ambiente")} ${escapeHtml(item.code)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.detail || "")}</small>
            </button>
          `,
        )
        .join("")
    : `<button type="button" disabled><span>Busca</span><strong>Nenhum resultado encontrado</strong><small>Digite outro termo ou número do ambiente.</small></button>`;
  globalSearchResults.dataset.results = JSON.stringify(results.map((item) => item.code));
  globalSearchResults.__docGestorResults = results;
}

globalSearchInput?.addEventListener("input", renderGlobalSearchResults);
globalSearchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGlobalSearch();
  if (event.key === "Enter") {
    const first = globalSearchResults?.__docGestorResults?.[0];
    if (first) {
      first.action();
      globalSearchInput.value = "";
      closeGlobalSearch();
    }
  }
});
globalSearchResults?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-global-search-index]");
  if (!button) return;
  const item = globalSearchResults.__docGestorResults?.[Number(button.dataset.globalSearchIndex)];
  if (!item) return;
  item.action();
  globalSearchInput.value = "";
  closeGlobalSearch();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".global-search")) closeGlobalSearch();
});

let agendaEvents = [];
let nextAgendaEventId = 100;
let diverseReminders = [];
let selectedDiverseReminderCompany = null;

let agendaCursor = new Date(2026, 4, 30);
let selectedAgendaDate = "2026-05-30";
let agendaLinkSelection = null;

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatAgendaDate(key, options = {}) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: options.long ? "long" : "2-digit",
    year: "numeric",
  }).format(parseDateKey(key));
}

function agendaEventsForDate(key) {
  return agendaEvents.filter((event) => event.date === key).sort((a, b) => a.time.localeCompare(b.time));
}

function addAgendaEvent(event) {
  if (!event?.date) return;
  if (event.alertKey) {
    agendaEvents = agendaEvents.filter((item) => item.alertKey !== event.alertKey);
  }
  const key = `${event.date}|${event.title}|${event.type}`;
  const exists = agendaEvents.some((item) => `${item.date}|${item.title}|${item.type}` === key);
  if (exists) return false;
  const agendaEvent = {
    id: nextAgendaEventId++,
    time: "09:00",
    status: "green",
    description: "Prazo registrado automaticamente pelo processo ambiental.",
    ...event,
  };
  agendaEvents.push(agendaEvent);
  persistAgendaEvent(agendaEvent);
  renderAgenda();
  renderAgendaNotes();
  return true;
}

function addDaysToDate(dateValue, days) {
  if (!dateValue) return "";
  const date = parseDateKey(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + Number(days || 0));
  return dateKey(date);
}

function subtractDaysFromDate(dateValue, days) {
  return addDaysToDate(dateValue, -Math.max(0, Number(days || 0)));
}

const diverseReminderAlertDefinitions = [
  { key: "deadline", label: "Vencimento", status: "danger" },
  { key: "minimum", label: "Prazo mínimo", status: "warning" },
  { key: "critical", label: "Prazo crítico", status: "warning" },
  { key: "urgent", label: "Prazo urgente", status: "danger" },
];

function selectedDiverseReminderFormat() {
  return Number(document.querySelector('input[name="diverse-reminder-format"]:checked')?.value || 1);
}

function diverseReminderCompanyLabel(companyId) {
  if (!companyId) return "";
  const company = companies.find((item) => sameId(item.id, companyId));
  if (!company) return "";
  return `${company.name}${company.cnpj ? ` - ${company.cnpj}` : ""}`;
}

function updateDiverseReminderCompanySummary() {
  const summary = field("diverse-reminder-company-summary");
  const companyId = field("diverse-reminder-company-id")?.value || selectedDiverseReminderCompany?.id || "";
  if (summary) summary.textContent = diverseReminderCompanyLabel(companyId) || "Nenhum estabelecimento selecionado.";
}

function renderDiverseReminderAlertFields(format = selectedDiverseReminderFormat()) {
  const wrapper = field("diverse-reminder-alert-fields");
  if (!wrapper) return;
  wrapper.innerHTML = diverseReminderAlertDefinitions
    .slice(0, format)
    .map((definition) => `
      <label>${definition.label}
        <input id="diverse-reminder-${definition.key}-date" type="date" />
      </label>
      <label>Horário - ${definition.label}
        <input id="diverse-reminder-${definition.key}-time" type="time" value="09:00" />
      </label>
    `)
    .join("");
}

function diverseReminderAlertRowsFromForm() {
  return diverseReminderAlertDefinitions
    .slice(0, selectedDiverseReminderFormat())
    .map((definition) => ({
      ...definition,
      date: field(`diverse-reminder-${definition.key}-date`)?.value || "",
      time: field(`diverse-reminder-${definition.key}-time`)?.value || "09:00",
    }))
    .filter((alert) => alert.date);
}

function fillDiverseReminderAlertFields(alerts = []) {
  alerts.forEach((alert) => {
    if (field(`diverse-reminder-${alert.key}-date`)) field(`diverse-reminder-${alert.key}-date`).value = alert.date || "";
    if (field(`diverse-reminder-${alert.key}-time`)) field(`diverse-reminder-${alert.key}-time`).value = alert.time || "09:00";
  });
}

function diverseReminderAlertKey(reminder, alert, repeatIndex = 0) {
  return `${reminder.id}|diverse-reminder|${alert.key}|${repeatIndex}`;
}

function diverseReminderMessageHtml(reminder, alert, dateValue) {
  return `
    <p>Este é um email automático do <strong>DocGestor by Carminatti</strong>.</p>
    <p>Verifique o lembrete abaixo para não perder nenhum prazo.</p>
    <table style="border-collapse:collapse;margin-top:16px;width:100%;max-width:620px">
      <tbody>
        <tr><td style="border:1px solid #dde2e6;padding:8px 10px;width:170px"><strong>Lembrete:</strong></td><td style="border:1px solid #dde2e6;padding:8px 10px">${escapeHtml(reminder.name)}</td></tr>
        <tr><td style="border:1px solid #dde2e6;padding:8px 10px"><strong>Estabelecimento:</strong></td><td style="border:1px solid #dde2e6;padding:8px 10px">${escapeHtml(reminder.companyLabel || "Não vinculado")}</td></tr>
        <tr><td style="border:1px solid #dde2e6;padding:8px 10px"><strong>Tipo de aviso:</strong></td><td style="border:1px solid #dde2e6;padding:8px 10px">${escapeHtml(alert.label)}</td></tr>
        <tr><td style="border:1px solid #dde2e6;padding:8px 10px"><strong>Data:</strong></td><td style="border:1px solid #dde2e6;padding:8px 10px">${escapeHtml(formatAgendaDate(dateValue))}</td></tr>
        <tr><td style="border:1px solid #dde2e6;padding:8px 10px"><strong>Descrição:</strong></td><td style="border:1px solid #dde2e6;padding:8px 10px">${escapeHtml(reminder.description || "Sem descrição.")}</td></tr>
      </tbody>
    </table>
  `;
}

function addDiverseReminderAlertHistory(reminder, alert, dateValue, recipient = null, status = "waiting", repeatIndex = 0) {
  const alertKey = diverseReminderAlertKey(reminder, alert, repeatIndex);
  const localId = `${alertKey}|${recipient?.email || "module"}`;
  if (alertHistoryItems.some((item) => item.id === localId || (item.alert_key === alertKey && (!recipient?.email || item.recipient_emails?.includes(recipient.email))))) return;
  alertHistoryItems.unshift({
    id: localId,
    alert_key: alertKey,
    subject: "Alerta de Prazo",
    recipient_emails: recipient?.email ? [recipient.email] : [],
    sender_email: systemEmailConfig.address,
    status,
    status_label: status === "sent" ? "Enviado" : "Aguardando",
    related_type: "diverse_reminder",
    related_id: reminder.id,
    related_label: reminder.name,
    created_at: new Date().toISOString(),
    sent_at: status === "sent" ? new Date().toISOString() : null,
    message_html: diverseReminderMessageHtml(reminder, alert, dateValue),
    raw_payload: {
      scheduled_for: `${dateValue}T${alert.time || "09:00"}:00`,
      alert_type: alert.key,
      reminder_name: reminder.name,
    },
  });
  renderAlertHistory(alertHistoryItems);
}

function daysBetweenDates(startDateValue, endDateValue) {
  if (!startDateValue || !endDateValue) return 0;
  const start = parseDateKey(startDateValue);
  const end = parseDateKey(endDateValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end - start) / 86400000));
}

function environmentalAlertRecipients() {
  return activeModuleRecipients("environmental").filter((recipient) => sendRecipientModules(recipient).includes("environmental"));
}

function companyCnpjByName(companyName) {
  return companies.find((company) => company.name === companyName)?.cnpj || "";
}

function stageKindLabel(stage) {
  if (stage?.stageKind === "checklist" || isDocumentStage(stage)) return "Check-list";
  if (stage?.stageKind === "protocol" || isProtocolStage(stage)) return "Protocolo";
  if (stage?.stageKind === "license" || isLicenseStage(stage)) return "Licença";
  return stage?.name || "Etapa";
}

function alertSubjectByType(alertType, alertLabel) {
  return "Alerta de Prazo";
}

function environmentalAlertMessage(process, stage, alertLabel) {
  const processNumber = process.internalNumber || process.number || "Processo";
  const cnpj = companyCnpjByName(process.company);
  const companyText = `${process.company || "empresa não informada"}${cnpj ? ` - CNPJ ${cnpj}` : ""}`;
  return `Alerta de ${alertLabel} referente a etapa ${stageKindLabel(stage)}, Bloco ${stage.blockNumber || 1} do processo nº ${processNumber} do empreendimento ${process.title || process.enterprise || "não informado"} da empresa ${companyText}. Favor verificar para dar continuidade no processo`;
}

function firstFilledValue(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function alertProtocolValue(process, stage = {}) {
  const currentRecord = stage?.number ? stageRecord(process, stage.number) : {};
  const previousProtocol = stage?.number ? protocolForLicenseStage(process, stage.number) : "";
  const anyProtocol = ensureProcessStages(process)
    .map((item) => stageRecord(process, item.number).protocolNumber)
    .find((value) => String(value || "").trim());
  return firstFilledValue(currentRecord.protocolNumber, previousProtocol, anyProtocol);
}

function alertLicenseValue(process, stage = {}) {
  const currentRecord = stage?.number ? stageRecord(process, stage.number) : {};
  const anyLicense = ensureProcessStages(process)
    .map((item) => stageRecord(process, item.number).licenseNumber)
    .find((value) => String(value || "").trim());
  return firstFilledValue(currentRecord.licenseNumber, process.activeLicense?.number, anyLicense);
}

function alertInfoValue(value, fallback = "em andamento") {
  return String(value || "").trim() || fallback;
}

function environmentalAlertHtmlBody(alertInfo) {
  const rows = [
    ["Alerta", alertInfo.alertLabel],
    ["Processo", alertInfo.processNumber],
    ["Licença", alertInfo.licenseNumber],
    ["Protocolo", alertInfo.protocolNumber],
    ["Empresa", alertInfo.companyName],
    ["Empreendimento", alertInfo.enterpriseName],
    ["Etapa", alertInfo.stageKindLabel || alertInfo.stageName],
    ["Tipo de alerta", alertInfo.alertTypeLabel],
    ["Data", formatAgendaDate(alertInfo.date)],
  ];
  return `
    <p>Este é um email automático do <strong>DocGestor by Carminatti</strong>, verifique o processo abaixo com extrema urgência para não perder nenhum prazo.</p>
    <table style="border-collapse:collapse;margin-top:16px;width:100%;max-width:620px">
      <tbody>
        ${rows.map(([label, value]) => `
          <tr>
            <td style="border:1px solid #dde2e6;padding:8px 10px;width:170px"><strong>${escapeHtml(label)}:</strong></td>
            <td style="border:1px solid #dde2e6;padding:8px 10px">${escapeHtml(alertInfoValue(value))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function environmentalStageAlertKey(process, stage, alertType) {
  return `${process.id || process.internalNumber}|bloco-${stage.blockNumber || 1}|${stage.stageKind || stageKindLabel(stage).toLowerCase()}|${alertType}`;
}

function environmentalProcessAlertKey(process, alertType = "process_deadline") {
  return `${process.id || process.internalNumber}|processo|${alertType}`;
}

function environmentalLicenseAlertKey(license, alertType) {
  return `${license.processId || license.processNumber}|licenca-${license.stageNumber || "ativa"}|${alertType}`;
}

function alertMessageHtml(alertInfo) {
  return environmentalAlertHtmlBody(alertInfo);
}

function scheduledDateTime(alertInfo) {
  return new Date(`${alertInfo.date}T${alertInfo.time || "09:00"}:00`);
}

function scheduledDateTimeFromValues(dateValue, timeValue = "09:00") {
  if (!dateValue) return null;
  const scheduled = new Date(`${dateValue}T${timeValue || "09:00"}:00`);
  return Number.isNaN(scheduled.getTime()) ? null : scheduled;
}

function scheduleIsInFuture(dateValue, timeValue = "09:00") {
  const scheduled = scheduledDateTimeFromValues(dateValue, timeValue);
  return scheduled && scheduled > new Date();
}

function validateFutureSchedule(dateValue, timeValue, label) {
  if (!dateValue) return true;
  if (scheduleIsInFuture(dateValue, timeValue)) return true;
  alert(`${label} deve ser posterior à data e hora atual.`);
  return false;
}

function shouldSendAlertNow(alertInfo) {
  const scheduled = scheduledDateTime(alertInfo);
  return !Number.isNaN(scheduled.getTime()) && scheduled <= new Date();
}

function addLocalAlertHistory(alertInfo, recipient = null, status = "waiting") {
  const recipientEmails = recipient?.email ? [recipient.email] : [];
  const localId = `${alertInfo.alertKey || alertInfo.alertType || "alert"}|${recipient?.email || "module"}|${alertInfo.date}|${alertInfo.time || "09:00"}`;
  if (alertHistoryItems.some((item) => item.id === localId)) return;
  alertHistoryItems.unshift({
    id: localId,
    alert_key: alertInfo.alertKey || "",
    subject: alertInfo.subject,
    recipient_emails: recipientEmails,
    sender_email: systemEmailConfig.address,
    status,
    status_label: status === "sent" ? "Enviado" : "Aguardando",
    related_label: alertInfo.relatedLabel || "",
    created_at: new Date().toISOString(),
    sent_at: status === "sent" ? new Date().toISOString() : null,
    message_html: alertMessageHtml(alertInfo),
    raw_payload: { message: alertInfo.message },
  });
  renderAlertHistory(alertHistoryItems);
}

async function persistAlertHistoryOnly(alertInfo, status = "waiting") {
  addLocalAlertHistory(alertInfo, null, status);
  if (!window.DocGestorDB) return;
  try {
    if (alertInfo.alertKey) {
      await window.DocGestorDB.removeWhere("alert_history", `alert_key=eq.${encodeURIComponent(alertInfo.alertKey)}&status=eq.waiting`);
    }
    await window.DocGestorDB.create("alert_history", {
      alert_key: alertInfo.alertKey || null,
      recipient_id: null,
      module_id: "environmental",
      subject: alertInfo.subject,
      sender_email: systemEmailConfig.address,
      recipient_emails: [],
      status,
      status_label: status === "sent" ? "Enviado" : "Aguardando",
      related_type: alertInfo.relatedType || "environmental_process",
      related_id: looksLikeUuid(alertInfo.relatedId) ? alertInfo.relatedId : null,
      related_label: alertInfo.relatedLabel,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      message_html: alertMessageHtml(alertInfo),
      raw_payload: {
        scheduled_for: `${alertInfo.date}T${alertInfo.time || "09:00"}:00`,
        alert_type: alertInfo.alertType,
        message: alertInfo.message,
      },
    });
  } catch (error) {
    console.warn("Não foi possível salvar o histórico do alerta no Supabase.", error.message);
  }
}

async function sendEnvironmentalAlertEmail(alertInfo, recipient) {
  if (!recipient?.email) return false;
  try {
    const response = await fetch("/api/enviar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipient.email,
        fromName: systemEmailConfig.name,
        fromEmail: systemEmailConfig.address,
        subject: alertInfo.subject,
        html: alertMessageHtml(alertInfo),
      }),
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && result.success !== false;
  } catch (error) {
    console.warn("Não foi possível enviar o alerta ambiental agora.", error.message);
    return false;
  }
}

async function persistAgendaEvent(event) {
  if (!window.DocGestorDB || !event?.date || looksLikeUuid(event.id)) return;
  try {
    if (event.alertKey) {
      await window.DocGestorDB.removeWhere("agenda_events", `alert_key=eq.${encodeURIComponent(event.alertKey)}&status=eq.waiting`);
    }
    const [saved] = await window.DocGestorDB.create("agenda_events", {
      alert_key: event.alertKey || null,
      event_date: event.date,
      event_time: event.time || "09:00",
      title: event.title,
      description: event.description || "",
      module_id: event.module || "environmental",
      status: event.alertStatus || "waiting",
      related_type: event.linkedTarget?.type || event.relatedType || null,
      related_id: looksLikeUuid(event.linkedTarget?.id || event.relatedId) ? event.linkedTarget?.id || event.relatedId : null,
    });
    if (saved?.id) event.id = saved.id;
  } catch (error) {
    console.warn("Não foi possível salvar o agendamento no Supabase.", error.message);
  }
}

async function deletePendingAlertKey(alertKey) {
  if (!alertKey) return;
  agendaEvents = agendaEvents.filter((event) => event.alertKey !== alertKey);
  alertHistoryItems = alertHistoryItems.filter((item) => item.alert_key !== alertKey && item.id !== alertKey);
  if (window.DocGestorDB) {
    const encodedKey = encodeURIComponent(alertKey);
    try {
      await Promise.all([
        window.DocGestorDB.removeWhere("alert_queue", `alert_key=eq.${encodedKey}&status=eq.pending`),
        window.DocGestorDB.removeWhere("alert_history", `alert_key=eq.${encodedKey}&status=eq.waiting`),
        window.DocGestorDB.removeWhere("agenda_events", `alert_key=eq.${encodedKey}&status=eq.waiting`),
      ]);
    } catch (error) {
      console.warn("Não foi possível cancelar alertas pendentes no Supabase.", error.message);
    }
  }
}

async function cancelPendingAlertsForStage(process, stage) {
  const alertTypes = ["minimum", "critical", "emergency", "deadline"];
  await Promise.all(alertTypes.map((alertType) => deletePendingAlertKey(environmentalStageAlertKey(process, stage, alertType))));
  renderAgenda();
  renderAlertHistory(alertHistoryItems);
}

async function cancelPendingAlertsForBlock(process, blockNumber) {
  const stages = ensureProcessStages(process).filter((stage) => (stage.blockNumber || 1) === blockNumber);
  await Promise.all(stages.map((stage) => cancelPendingAlertsForStage(process, stage)));
}

async function persistAlertQueueItem(alertInfo, recipient) {
  const scheduledFor = `${alertInfo.date}T${alertInfo.time || "09:00"}:00`;
  const dueNow = shouldSendAlertNow(alertInfo);
  let status = dueNow ? "sent" : "waiting";
  if (dueNow && recipient?.email) {
    const sent = await sendEnvironmentalAlertEmail(alertInfo, recipient);
    status = sent ? "sent" : "waiting";
  }
  addLocalAlertHistory(alertInfo, recipient, status);
  if (!window.DocGestorDB || !looksLikeUuid(recipient?.id)) return;
  try {
    if (alertInfo.alertKey) {
      const key = encodeURIComponent(alertInfo.alertKey);
      await Promise.all([
        window.DocGestorDB.removeWhere("alert_queue", `alert_key=eq.${key}&recipient_id=eq.${encodeURIComponent(recipient.id)}&status=eq.pending`),
        window.DocGestorDB.removeWhere("alert_history", `alert_key=eq.${key}&recipient_id=eq.${encodeURIComponent(recipient.id)}&status=eq.waiting`),
      ]);
    }
    await window.DocGestorDB.create("alert_queue", {
      alert_key: alertInfo.alertKey || null,
      module_id: "environmental",
      recipient_id: recipient.id,
      related_type: alertInfo.relatedType || "environmental_process",
      related_id: looksLikeUuid(alertInfo.relatedId) ? alertInfo.relatedId : null,
      related_label: alertInfo.relatedLabel,
      subject: alertInfo.subject,
      message_html: alertMessageHtml(alertInfo),
      status: status === "sent" ? "sent" : "pending",
      scheduled_for: scheduledFor,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
    await window.DocGestorDB.create("alert_history", {
      alert_key: alertInfo.alertKey || null,
      recipient_id: recipient.id,
      module_id: "environmental",
      subject: alertInfo.subject,
      sender_email: systemEmailConfig.address,
      recipient_emails: [recipient.email],
      status,
      status_label: status === "sent" ? "Enviado" : "Aguardando",
      related_type: alertInfo.relatedType || "environmental_process",
      related_id: looksLikeUuid(alertInfo.relatedId) ? alertInfo.relatedId : null,
      related_label: alertInfo.relatedLabel,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      message_html: alertMessageHtml(alertInfo),
      raw_payload: {
        scheduled_for: scheduledFor,
        alert_type: alertInfo.alertType,
        block_number: alertInfo.blockNumber || null,
        stage_kind: alertInfo.stageKind || null,
      },
    });
  } catch (error) {
    console.warn("Não foi possível salvar o alerta no Supabase.", error.message);
  }
}

function scheduleEnvironmentalAlert(alertInfo) {
  if (!alertInfo?.date) return;
  const linkedTarget = {
    id: String(alertInfo.relatedId || alertInfo.processId || ""),
    module: "environmental",
    type: alertInfo.relatedType || "process",
    label: alertInfo.relatedLabel || alertInfo.processNumber,
    detail: alertInfo.stageName,
  };
  const added = addAgendaEvent({
    date: alertInfo.date,
    time: alertInfo.time || "09:00",
    title: alertInfo.title,
    type: "Licenças Ambientais",
    status: alertInfo.status || "warning",
    alertStatus: "waiting",
    description: alertInfo.message,
    module: "environmental",
    relatedType: alertInfo.relatedType || "environmental_process",
    relatedId: alertInfo.relatedId,
    alertKey: alertInfo.alertKey,
    linkedTarget,
  });
  if (!added) return;
  const recipients = environmentalAlertRecipients();
  if (!recipients.length) {
    persistAlertHistoryOnly(alertInfo, "waiting");
    return;
  }
  recipients.forEach((recipient) => persistAlertQueueItem(alertInfo, recipient));
}

async function persistDiverseReminderAlert(reminder, alert, dateValue, repeatIndex = 0) {
  const recipients = await ensureModuleAlertRecipients("diverse-documents");
  const alertKey = diverseReminderAlertKey(reminder, alert, repeatIndex);
  const scheduledFor = `${dateValue}T${alert.time || "09:00"}:00`;
  const messageHtml = diverseReminderMessageHtml(reminder, alert, dateValue);
  addAgendaEvent({
    alertKey,
    date: dateValue,
    time: alert.time || "09:00",
    title: `${alert.label} - ${reminder.name}`,
    type: "Lembretes Diversos",
    status: alert.status,
    description: reminder.description || "Lembrete diverso.",
    module: "diverse-documents",
    alertStatus: "waiting",
    relatedType: "diverse_reminder",
    relatedId: reminder.id,
    linkedTarget: {
      id: reminder.id,
      type: "diverse_reminder",
      module: "diverse-documents",
      label: reminder.name,
    },
  });
  if (!recipients.length) {
    addDiverseReminderAlertHistory(reminder, alert, dateValue, null, "waiting", repeatIndex);
    if (window.DocGestorDB) {
      try {
        await window.DocGestorDB.removeWhere("alert_history", `alert_key=eq.${encodeURIComponent(alertKey)}&status=eq.waiting`);
        await window.DocGestorDB.create("alert_history", {
          alert_key: alertKey,
          recipient_id: null,
          module_id: "diverse-documents",
          subject: "Alerta de Prazo",
          sender_email: systemEmailConfig.address,
          recipient_emails: [],
          status: "waiting",
          status_label: "Aguardando",
          related_type: "diverse_reminder",
          related_id: looksLikeUuid(reminder.id) ? reminder.id : null,
          related_label: reminder.name,
          message_html: messageHtml,
          raw_payload: {
            scheduled_for: scheduledFor,
            alert_type: alert.key,
            reminder_name: reminder.name,
            warning: "Nenhum destinatário ativo configurado para o módulo 03.3.",
          },
        });
      } catch (error) {
        console.warn("Não foi possível salvar histórico de lembrete diverso no Supabase.", error.message);
      }
    }
    return;
  }
  if (!window.DocGestorDB) {
    recipients.forEach((recipient) => addDiverseReminderAlertHistory(reminder, alert, dateValue, recipient, "waiting", repeatIndex));
    return;
  }
  await Promise.all(recipients.map(async (recipient) => {
    if (!looksLikeUuid(recipient.id)) return;
    addDiverseReminderAlertHistory(reminder, alert, dateValue, recipient, "waiting", repeatIndex);
    try {
      await window.DocGestorDB.removeWhere("alert_queue", `alert_key=eq.${encodeURIComponent(alertKey)}&recipient_id=eq.${encodeURIComponent(recipient.id)}&status=eq.pending`);
      await window.DocGestorDB.create("alert_queue", {
        alert_key: alertKey,
        module_id: "diverse-documents",
        recipient_id: recipient.id,
        related_type: "diverse_reminder",
        related_id: looksLikeUuid(reminder.id) ? reminder.id : null,
        related_label: reminder.name,
        subject: "Alerta de Prazo",
        message_html: messageHtml,
        status: "pending",
        scheduled_for: scheduledFor,
      });
      await window.DocGestorDB.removeWhere("alert_history", `alert_key=eq.${encodeURIComponent(alertKey)}&recipient_id=eq.${encodeURIComponent(recipient.id)}&status=eq.waiting`);
      await window.DocGestorDB.create("alert_history", {
        alert_key: alertKey,
        recipient_id: recipient.id,
        module_id: "diverse-documents",
        subject: "Alerta de Prazo",
        sender_email: systemEmailConfig.address,
        recipient_emails: [recipient.email],
        status: "waiting",
        status_label: "Aguardando",
        related_type: "diverse_reminder",
        related_id: looksLikeUuid(reminder.id) ? reminder.id : null,
        related_label: reminder.name,
        message_html: messageHtml,
        raw_payload: {
          scheduled_for: scheduledFor,
          alert_type: alert.key,
          reminder_name: reminder.name,
        },
      });
    } catch (error) {
      console.warn("Não foi possível salvar alerta de lembrete diverso no Supabase.", error.message);
    }
  }));
}

async function scheduleDiverseReminderAlerts(reminder) {
  const repeatEnabled = Boolean(reminder.repeat?.enabled);
  const repeatCount = repeatEnabled ? Math.max(1, Number(reminder.repeat.count || 1)) : 1;
  const intervalDays = repeatEnabled ? Math.max(1, Number(reminder.repeat.intervalDays || 30)) : 0;
  for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
    await Promise.all((reminder.alerts || []).map((alert) => {
      const dateValue = repeatIndex ? addDaysToDate(alert.date, intervalDays * repeatIndex) : alert.date;
      return persistDiverseReminderAlert(reminder, alert, dateValue, repeatIndex);
    }));
  }
}

async function cancelDiverseReminderPendingAlerts(reminder) {
  const repeatEnabled = Boolean(reminder.repeat?.enabled);
  const repeatCount = repeatEnabled ? Math.max(1, Number(reminder.repeat.count || 1)) : 1;
  const keys = [];
  for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
    (reminder.alerts || []).forEach((alert) => keys.push(diverseReminderAlertKey(reminder, alert, repeatIndex)));
  }
  await Promise.all(keys.map(deletePendingAlertKey));
  agendaEvents = agendaEvents.filter((eventItem) => String(eventItem.relatedId || eventItem.linkedTarget?.id || "") !== String(reminder.id));
  alertHistoryItems = alertHistoryItems.filter((item) => String(item.related_id || item.relatedId || "") !== String(reminder.id) || String(item.status || "") === "sent");
}

function scheduleStageAlerts(process, stage) {
  if (!stage?.validityDate) return;
  const processNumber = process.internalNumber || process.number || "Processo";
  const blockNumber = stage.blockNumber || 1;
  const stageKind = stage.stageKind || stageKindLabel(stage).toLowerCase();
  const base = {
    processId: process.id,
    processNumber,
    stageName: stage.name,
    stageKindLabel: stageKindLabel(stage),
    blockNumber,
    stageKind,
    companyName: process.company || "não informada",
    enterpriseName: process.title || process.enterprise || "não informado",
    licenseNumber: alertLicenseValue(process, stage),
    protocolNumber: alertProtocolValue(process, stage),
    alertTypeLabel: "Prazo",
    relatedId: process.id,
    relatedType: "environmental_process",
    relatedLabel: `${processNumber} - ${stage.name}`,
  };
  const stageAlerts = [
    ["minimum", "Prazo Mínimo", stage.warningDays, stage.warningTime || "09:00", "warning"],
    ["critical", "Crítico", stage.criticalDays, stage.criticalTime || "09:00", "warning"],
    ["emergency", "Emergência", stage.emergencyDays, stage.emergencyTime || "09:00", "danger"],
    ["deadline", "Vencimento", 0, stage.deadlineTime || "09:00", "danger"],
  ];
  stageAlerts.forEach(([alertType, alertLabel, days, time, status]) => {
    const date = subtractDaysFromDate(stage.validityDate, days);
    scheduleEnvironmentalAlert({
      ...base,
      alertType,
      alertLabel,
      alertKey: environmentalStageAlertKey(process, stage, alertType),
      date,
      time,
      status,
      title: `${alertLabel} - Bloco ${blockNumber} - ${processNumber}`,
      subject: alertSubjectByType(alertType, alertLabel),
      message: environmentalAlertMessage(process, stage, alertLabel),
    });
  });
}

function scheduleLicenseAlerts(process, stage, license) {
  if (!license?.expiryDate) return;
  const renewalDays = stage.renewalDays ?? 120;
  const processNumber = process.internalNumber || process.number || "Processo";
  scheduleEnvironmentalAlert({
    processId: process.id,
    processNumber,
    stageName: stage.name,
    stageKindLabel: stageKindLabel(stage),
    blockNumber: stage.blockNumber || 1,
    stageKind: stage.stageKind || "license",
    companyName: process.company || "não informada",
    enterpriseName: process.title || process.enterprise || "não informado",
    licenseNumber: license.number,
    protocolNumber: license.protocol || alertProtocolValue(process, stage),
    alertTypeLabel: "Renovação",
    relatedId: process.id,
    relatedType: "environmental_license",
    relatedLabel: `${license.number} - ${license.type}`,
    alertType: "renewal",
    alertLabel: "Renovação",
    alertKey: environmentalLicenseAlertKey(license, "renewal"),
    date: subtractDaysFromDate(license.expiryDate, renewalDays),
    time: stage.renewalTime || "09:00",
    status: "warning",
    title: `Renovação - ${license.number}`,
    subject: alertSubjectByType("renewal", "Renovação"),
    message: `Alerta de Renovação referente a licença ${license.number}, Bloco ${stage.blockNumber || 1} do processo nº ${processNumber} do empreendimento ${process.title || process.enterprise || "não informado"} da empresa ${process.company || "não informada"}. Favor verificar para dar continuidade no processo`,
  });
}

function validateStageAlertSchedules(process, stage) {
  if (!stage?.validityDate) return true;
  if (!isLicenseStage(stage) && dateIsAfter(stage.validityDate, process.acquisitionDueDate)) {
    alert("A data de vencimento da etapa não pode ser superior à data final do processo.");
    return false;
  }
  const checks = [
    ["Prazo mínimo", subtractDaysFromDate(stage.validityDate, stage.warningDays), stage.warningTime || "09:00"],
    ["Prazo crítico", subtractDaysFromDate(stage.validityDate, stage.criticalDays), stage.criticalTime || "09:00"],
    ["Emergência", subtractDaysFromDate(stage.validityDate, stage.emergencyDays), stage.emergencyTime || "09:00"],
    ["Vencimento da etapa", stage.validityDate, stage.deadlineTime || "09:00"],
  ];
  if (isLicenseStage(stage) && field("environmental-stage-license-expiry")?.value) {
    checks.unshift(["Renovação", subtractDaysFromDate(field("environmental-stage-license-expiry").value, stage.renewalDays), stage.renewalTime || "09:00"]);
  }
  const invalid = checks.find(([, dateValue, timeValue]) => dateValue && !scheduleIsInFuture(dateValue, timeValue));
  if (invalid) {
    alert(`${invalid[0]} ficou com data ou horário retroativo. Ajuste o vencimento, a quantidade de dias ou o horário do aviso.`);
    return false;
  }
  return true;
}

const stageAlertFieldKeys = ["warning", "critical", "emergency", "renewal"];

function syncStageAlertDateFromDays(key) {
  const validityDate = field("environmental-stage-validity-date")?.value || "";
  const daysInput = field(`environmental-stage-${key}-days`);
  const dateInput = field(`environmental-stage-${key}-date`);
  if (!daysInput || !dateInput || !validityDate) {
    if (dateInput && !validityDate) dateInput.value = "";
    return;
  }
  const days = Math.max(0, Number(daysInput.value || 0));
  if (Number(daysInput.value || 0) < 0) daysInput.value = "0";
  dateInput.value = subtractDaysFromDate(validityDate, days);
}

function syncStageAlertDaysFromDate(key) {
  const validityDate = field("environmental-stage-validity-date")?.value || "";
  const daysInput = field(`environmental-stage-${key}-days`);
  const dateInput = field(`environmental-stage-${key}-date`);
  if (!daysInput || !dateInput || !validityDate || !dateInput.value) return;
  daysInput.value = daysBetweenDates(dateInput.value, validityDate);
}

function syncAllStageAlertDates() {
  stageAlertFieldKeys.forEach(syncStageAlertDateFromDays);
}

function stageDeadlineConfigured(stage) {
  return Boolean(stage?.validityDate);
}

function updateStageDeadlineToggle(stage) {
  const button = field("environmental-stage-deadline-toggle");
  const panel = field("environmental-stage-deadline-fields");
  if (!button || !panel) return;
  const configured = stageDeadlineConfigured(stage);
  button.classList.toggle("configured", configured);
  button.textContent = configured ? "Vencimento adicionado" : "Adicionar vencimento";
}

function openStageDeadlinePanel(open = true) {
  const panel = field("environmental-stage-deadline-fields");
  if (panel) panel.hidden = !open;
}

function agendaLinkedText(linkedTarget) {
  return linkedTarget?.label || "Nenhum processo ou licença selecionado.";
}

function updateAgendaLinkBox() {
  const enabled = field("agenda-note-link-enabled")?.checked;
  const box = field("agenda-note-link-box");
  const summary = field("agenda-note-link-summary");
  if (box) box.hidden = !enabled;
  if (summary) summary.textContent = enabled ? agendaLinkedText(agendaLinkSelection) : "Nenhum processo ou licença selecionado.";
}

function pendingAgendaEvents() {
  return [...agendaEvents]
    .filter((event) => event.status !== "done")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function fillAgendaNoteForm(eventItem) {
  if (!eventItem) return;
  agendaLinkSelection = eventItem.linkedTarget || null;
  field("agenda-note-id").value = eventItem.id;
  field("agenda-note-title").value = eventItem.title || "";
  field("agenda-note-date").value = eventItem.date || dateKey(new Date());
  field("agenda-note-time").value = eventItem.time || "09:00";
  field("agenda-note-type").value = eventItem.type || "Ambiental";
  field("agenda-note-status").value = eventItem.status === "done" ? "green" : eventItem.status || "green";
  field("agenda-note-description").value = eventItem.description || "";
  field("agenda-note-link-enabled").checked = Boolean(eventItem.linkedTarget);
  field("agenda-note-link-module").value = eventItem.linkedTarget?.module || "environmental";
  updateAgendaLinkBox();
}

function openAgendaNoteModal(eventItem = null) {
  const item = eventItem || {
    id: Date.now(),
    title: "",
    date: selectedAgendaDate || dateKey(new Date()),
    time: "09:00",
    type: "Ambiental",
    status: "green",
    description: "",
  };
  fillAgendaNoteForm(item);
  field("agenda-note-modal-title").textContent = eventItem ? "Editar agendamento" : "Novo agendamento";
  openModal("agenda-note-modal");
}

function saveAgendaNote() {
  const id = field("agenda-note-id").value;
  const existing = agendaEvents.find((event) => sameId(event.id, id));
  const payload = {
    id: id || nextAgendaEventId++,
    title: field("agenda-note-title").value || "Agendamento sem titulo",
    date: field("agenda-note-date").value || dateKey(new Date()),
    time: field("agenda-note-time").value || "09:00",
    type: field("agenda-note-type").value || "Ambiental",
    status: field("agenda-note-status").value || "green",
    description: field("agenda-note-description").value || "Sem descricao.",
    linkedTarget: field("agenda-note-link-enabled").checked ? agendaLinkSelection : null,
  };
  if (existing) Object.assign(existing, payload);
  else agendaEvents.push(payload);
  closeModal("agenda-note-modal");
  renderAgenda();
  renderAgendaNotes();
}

function renderAgendaNotes() {
  const list = field("agenda-note-list");
  const count = field("agenda-note-count");
  if (!list || !count) return;
  const items = pendingAgendaEvents();
  count.textContent = `${items.length} itens`;
  list.innerHTML = items.length
    ? items
        .map(
          (eventItem) => `
            <article>
              <div>
                <strong>${eventItem.title}</strong>
                <span>${formatAgendaDate(eventItem.date)} - ${eventItem.time}</span>
              </div>
              <div>
                <strong>${eventItem.type}</strong>
                <span>${eventItem.description || "Sem descricao"}</span>
                ${eventItem.linkedTarget ? `<span>Vínculo: ${eventItem.linkedTarget.label}</span>` : ""}
                <span class="pill ${eventItem.status === "danger" ? "red" : eventItem.status === "warning" ? "yellow" : "green"}">${eventItem.status === "danger" ? "Crítico" : eventItem.status === "warning" ? "Atenção" : "Normal"}</span>
              </div>
              <div>
                <button type="button" data-agenda-note-action="edit" data-agenda-note-id="${eventItem.id}">Editar</button>
                <button type="button" data-agenda-note-action="done" data-agenda-note-id="${eventItem.id}">Concluir</button>
                <button type="button" data-agenda-note-action="delete" data-agenda-note-id="${eventItem.id}">Excluir</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article><strong>Nenhum agendamento pendente</strong><span>Use Novo agendamento para incluir uma anotacao.</span><div></div></article>`;
}

function renderDiverseReminders() {
  const list = field("diverse-reminders-list");
  const count = field("diverse-reminders-count");
  if (!list || !count) return;
  const activeItems = diverseReminders.filter((item) => item.status !== "deleted");
  count.textContent = `${activeItems.length} ${activeItems.length === 1 ? "item" : "itens"}`;
  list.innerHTML = activeItems.length
    ? activeItems.map((reminder) => {
        const nextAlert = [...(reminder.alerts || [])].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
        return `
          <article>
            <div>
              <strong>${escapeHtml(reminder.name)}</strong>
              ${reminder.companyLabel ? `<span>${escapeHtml(reminder.companyLabel)}</span>` : ""}
            </div>
            <div>
              <strong>${nextAlert ? `${nextAlert.label}: ${formatAgendaDate(nextAlert.date)} às ${nextAlert.time}` : "Sem prazo informado"}</strong>
              ${reminder.description ? `<span>${escapeHtml(reminder.description)}</span>` : ""}
              <span class="pill ${reminder.status === "resolved" ? "green" : "yellow"}">${reminder.status === "resolved" ? "Resolvido" : "Pendente"}</span>
            </div>
            <div>
              <button type="button" data-diverse-reminder-action="edit" data-diverse-reminder-id="${reminder.id}">Editar</button>
              <button type="button" data-diverse-reminder-action="renew" data-diverse-reminder-id="${reminder.id}">Renovar</button>
              <button type="button" data-diverse-reminder-action="resolve" data-diverse-reminder-id="${reminder.id}">Resolvido</button>
              <button type="button" data-diverse-reminder-action="delete" data-diverse-reminder-id="${reminder.id}">Excluir</button>
            </div>
          </article>
        `;
      }).join("")
    : `<article><strong>Nenhum lembrete cadastrado</strong><span>Use Novo lembrete para criar alertas avulsos.</span><div></div></article>`;
}

function openDiverseReminderModal(reminder = null) {
  const item = reminder || {
    id: "",
    name: "",
    companyId: "",
    companyLabel: "",
    format: 1,
    alerts: [],
    repeat: { enabled: false, count: 2, intervalDays: 30 },
    description: "",
    status: "pending",
  };
  field("diverse-reminder-id").value = item.id || "";
  field("diverse-reminder-name").value = item.name || "";
  field("diverse-reminder-company-id").value = item.companyId || "";
  selectedDiverseReminderCompany = item.companyId ? companies.find((company) => sameId(company.id, item.companyId)) || null : null;
  updateDiverseReminderCompanySummary();
  const format = Number(item.format || Math.max(1, item.alerts?.length || 1));
  const formatInput = document.querySelector(`input[name="diverse-reminder-format"][value="${format}"]`);
  if (formatInput) formatInput.checked = true;
  renderDiverseReminderAlertFields(format);
  fillDiverseReminderAlertFields(item.alerts || []);
  field("diverse-reminder-repeat-enabled").checked = Boolean(item.repeat?.enabled);
  field("diverse-reminder-repeat-box").hidden = !field("diverse-reminder-repeat-enabled").checked;
  field("diverse-reminder-repeat-count").value = item.repeat?.count || 2;
  field("diverse-reminder-repeat-interval").value = item.repeat?.intervalDays || 30;
  field("diverse-reminder-description").value = item.description || "";
  field("diverse-reminder-modal-title").textContent = reminder ? "Editar lembrete" : "Novo lembrete";
  openModal("diverse-reminder-modal");
}

function renderDiverseReminderCompanyPicker() {
  const list = field("diverse-reminder-company-list");
  if (!list) return;
  list.innerHTML = companies.length
    ? companies.map((company) => `
      <article>
        <div>
          <strong>${escapeHtml(company.name)}</strong>
          <span>${escapeHtml(company.type || "Empresa/Filial")}</span>
        </div>
        <div>
          <span>${escapeHtml(company.cnpj || "Sem CNPJ informado")}</span>
          <span>${escapeHtml(company.parent || "")}</span>
        </div>
        <div>
          <button type="button" data-diverse-company-id="${company.id}">Selecionar</button>
        </div>
      </article>
    `).join("")
    : `<article><strong>Nenhuma empresa cadastrada</strong><span>Cadastre empresas e filiais em 01.2.2.</span><div></div></article>`;
}

function validateDiverseReminderPayload(payload) {
  if (!payload.name) {
    alert("Informe o nome do lembrete.");
    return false;
  }
  if (!payload.alerts.length) {
    alert("Informe pelo menos uma data de aviso.");
    return false;
  }
  const invalid = payload.alerts.find((alert) => !scheduleIsInFuture(alert.date, alert.time));
  if (invalid) {
    alert(`${invalid.label} deve ter data e horário posteriores ao momento atual.`);
    return false;
  }
  return true;
}

async function persistDiverseReminder(reminder, wasExisting) {
  if (!window.DocGestorDB) return true;
  try {
    const payload = {
      name: reminder.name,
      company_id: looksLikeUuid(reminder.companyId) ? reminder.companyId : null,
      company_label: reminder.companyLabel || null,
      alert_format: reminder.format,
      alerts: reminder.alerts,
      repeat_enabled: Boolean(reminder.repeat?.enabled),
      repeat_count: Number(reminder.repeat?.count || 1),
      repeat_interval_days: Number(reminder.repeat?.intervalDays || 30),
      description: reminder.description || "",
      status: reminder.status || "pending",
      updated_at: new Date().toISOString(),
    };
    let saved = null;
    if (wasExisting && looksLikeUuid(reminder.id)) {
      [saved] = await window.DocGestorDB.update("diverse_reminders", reminder.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("diverse_reminders", payload);
    }
    if (saved?.id) reminder.id = saved.id;
    return true;
  } catch (error) {
    console.warn("Não foi possível salvar o lembrete diverso no Supabase.", error.message);
    alert(`Não foi possível salvar o lembrete no banco: ${error.message}`);
    return false;
  }
}

async function deleteDiverseReminderFromDatabase(reminder) {
  if (!window.DocGestorDB || !looksLikeUuid(reminder?.id)) return;
  try {
    await Promise.all([
      window.DocGestorDB.removeWhere("alert_queue", `related_id=eq.${encodeURIComponent(reminder.id)}&status=eq.pending`),
      window.DocGestorDB.removeWhere("alert_history", `related_id=eq.${encodeURIComponent(reminder.id)}&status=eq.waiting`),
      window.DocGestorDB.removeWhere("agenda_events", `related_id=eq.${encodeURIComponent(reminder.id)}&status=eq.waiting`),
      window.DocGestorDB.remove("diverse_reminders", reminder.id),
    ]);
  } catch (error) {
    console.warn("Não foi possível excluir lembrete diverso no Supabase.", error.message);
  }
}

async function saveDiverseReminder() {
  const id = field("diverse-reminder-id").value || Date.now();
  const existing = diverseReminders.find((item) => sameId(item.id, id));
  const companyId = field("diverse-reminder-company-id").value || "";
  const payload = {
    id,
    name: field("diverse-reminder-name").value.trim(),
    companyId,
    companyLabel: diverseReminderCompanyLabel(companyId),
    format: selectedDiverseReminderFormat(),
    alerts: diverseReminderAlertRowsFromForm(),
    repeat: {
      enabled: field("diverse-reminder-repeat-enabled").checked,
      count: Number(field("diverse-reminder-repeat-count").value || 1),
      intervalDays: Number(field("diverse-reminder-repeat-interval").value || 30),
    },
    description: field("diverse-reminder-description").value.trim(),
    status: existing?.status || "pending",
  };
  if (!validateDiverseReminderPayload(payload)) return;
  if (existing) await cancelDiverseReminderPendingAlerts(existing);
  if (existing) Object.assign(existing, payload);
  else diverseReminders.push(payload);
  const saved = await persistDiverseReminder(payload, Boolean(existing));
  if (!saved) {
    if (!existing) diverseReminders = diverseReminders.filter((item) => !sameId(item.id, payload.id));
    renderDiverseReminders();
    return;
  }
  await scheduleDiverseReminderAlerts(payload);
  closeModal("diverse-reminder-modal");
  renderDiverseReminders();
  renderAgenda();
  renderAgendaNotes();
}

function renewDiverseReminder(reminder) {
  const renewed = {
    ...reminder,
    id: Date.now(),
    name: `${reminder.name} - renovação`,
    status: "pending",
    alerts: (reminder.alerts || []).map((alert) => ({ ...alert, date: addDaysToDate(alert.date, 365) })),
  };
  openDiverseReminderModal(renewed);
}

function agendaLinkOptions(filter) {
  if (filter === "licenses") {
    return activeLicenses().map((license) => ({
      id: `${license.processId}-${license.stageNumber}`,
      module: "environmental",
      type: "license",
      label: `${license.number} - ${license.type}`,
      detail: `${license.company} - vence em ${formatAgendaDate(license.expiryDate)}`,
    }));
  }
  return sortedProcesses(environmentalProcesses.filter((process) => process.status === filter)).map((process) => ({
    id: String(process.id),
    module: "environmental",
    type: "process",
    label: `${process.internalNumber || process.number} - ${process.title}`,
    detail: `${process.type} - ${process.company}`,
  }));
}

function renderAgendaLinkPicker() {
  const list = field("agenda-link-picker-list");
  if (!list) return;
  const filter = field("agenda-link-filter")?.value || "open";
  const items = agendaLinkOptions(filter);
  list.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <article>
              <div>
                <strong>${item.label}</strong>
                <span>${item.type === "license" ? "Licença" : "Processo"}</span>
              </div>
              <div>
                <span>${item.detail}</span>
                <span>${sendModuleLabel(item.module)}</span>
              </div>
              <div>
                <button type="button" data-agenda-link-pick="${item.id}" data-agenda-link-type="${item.type}" data-agenda-link-label="${item.label}" data-agenda-link-detail="${item.detail}">Selecionar</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<article><strong>Nenhum registro</strong><span>Não há itens para o filtro selecionado.</span><div></div></article>`;
}

function openAgendaLinkPicker() {
  if (!field("agenda-note-link-enabled").checked) field("agenda-note-link-enabled").checked = true;
  updateAgendaLinkBox();
  renderAgendaLinkPicker();
  openModal("agenda-link-picker-modal");
}

function renderAgendaDayEvents() {
  const label = field("agenda-selected-label");
  const list = field("agenda-day-events");
  if (!label || !list) return;
  const events = agendaEventsForDate(selectedAgendaDate);
  label.textContent = formatAgendaDate(selectedAgendaDate, { long: true });
  list.innerHTML = events.length
    ? events
        .map(
          (event) => `
            <article class="agenda-event">
              <span>${event.type} - ${event.time}</span>
              <strong>${event.title}</strong>
              <small>${event.description}</small>
            </article>
          `,
        )
        .join("")
    : `<div class="agenda-empty">Nenhum compromisso para este dia.</div>`;
}

function renderAgendaUpcoming() {
  const count = field("agenda-upcoming-count");
  const list = field("agenda-upcoming-list");
  if (!count || !list) return;
  const upcoming = [...agendaEvents]
    .filter((event) => event.date >= selectedAgendaDate)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 5);
  count.textContent = `${upcoming.length} itens`;
  list.innerHTML = upcoming.length
    ? upcoming
        .map(
          (event) => `
            <article class="agenda-event">
              <span>${formatAgendaDate(event.date)} - ${event.time}</span>
              <strong>${event.title}</strong>
              <small>${event.type}</small>
            </article>
          `,
        )
        .join("")
    : `<div class="agenda-empty">Não há próximos compromissos.</div>`;
}

function renderAgenda() {
  const grid = field("agenda-grid");
  const monthLabel = field("agenda-month-label");
  const monthCount = field("agenda-month-count");
  if (!grid || !monthLabel || !monthCount) return;
  const year = agendaCursor.getFullYear();
  const month = agendaCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());
  const monthEvents = agendaEvents.filter((event) => {
    const date = parseDateKey(event.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  monthLabel.textContent = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(firstDay);
  monthCount.textContent = `${monthEvents.length} evento${monthEvents.length === 1 ? "" : "s"}`;
  grid.innerHTML = Array.from({ length: 42 })
    .map((_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dateKey(date);
      const events = agendaEventsForDate(key);
      const isOutside = date.getMonth() !== month;
      const isToday = key === dateKey(new Date());
      return `
        <button type="button" class="agenda-day ${isOutside ? "outside" : ""} ${isToday ? "today" : ""} ${key === selectedAgendaDate ? "selected" : ""}" data-agenda-date="${key}">
          <span class="agenda-day-number">${date.getDate()}</span>
          ${events
            .slice(0, 3)
            .map((event) => `<span class="agenda-event-chip ${event.status === "danger" ? "danger" : event.status === "warning" ? "warning" : ""}">${event.time} ${event.title}</span>`)
            .join("")}
        </button>
      `;
    })
    .join("");
}

field("agenda-grid")?.addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-agenda-date]");
  if (!dayButton) return;
  selectedAgendaDate = dayButton.dataset.agendaDate;
  agendaCursor = parseDateKey(selectedAgendaDate);
  document.querySelectorAll("[data-agenda-date]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.agendaDate === selectedAgendaDate);
  });
});

field("agenda-grid")?.addEventListener("dblclick", (event) => {
  const dayButton = event.target.closest("[data-agenda-date]");
  if (!dayButton) return;
  selectedAgendaDate = dayButton.dataset.agendaDate;
  agendaCursor = parseDateKey(selectedAgendaDate);
  renderAgenda();
  renderAgendaDayEvents();
  renderAgendaUpcoming();
  openModal("agenda-day-modal");
});

field("agenda-prev-month")?.addEventListener("click", () => {
  agendaCursor = new Date(agendaCursor.getFullYear(), agendaCursor.getMonth() - 1, 1);
  selectedAgendaDate = dateKey(new Date(agendaCursor.getFullYear(), agendaCursor.getMonth(), 1));
  renderAgenda();
});

field("agenda-next-month")?.addEventListener("click", () => {
  agendaCursor = new Date(agendaCursor.getFullYear(), agendaCursor.getMonth() + 1, 1);
  selectedAgendaDate = dateKey(new Date(agendaCursor.getFullYear(), agendaCursor.getMonth(), 1));
  renderAgenda();
});

field("agenda-today")?.addEventListener("click", () => {
  const today = new Date();
  agendaCursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  selectedAgendaDate = dateKey(today);
  renderAgenda();
});

field("agenda-note-new")?.addEventListener("click", () => openAgendaNoteModal());
field("agenda-note-save")?.addEventListener("click", saveAgendaNote);
field("agenda-note-link-enabled")?.addEventListener("change", () => {
  if (!field("agenda-note-link-enabled").checked) agendaLinkSelection = null;
  updateAgendaLinkBox();
});
field("agenda-note-link-select")?.addEventListener("click", openAgendaLinkPicker);
field("agenda-link-filter")?.addEventListener("change", renderAgendaLinkPicker);
field("agenda-link-picker-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-agenda-link-pick]");
  if (!button) return;
  agendaLinkSelection = {
    id: button.dataset.agendaLinkPick,
    module: field("agenda-note-link-module").value,
    type: button.dataset.agendaLinkType,
    label: button.dataset.agendaLinkLabel,
    detail: button.dataset.agendaLinkDetail,
  };
  field("agenda-note-link-enabled").checked = true;
  updateAgendaLinkBox();
  closeModal("agenda-link-picker-modal");
});
field("agenda-note-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-agenda-note-action]");
  if (!button) return;
  const id = button.dataset.agendaNoteId;
  const eventItem = agendaEvents.find((item) => sameId(item.id, id));
  if (!eventItem) return;
  if (button.dataset.agendaNoteAction === "edit") {
    openAgendaNoteModal(eventItem);
  }
  if (button.dataset.agendaNoteAction === "done") {
    eventItem.status = "done";
    renderAgenda();
    renderAgendaNotes();
  }
  if (button.dataset.agendaNoteAction === "delete") {
    confirmDelete(`Deseja realmente excluir o agendamento ${eventItem.title}?`, () => {
      const index = agendaEvents.findIndex((item) => sameId(item.id, id));
      if (index >= 0) agendaEvents.splice(index, 1);
      renderAgenda();
      renderAgendaNotes();
    });
  }
});
renderAgendaNotes();

field("diverse-reminder-new")?.addEventListener("click", () => openDiverseReminderModal());
field("diverse-reminder-save")?.addEventListener("click", saveDiverseReminder);
field("diverse-reminder-repeat-enabled")?.addEventListener("change", () => {
  const box = field("diverse-reminder-repeat-box");
  if (box) box.hidden = !field("diverse-reminder-repeat-enabled").checked;
});
field("diverse-reminder-format-options")?.addEventListener("change", () => renderDiverseReminderAlertFields());
field("diverse-reminder-company-select")?.addEventListener("click", () => {
  renderDiverseReminderCompanyPicker();
  openModal("diverse-reminder-company-modal");
});
field("diverse-reminder-company-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-diverse-company-id]");
  if (!button) return;
  selectedDiverseReminderCompany = companies.find((company) => sameId(company.id, button.dataset.diverseCompanyId)) || null;
  field("diverse-reminder-company-id").value = selectedDiverseReminderCompany?.id || "";
  updateDiverseReminderCompanySummary();
  closeModal("diverse-reminder-company-modal");
});
field("diverse-reminders-list")?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-diverse-reminder-action]");
  if (!button) return;
  const reminder = diverseReminders.find((item) => sameId(item.id, button.dataset.diverseReminderId));
  if (!reminder) return;
  if (button.dataset.diverseReminderAction === "edit") {
    openDiverseReminderModal(reminder);
  }
  if (button.dataset.diverseReminderAction === "renew") {
    renewDiverseReminder(reminder);
  }
  if (button.dataset.diverseReminderAction === "resolve") {
    reminder.status = "resolved";
    await cancelDiverseReminderPendingAlerts(reminder);
    await persistDiverseReminder(reminder, looksLikeUuid(reminder.id));
    renderDiverseReminders();
    renderAgenda();
    renderAgendaNotes();
  }
  if (button.dataset.diverseReminderAction === "delete") {
    confirmDelete(`Deseja realmente excluir o lembrete ${reminder.name}?`, async () => {
      const index = diverseReminders.findIndex((item) => sameId(item.id, reminder.id));
      if (index >= 0) diverseReminders.splice(index, 1);
      await cancelDiverseReminderPendingAlerts(reminder);
      await deleteDiverseReminderFromDatabase(reminder);
      renderDiverseReminders();
      renderAgenda();
      renderAgendaNotes();
    });
  }
});
renderDiverseReminderAlertFields();
renderDiverseReminders();

let users = [];

const MASTER_USER = {
  id: "master",
  name: "Admin",
  email: "Admin",
  profile: "Administrador Maximo",
  status: "Ativo",
  permissions: ["admin", "dashboard", "modules", "environmental", "iptu", "diverseDocuments", "agenda", "users", "registries", "adminEnvironmental"],
  isMaster: true,
};

const MASTER_PASSWORD_KEY = "docgestor.masterPassword";

function masterPassword() {
  return localStorage.getItem(MASTER_PASSWORD_KEY) || "CA123*";
}

let currentUser = null;
let selectedUserId = 0;
let passwordResetUserId = null;
const userList = document.querySelector("#user-list");
const userCount = document.querySelector("#user-count");
const permissionUser = document.querySelector("#permission-user");
const userModal = document.querySelector("#user-modal");
const permissionsModal = document.querySelector("#permissions-modal");
let genericDeleteCallback = null;

function field(id) {
  return document.querySelector(`#${id}`);
}

function selectedUser() {
  return users.find((user) => sameId(user.id, selectedUserId)) || users[0];
}

function defaultPermissionsForProfile(profile) {
  if (profile === "Administrador Geral" || profile === "Administrador do Grupo") {
    return ["admin", "dashboard", "modules", "environmental", "iptu", "diverseDocuments", "agenda", "users", "registries", "adminEnvironmental"];
  }
  if (profile === "Gestor Ambiental" || profile === "Operador Ambiental") {
    return ["dashboard", "modules", "environmental", "agenda"];
  }
  return ["dashboard", "modules", "environmental"];
}

function userPermissions(user) {
  if (Array.isArray(user?.permissions)) return user.permissions;
  return defaultPermissionsForProfile(user?.profile);
}

function canAccess(permissionKey) {
  if (!permissionKey || permissionKey === "home") return true;
  if (permissionKey === "profile") return Boolean(currentUser);
  if (!currentUser) return false;
  const permissions = userPermissions(currentUser);
  if (permissionKey === "modules") {
    return permissions.some((permission) => ["modules", "environmental", "iptu", "diverseDocuments"].includes(permission));
  }
  return permissions.includes(permissionKey);
}

function viewPermission(viewName) {
  if (viewName === "admin" || viewName === "usuarios" || viewName === "cadastros") return "admin";
  if (viewName === "dashboard") return "dashboard";
  if (viewName === "dashboard-ambiental") return "environmental";
  if (viewName === "dashboard-iptu") return "iptu";
  if (viewName === "dashboard-agendamentos") return "agenda";
  if (viewName === "modulos") return "modules";
  if (viewName === "iptu") return "iptu";
  if (viewName === "documentos-diversos") return "diverseDocuments";
  if (viewName === "licencas") return "environmental";
  if (viewName === "agenda" || viewName === "agenda-notes") return "agenda";
  if (viewName === "settings" || viewName === "profile-settings") return "profile";
  return "home";
}

function firstAccessibleView() {
  if (canAccess("dashboard")) return "dashboard";
  if (canAccess("environmental")) return "licencas";
  if (canAccess("iptu")) return "iptu";
  if (canAccess("diverseDocuments")) return "documentos-diversos";
  if (canAccess("agenda")) return "agenda";
  if (canAccess("admin")) return "admin";
  if (canAccess("modules")) return "modulos";
  return "home";
}

function applyAccessControl() {
  document.querySelectorAll("[data-permission-view]").forEach((element) => {
    element.hidden = !canAccess(element.dataset.permissionView);
  });
  document.querySelectorAll('[data-admin-target="usuarios-admin"]').forEach((element) => {
    element.hidden = !canAccess("users");
  });
  document.querySelectorAll('[data-admin-target="socios-admin"], [data-admin-target="empresas-filiais"], [data-admin-target="cidades-admin"], [data-admin-target="imoveis-admin"], [data-admin-target="imoveis-urbanos-admin"], [data-admin-target="imoveis-rurais-admin"], [data-admin-target="painel-imoveis-admin"], [data-admin-target="empreendimentos-admin"], [data-admin-target="atividades-admin"]').forEach((element) => {
    element.hidden = !canAccess("registries");
  });
  document.querySelectorAll('[data-admin-target="tipos-licencas"], [data-admin-target="documentos-ambientais"], [data-admin-target="modelos-checklist"]').forEach((element) => {
    element.hidden = !canAccess("adminEnvironmental");
  });
  document.querySelectorAll('[data-admin-target="email-sistema"], [data-admin-target="envios-admin"], [data-admin-target="historico-alertas"], [data-admin-target="backup-sistema"]').forEach((element) => {
    element.hidden = !canAccess("admin");
  });
  const label = field("current-user-label");
  if (label) label.textContent = currentUser ? `${currentUser.name} - ${currentUser.profile}` : "Usuário";
}

function setPermissionChecks(user) {
  const permissions = userPermissions(user);
  document.querySelectorAll("[data-permission-key]").forEach((input) => {
    input.checked = permissions.includes(input.dataset.permissionKey);
  });
}

function readPermissionChecks() {
  return Array.from(document.querySelectorAll("[data-permission-key]"))
    .filter((input) => input.checked)
    .map((input) => input.dataset.permissionKey);
}

function loginError(message) {
  const error = field("login-error");
  if (!error) return;
  error.textContent = message;
  error.hidden = false;
}

function authenticate(login, password) {
  const normalized = String(login || "").trim().toLowerCase();
  if (normalized === "admin" && password === masterPassword()) return MASTER_USER;
  const user = users.find((item) => [item.email, item.name].some((value) => String(value || "").trim().toLowerCase() === normalized));
  if (!user || user.password !== password) return null;
  if (["Bloqueado", "Inativo"].includes(user.status)) return { blocked: true, user };
  return user;
}

function saveSessionUser(user) {
  if (!user) return;
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    isMaster: Boolean(user.isMaster),
  }));
}

function savedSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function findUserForSession(savedUser) {
  if (!savedUser) return null;
  if (savedUser.isMaster || sameId(savedUser.id, MASTER_USER.id)) return MASTER_USER;
  return users.find((user) => sameId(user.id, savedUser.id) || String(user.email || "").toLowerCase() === String(savedUser.email || "").toLowerCase()) || null;
}

function restoreSessionUser() {
  const user = findUserForSession(savedSessionUser());
  if (!user || ["Bloqueado", "Inativo"].includes(user.status)) {
    sessionStorage.removeItem(SESSION_USER_KEY);
    return false;
  }
  currentUser = user;
  document.querySelector("#login-screen")?.setAttribute("hidden", "");
  field("app-shell")?.removeAttribute("hidden");
  applyAccessControl();
  return true;
}

function loginUser(user) {
  currentUser = user;
  saveSessionUser(user);
  document.querySelector("#login-screen")?.setAttribute("hidden", "");
  field("app-shell")?.removeAttribute("hidden");
  applyAccessControl();
  sessionStorage.setItem(SESSION_VIEW_KEY, "home");
  openView("home");
}

function logoutUser() {
  currentUser = null;
  sessionStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(SESSION_VIEW_KEY);
  sessionStorage.removeItem(SESSION_LICENSE_STATUS_KEY);
  field("app-shell")?.setAttribute("hidden", "");
  document.querySelector("#login-screen")?.removeAttribute("hidden");
  field("login-password").value = "";
  field("login-error").hidden = true;
}

function fillProfileForm() {
  if (!currentUser) return;
  field("profile-name").value = currentUser.name || "";
  field("profile-email").value = currentUser.email || "";
  field("profile-phone").value = currentUser.phone || "";
  field("profile-cpf").value = currentUser.cpf || "";
  field("profile-role-title").value = currentUser.roleTitle || "";
  field("profile-access-profile").value = currentUser.profile || "";
  const status = field("profile-status-pill");
  if (status) {
    status.textContent = currentUser.status || "Usuário ativo";
    status.className = `pill ${userStatusClass(currentUser.status || "Ativo")}`;
  }
}

function updateCurrentUserFromProfile() {
  if (!currentUser) return null;
  currentUser.name = field("profile-name").value;
  currentUser.email = field("profile-email").value;
  currentUser.phone = field("profile-phone").value;
  currentUser.cpf = field("profile-cpf").value;
  currentUser.roleTitle = field("profile-role-title").value;

  if (!currentUser.isMaster) {
    const user = users.find((item) => sameId(item.id, currentUser.id));
    if (user) Object.assign(user, currentUser);
    renderUsers();
    persistCurrentUserProfile(currentUser);
  }

  applyAccessControl();
  saveSessionUser(currentUser);
  fillProfileForm();
  return currentUser;
}

async function persistCurrentUserProfile(user) {
  if (!window.DocGestorDB || user?.isMaster || !looksLikeUuid(user?.id)) return;
  try {
    await window.DocGestorDB.update("app_users", user.id, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      cpf: user.cpf,
      role_title: user.roleTitle,
    });
  } catch (error) {
    console.warn("Não foi possível salvar o perfil no Supabase.", error.message);
  }
}

async function persistCurrentUserPassword(user) {
  if (!window.DocGestorDB || user?.isMaster || !looksLikeUuid(user?.id)) return;
  try {
    await window.DocGestorDB.update("app_users", user.id, {
      password: user.password,
      status: user.status,
    });
  } catch (error) {
    console.warn("Não foi possível salvar a senha no Supabase.", error.message);
  }
}

function clearProfilePasswordFields() {
  ["profile-current-password", "profile-new-password", "profile-confirm-password"].forEach((id) => {
    if (field(id)) field(id).value = "";
  });
}

function saveProfilePassword() {
  if (!currentUser) return;
  const currentPassword = field("profile-current-password").value;
  const newPassword = field("profile-new-password").value;
  const confirmation = field("profile-confirm-password").value;
  const storedPassword = currentUser.isMaster ? masterPassword() : currentUser.password;

  if (currentPassword !== storedPassword) {
    alert("Senha atual incorreta.");
    return;
  }
  if (!newPassword || newPassword.length < 6) {
    alert("A nova senha deve ter pelo menos 6 caracteres.");
    return;
  }
  if (newPassword !== confirmation) {
    alert("A confirmação da nova senha não confere.");
    return;
  }
  currentUser.password = newPassword;
  currentUser.status = "Ativo";
  if (currentUser.isMaster) {
    localStorage.setItem(MASTER_PASSWORD_KEY, newPassword);
  } else {
    const user = users.find((item) => sameId(item.id, currentUser.id));
    if (user) Object.assign(user, currentUser);
    persistCurrentUserPassword(currentUser);
  }
  saveSessionUser(currentUser);
  clearProfilePasswordFields();
  renderUsers();
  applyAccessControl();
  alert("Senha alterada com sucesso.");
}

function addUserLog(titleText, bodyText) {
  console.info(`${titleText}: ${bodyText}`);
}

function openModal(id) {
  const modal = document.querySelector(`#${id}`);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  const modal = document.querySelector(`#${id}`);
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (id === "pdf-preview-modal") {
    const frame = field("pdf-preview-frame");
    const frameDocument = frame?.contentDocument || frame?.contentWindow?.document;
    if (frameDocument) {
      frameDocument.open();
      frameDocument.write("");
      frameDocument.close();
    }
    activePdfPreviewHtml = "";
    activePdfPreviewLoaded = false;
  }
}

function confirmDelete(message, onConfirm) {
  const text = document.querySelector("#generic-delete-text");
  if (text) text.textContent = message;
  genericDeleteCallback = onConfirm;
  openModal("generic-delete-modal");
}

function showSystemMessage(message, titleText = "Aviso") {
  const titleElement = field("system-message-title");
  const textElement = field("system-message-text");
  if (titleElement) titleElement.textContent = titleText;
  if (textElement) textElement.textContent = String(message || "");
  openModal("system-message-modal");
}

window.alert = (message) => showSystemMessage(message);

function fillUserForm(user) {
  if (!user) return;
  selectedUserId = user.id;
  field("user-id").value = user.id;
  field("user-name").value = user.name;
  field("user-email").value = user.email;
  field("user-phone").value = user.phone;
  field("user-cpf").value = user.cpf;
  field("user-role-title").value = user.roleTitle;
  if (permissionUser) permissionUser.textContent = user.name;
}

function userStatusClass(status) {
  if (status === "Ativo") return "green";
  if (status === "Bloqueado" || status === "Inativo") return "red";
  return "yellow";
}

function renderUsers() {
  if (!userList) return;
  userCount.textContent = `${users.length} itens`;
  userList.innerHTML = users
    .map(
      (user) => `
        <article class="user-row ${sameId(user.id, selectedUserId) ? "selected" : ""}" data-user-id="${user.id}">
          <div>
            <strong>${user.name}</strong>
            <small>${user.email}</small>
          </div>
          <div>
            <span>${user.profile}</span>
            <span class="pill ${userStatusClass(user.status)}">${user.status}</span>
          </div>
          <div class="user-row-actions">
            <button type="button" data-user-action="edit" data-user-id="${user.id}">Editar</button>
            <button type="button" data-user-action="permissions" data-user-id="${user.id}">Permissões</button>
            <button type="button" data-user-action="reset" data-user-id="${user.id}">Redefinir senha</button>
            <button type="button" data-user-action="block" data-user-id="${user.id}">Bloquear</button>
            <button type="button" data-user-action="delete" data-user-id="${user.id}">Excluir</button>
          </div>
        </article>
      `,
    )
    .join("");
}

async function persistUser(user, wasExisting) {
  if (!window.DocGestorDB || user?.isMaster) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const companyId = companyIdByName(user.company);
  const branchId = companyIdByName(user.branch);
  const payload = {
    organization_id: organizationId,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    cpf: user.cpf || "",
    role_title: user.roleTitle || "",
    company_id: looksLikeUuid(companyId) ? companyId : null,
    branch_id: looksLikeUuid(branchId) ? branchId : null,
    profile: user.profile || "Consulta",
    status: user.status || "Ativo",
    password: user.password || "123456",
    permissions: userPermissions(user),
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(user.id)) {
      [saved] = await window.DocGestorDB.update("app_users", user.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("app_users", payload);
    }
    if (saved?.id) {
      updateLocalId(users, user.id, saved.id);
      user.id = saved.id;
      selectedUserId = saved.id;
      renderUsers();
    }
    await syncUserAlertRecipient(user);
  } catch (error) {
    console.warn("Não foi possível salvar o usuário no Supabase.", error.message);
    alert(`Não foi possível salvar o usuário no banco: ${error.message}`);
  }
}

async function saveCurrentUser() {
  const rawId = field("user-id").value;
  const numericId = Number(rawId);
  const id = rawId || Date.now();
  const existing = users.find((user) => sameId(user.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: rawId ? id : Number.isNaN(numericId) ? Date.now() : numericId,
    name: field("user-name").value,
    email: field("user-email").value,
    phone: field("user-phone").value,
    cpf: field("user-cpf").value,
    roleTitle: field("user-role-title").value,
    company: existing?.company || "",
    branch: existing?.branch || "Todas",
    profile: existing?.profile || "Consulta",
    status: existing?.status || "Ativo",
    password: existing?.password || "123456",
    permissions: Array.isArray(existing?.permissions) ? existing.permissions : [],
  };

  if (existing) {
    Object.assign(existing, payload);
    selectedUserId = existing.id;
    addUserLog("Usuário atualizado", `${existing.name} teve cadastro e nível de acesso revisados.`);
  } else {
    users.push(payload);
    selectedUserId = payload.id;
    addUserLog("Usuário criado", `${payload.name} foi incluído no sistema.`);
  }

  renderUsers();
  fillUserForm(selectedUser());
  closeModal("user-modal");
  await persistUser(existing || payload, wasExisting);
}

function newUser() {
  const id = Date.now();
  selectedUserId = id;
  field("user-id").value = id;
  field("user-name").value = "";
  field("user-email").value = "";
  field("user-phone").value = "";
  field("user-cpf").value = "";
  field("user-role-title").value = "";
  if (permissionUser) permissionUser.textContent = "Novo usuário";
  renderUsers();
  document.querySelector("#user-modal-title").textContent = "Novo usuário";
  openModal("user-modal");
  addUserLog("Novo usuário", "Formulário limpo para cadastrar um novo acesso.");
}

function updateUserStatus(id, status, titleText) {
  const user = users.find((item) => sameId(item.id, id));
  if (!user) return;
  user.status = status;
  selectedUserId = id;
  fillUserForm(user);
  renderUsers();
  persistUser(user, looksLikeUuid(user.id));
  addUserLog(titleText, `${user.name} agora está com status: ${status}.`);
}

function generateSixDigitPassword() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function openPasswordConfirmation(user) {
  passwordResetUserId = user.id;
  const confirmText = document.querySelector("#password-confirm-text");
  const generatedBox = document.querySelector("#generated-password");
  const generatedValue = document.querySelector("#new-password-value");
  const confirmButton = document.querySelector("#confirm-password-reset");
  const cancelButton = document.querySelector("#cancel-password-reset");
  const okButton = document.querySelector("#password-ok");
  if (confirmText) confirmText.textContent = `Deseja Realmente Alterar a Senha do Usuário ${user.name}?`;
  if (generatedBox) generatedBox.hidden = true;
  if (generatedValue) generatedValue.textContent = "000000";
  if (confirmButton) confirmButton.hidden = false;
  if (cancelButton) cancelButton.hidden = false;
  if (okButton) okButton.hidden = true;
  openModal("password-modal");
}

document.querySelector("#user-new")?.addEventListener("click", newUser);
document.querySelector("#user-save")?.addEventListener("click", saveCurrentUser);
document.querySelector("#login-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = authenticate(field("login-user")?.value, field("login-password")?.value);
  if (!result) {
    loginError("Usuário ou senha inválidos.");
    return;
  }
  if (result.blocked) {
    loginError(`O usuário ${result.user.name} está ${result.user.status.toLowerCase()}.`);
    return;
  }
  loginUser(result);
});
document.querySelector("#logout-button")?.addEventListener("click", logoutUser);
document.querySelector("#profile-save")?.addEventListener("click", () => {
  const updated = updateCurrentUserFromProfile();
  if (updated) alert("Perfil atualizado com sucesso.");
});
document.querySelector("#profile-password-clear")?.addEventListener("click", clearProfilePasswordFields);
document.querySelector("#profile-password-save")?.addEventListener("click", saveProfilePassword);
document.querySelector("#permissions-save")?.addEventListener("click", async () => {
  const user = selectedUser();
  user.permissions = readPermissionChecks();
  await persistUser(user, looksLikeUuid(user.id));
  closeModal("permissions-modal");
  addUserLog("Permissões salvas", `Permissões exclusivas atualizadas para ${user.name}.`);
  if (currentUser && sameId(currentUser.id, user.id)) applyAccessControl();
});
document.querySelector("#confirm-password-reset")?.addEventListener("click", () => {
  const user = users.find((item) => sameId(item.id, passwordResetUserId));
  if (!user) return;
  const newPassword = generateSixDigitPassword();
  user.password = newPassword;
  user.status = "Senha pendente";
  selectedUserId = user.id;
  fillUserForm(user);
  renderUsers();
  const confirmText = document.querySelector("#password-confirm-text");
  const generatedBox = document.querySelector("#generated-password");
  const generatedValue = document.querySelector("#new-password-value");
  const confirmButton = document.querySelector("#confirm-password-reset");
  const cancelButton = document.querySelector("#cancel-password-reset");
  const okButton = document.querySelector("#password-ok");
  if (confirmText) confirmText.textContent = "Senha alterada com sucesso.";
  if (generatedValue) generatedValue.textContent = newPassword;
  if (generatedBox) generatedBox.hidden = false;
  if (confirmButton) confirmButton.hidden = true;
  if (cancelButton) cancelButton.hidden = true;
  if (okButton) okButton.hidden = false;
  persistUser(user, looksLikeUuid(user.id));
  addUserLog("Senha redefinida", `A senha de ${user.name} foi substituida por uma nova senha de 6 digitos.`);
});
document.querySelector("#password-ok")?.addEventListener("click", () => closeModal("password-modal"));
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.dataset.closeModal));
});
document.querySelectorAll(".modal-backdrop").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal.id);
  });
});
document.querySelector("#system-message-ok")?.addEventListener("click", () => closeModal("system-message-modal"));
document.querySelector("#generic-delete-confirm")?.addEventListener("click", async () => {
  const callback = genericDeleteCallback;
  genericDeleteCallback = null;
  try {
    if (typeof callback === "function") await callback();
    closeModal("generic-delete-modal");
  } catch (error) {
    console.warn("Não foi possível concluir a exclusão.", error.message);
    showSystemMessage(`Não foi possível concluir a exclusão: ${error.message}`, "Exclusão não concluída");
  }
});
userList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-user-action]");
  if (!button) return;
  const id = button.dataset.userId;
  const user = users.find((item) => sameId(item.id, id));
  if (!user) return;

  if (button.dataset.userAction === "edit") {
    fillUserForm(user);
    renderUsers();
    document.querySelector("#user-modal-title").textContent = "Editar usuário";
    openModal("user-modal");
    addUserLog("Edicao carregada", `${user.name} foi carregado no formulario.`);
  }

  if (button.dataset.userAction === "permissions") {
    fillUserForm(user);
    setPermissionChecks(user);
    renderUsers();
    openModal("permissions-modal");
    addUserLog("Permissões abertas", `Matriz de permissões exibida para ${user.name}.`);
  }

  if (button.dataset.userAction === "reset") {
    selectedUserId = id;
    fillUserForm(user);
    renderUsers();
    openPasswordConfirmation(user);
  }

  if (button.dataset.userAction === "block") {
    updateUserStatus(id, "Bloqueado", "Usuário bloqueado");
  }

  if (button.dataset.userAction === "delete") {
    confirmDelete(`Deseja realmente excluir o usuário ${user.name}?`, () => {
      const index = users.findIndex((item) => sameId(item.id, id));
      if (index >= 0) users.splice(index, 1);
      selectedUserId = users[0]?.id ?? 0;
      renderUsers();
      if (users.length) fillUserForm(selectedUser());
      persistDelete("app_users", id, "usuário");
    });
  }
});

if (userList) {
  renderUsers();
  fillUserForm(selectedUser());
}

const systemEmailConfig = {
  id: null,
  name: "DocGestor by Carminatti",
  address: "docgestor@systemdirect.org",
  domain: "systemdirect.org",
  provider: "Resend",
  host: "api.resend.com",
  port: "",
  user: "RESEND_API_KEY",
  status: "Aguardando validação",
  lastTest: "",
};

const SYSTEM_EMAIL_CONFIG_KEY = "docgestor.systemEmailConfig";

function systemEmailStatusClass(status) {
  if (status === "Validado") return "green";
  if (status === "Falhou") return "red";
  return "yellow";
}

function loadSystemEmailConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(SYSTEM_EMAIL_CONFIG_KEY) || "null");
    if (saved) Object.assign(systemEmailConfig, saved);
    if (
      !saved ||
      (saved.address === "avisos@docgestor.com.br" && saved.provider === "SMTP") ||
      (saved.address === "onboarding@resend.dev" && saved.provider === "Resend")
    ) {
      Object.assign(systemEmailConfig, {
        name: "DocGestor by Carminatti",
        address: "docgestor@systemdirect.org",
        domain: "systemdirect.org",
        provider: "Resend",
        host: "api.resend.com",
        port: "",
        user: "RESEND_API_KEY",
        status: "Aguardando validação",
      });
      persistSystemEmailConfig();
    }
  } catch (error) {
    console.warn("Não foi possível carregar a configuração de e-mail.", error);
  }
}

function persistSystemEmailConfig() {
  const safeConfig = {
    id: systemEmailConfig.id,
    name: systemEmailConfig.name,
    address: systemEmailConfig.address,
    domain: systemEmailConfig.domain,
    provider: systemEmailConfig.provider,
    host: systemEmailConfig.host,
    port: systemEmailConfig.port,
    user: systemEmailConfig.user,
    status: systemEmailConfig.status,
    lastTest: systemEmailConfig.lastTest,
  };
  localStorage.setItem(SYSTEM_EMAIL_CONFIG_KEY, JSON.stringify(safeConfig));
  persistSystemEmailConfigToDatabase();
}

async function persistSystemEmailConfigToDatabase() {
  if (!window.DocGestorDB) return;
  const payload = {
    sender_name: systemEmailConfig.name,
    sender_email: systemEmailConfig.address,
    authorized_domain: systemEmailConfig.domain,
    provider: systemEmailConfig.provider,
    host: systemEmailConfig.host,
    port: systemEmailConfig.port ? Number(systemEmailConfig.port) : null,
    username_or_key: systemEmailConfig.user,
    status: systemEmailConfig.status,
    last_test_at: systemEmailConfig.lastTest || null,
  };
  try {
    let saved = null;
    if (looksLikeUuid(systemEmailConfig.id)) {
      [saved] = await window.DocGestorDB.update("system_email_configs", systemEmailConfig.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("system_email_configs", payload);
    }
    if (saved?.id) {
      systemEmailConfig.id = saved.id;
      localStorage.setItem(SYSTEM_EMAIL_CONFIG_KEY, JSON.stringify({ ...systemEmailConfig }));
    }
  } catch (error) {
    console.warn("Não foi possível salvar a configuração de e-mail no Supabase.", error.message);
  }
}

function applySystemEmailConfigRow(row) {
  if (!row) return;
  Object.assign(systemEmailConfig, {
    id: row.id || systemEmailConfig.id,
    name: row.sender_name || systemEmailConfig.name,
    address: row.sender_email || systemEmailConfig.address,
    domain: row.authorized_domain || systemEmailConfig.domain,
    provider: row.provider || systemEmailConfig.provider,
    host: row.host || systemEmailConfig.host,
    port: row.port ? String(row.port) : "",
    user: row.username_or_key || systemEmailConfig.user,
    status: row.status || systemEmailConfig.status,
    lastTest: row.last_test_at || systemEmailConfig.lastTest,
  });
  localStorage.setItem(SYSTEM_EMAIL_CONFIG_KEY, JSON.stringify({ ...systemEmailConfig }));
}

function updateSystemEmailDns() {
  const domain = field("system-email-domain")?.value || systemEmailConfig.domain;
  const address = field("system-email-address")?.value || systemEmailConfig.address;
  if (field("system-email-spf")) field("system-email-spf").textContent = `v=spf1 include:_spf.${domain} ~all`;
  if (field("system-email-dkim")) field("system-email-dkim").textContent = `docgestor._domainkey.${domain}`;
  if (field("system-email-dmarc")) field("system-email-dmarc").textContent = `v=DMARC1; p=quarantine; rua=mailto:${address}`;
}

function renderSystemEmailConfig() {
  field("system-email-name").value = systemEmailConfig.name;
  field("system-email-address").value = systemEmailConfig.address;
  field("system-email-domain").value = systemEmailConfig.domain;
  field("system-email-provider").value = systemEmailConfig.provider;
  field("system-email-host").value = systemEmailConfig.host;
  field("system-email-port").value = systemEmailConfig.port;
  field("system-email-user").value = systemEmailConfig.user;
  const status = field("system-email-status");
  if (status) {
    status.textContent = systemEmailConfig.status;
    status.className = `pill ${systemEmailStatusClass(systemEmailConfig.status)}`;
  }
  updateSystemEmailDns();
}

function systemEmailFormPayload() {
  return {
    name: field("system-email-name").value.trim(),
    address: field("system-email-address").value.trim(),
    domain: field("system-email-domain").value.trim(),
    provider: field("system-email-provider").value,
    host: field("system-email-host").value.trim(),
    port: field("system-email-port").value.trim(),
    user: field("system-email-user").value.trim(),
  };
}

function systemEmailHasChanges(payload) {
  return ["name", "address", "domain", "provider", "host", "port", "user"].some((key) => String(systemEmailConfig[key] || "") !== String(payload[key] || ""));
}

function saveSystemEmailConfig() {
  const payload = systemEmailFormPayload();
  if (!payload.name || !payload.address || !payload.domain || !payload.provider) {
    alert("Preencha nome do remetente, e-mail remetente, domínio autorizado e provedor.");
    return;
  }
  if (!systemEmailHasChanges(payload)) {
    alert("Nenhuma alteração encontrada na configuração de e-mail.");
    return;
  }
  const confirmed = window.confirm(`Deseja alterar o e-mail de envio do sistema para ${payload.name} <${payload.address}>?`);
  if (!confirmed) return;
  Object.assign(systemEmailConfig, payload);
  systemEmailConfig.status = "Aguardando validação";
  persistSystemEmailConfig();
  renderSystemEmailConfig();
  alert("Configuracao de e-mail alterada no sistema. Verifique o domínio antes de liberar envios reais.");
}

function openSystemEmailTestModal() {
  const input = field("system-email-test-to");
  if (input && !input.value) input.value = "jonatass.goncalvess@gmail.com";
  openModal("system-email-test-modal");
}

async function sendSystemEmail({ to, subject, html }) {
  const recipient = String(to || "").trim();
  if (!recipient) throw new Error("Informe o e-mail destinatário.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error(`E-mail invalido: ${recipient}`);
  const response = await fetch("/api/enviar-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: recipient,
      fromName: systemEmailConfig.name,
      fromEmail: systemEmailConfig.address,
      subject,
      html,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || "verifique a configuração do provedor");
  }
  return result;
}

async function testSystemEmailConfig() {
  const recipient = field("system-email-test-to")?.value?.trim();
  try {
    const result = await sendSystemEmail({
      to: recipient,
      subject: "Teste DocGestor",
      html: "<p>Funcionou! Este e-mail foi enviado pela Vercel + Resend.</p>",
    });
    console.log(result);
    systemEmailConfig.lastTest = new Date().toLocaleString("pt-BR");
    persistSystemEmailConfig();
    closeModal("system-email-test-modal");
    alert("E-mail enviado!");
  } catch (error) {
    console.error(error);
    alert(`Erro ao enviar e-mail: ${error.message}`);
  }
}

function verifySystemEmailDomain() {
  systemEmailConfig.status = field("system-email-domain").value ? "Validado" : "Falhou";
  persistSystemEmailConfig();
  renderSystemEmailConfig();
}

["system-email-domain", "system-email-address"].forEach((id) => field(id)?.addEventListener("input", updateSystemEmailDns));
field("system-email-save")?.addEventListener("click", saveSystemEmailConfig);
field("system-email-test-open")?.addEventListener("click", openSystemEmailTestModal);
field("system-email-test-send")?.addEventListener("click", testSystemEmailConfig);
field("system-email-test-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  testSystemEmailConfig();
});
field("system-email-verify")?.addEventListener("click", verifySystemEmailDomain);
if (field("system-email-name")) {
  loadSystemEmailConfig();
  renderSystemEmailConfig();
}

const BACKUP_CONFIG_KEY = "docgestor.backupConfig";

let backupConfig = {
  id: null,
  enabled: true,
  frequency: "daily",
  time: "02:00",
  retentionDays: 90,
  weekday: 1,
  monthday: 1,
  provider: "supabase",
  destination: "docgestor-backups/ambiental",
  status: "Configurado",
  lastBackup: "",
  nextBackup: "",
};

function backupFrequencyLabel(value) {
  return {
    daily: "Diario",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
  }[value] || value;
}

function backupProviderLabel(value) {
  return {
    supabase: "Supabase Storage",
    "vercel-blob": "Vercel Blob",
    "google-drive": "Google Drive",
    onedrive: "OneDrive/SharePoint",
    s3: "Amazon S3",
    backblaze: "Backblaze B2",
  }[value] || value;
}

function backupStatusClass(status) {
  if (status === "Pausado") return "yellow";
  if (status === "Falhou") return "red";
  return "green";
}

function parseBackupTime(value) {
  const [hour, minute] = String(value || "02:00").split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 2,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function computeNextBackupDate(config = backupConfig) {
  if (!config.enabled) return "";
  const now = new Date();
  const { hour, minute } = parseBackupTime(config.time);
  const candidate = new Date(now);
  candidate.setHours(hour, minute, 0, 0);

  if (config.frequency === "daily") {
    while (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    return candidate.toISOString();
  }

  if (config.frequency === "weekly" || config.frequency === "biweekly") {
    const targetDay = Number(config.weekday ?? 1);
    const interval = config.frequency === "biweekly" ? 14 : 7;
    const diff = (targetDay - candidate.getDay() + 7) % 7;
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

function formatBackupDate(value) {
  if (!value) return "Ainda não executado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadBackupConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(BACKUP_CONFIG_KEY) || "null");
    if (saved) Object.assign(backupConfig, saved);
  } catch (error) {
    console.warn("Não foi possível carregar a configuração de backup.", error);
  }
  if (!backupConfig.nextBackup) backupConfig.nextBackup = computeNextBackupDate(backupConfig);
}

function persistBackupConfigLocal() {
  localStorage.setItem(BACKUP_CONFIG_KEY, JSON.stringify(backupConfig));
}

async function persistBackupConfigSupabase() {
  if (!window.DocGestorDB) return;
  const payload = {
    enabled: Boolean(backupConfig.enabled),
    frequency: backupConfig.frequency,
    backup_time: backupConfig.time,
    retention_days: Number(backupConfig.retentionDays || 90),
    weekday: Number(backupConfig.weekday || 1),
    monthday: Number(backupConfig.monthday || 1),
    provider: backupConfig.provider,
    destination: backupConfig.destination,
    status: backupConfig.status,
    last_backup_at: backupConfig.lastBackup || null,
    next_backup_at: backupConfig.nextBackup || null,
  };
  try {
    let saved = null;
    if (looksLikeUuid(backupConfig.id)) {
      [saved] = await window.DocGestorDB.update("system_backup_configs", backupConfig.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("system_backup_configs", payload);
    }
    if (saved?.id) backupConfig.id = saved.id;
    persistBackupConfigLocal();
  } catch (error) {
    console.warn("Não foi possível salvar a configuração de backup no Supabase.", error.message);
  }
}

function backupFormPayload() {
  return {
    enabled: field("backup-enabled")?.value === "true",
    frequency: field("backup-frequency")?.value || "daily",
    time: field("backup-time")?.value || "02:00",
    retentionDays: Number(field("backup-retention")?.value || 90),
    weekday: Number(field("backup-weekday")?.value || 1),
    monthday: Number(field("backup-monthday")?.value || 1),
    provider: field("backup-provider")?.value || "supabase",
    destination: field("backup-destination")?.value?.trim() || "docgestor-backups/ambiental",
  };
}

function renderBackupConfig() {
  if (!field("backup-enabled")) return;
  field("backup-enabled").value = String(Boolean(backupConfig.enabled));
  field("backup-frequency").value = backupConfig.frequency;
  field("backup-time").value = backupConfig.time;
  field("backup-retention").value = String(backupConfig.retentionDays);
  field("backup-weekday").value = String(backupConfig.weekday);
  field("backup-monthday").value = String(backupConfig.monthday);
  field("backup-provider").value = backupConfig.provider;
  field("backup-destination").value = backupConfig.destination;

  const status = field("backup-status");
  if (status) {
    status.textContent = backupConfig.enabled ? backupConfig.status : "Pausado";
    status.className = `pill ${backupStatusClass(status.textContent)}`;
  }

  const summary = field("backup-summary");
  if (summary) {
    summary.innerHTML = `
      <span>Local escolhido</span>
      <strong>${backupProviderLabel(backupConfig.provider)} - ${escapeHtml(backupConfig.destination)}</strong>
      <span>Rotina</span>
      <strong>${backupFrequencyLabel(backupConfig.frequency)} as ${escapeHtml(backupConfig.time)} - retencao de ${Number(backupConfig.retentionDays || 0)} dias</strong>
      <span>Ultimo backup</span>
      <strong>${formatBackupDate(backupConfig.lastBackup)}</strong>
      <span>Proximo backup previsto</span>
      <strong>${formatBackupDate(backupConfig.nextBackup)}</strong>
    `;
  }
}

async function saveBackupConfig() {
  const payload = backupFormPayload();
  if (!payload.destination) {
    alert("Informe o bucket, pasta ou caminho onde os backups serão armazenados.");
    return;
  }
  const confirmed = window.confirm(`Deseja salvar a rotina de backup ${backupFrequencyLabel(payload.frequency)} as ${payload.time}?`);
  if (!confirmed) return;
  Object.assign(backupConfig, payload);
  backupConfig.status = backupConfig.enabled ? "Configurado" : "Pausado";
  backupConfig.nextBackup = computeNextBackupDate(backupConfig);
  persistBackupConfigLocal();
  renderBackupConfig();
  await persistBackupConfigSupabase();
  alert("Configuracao de backup salva.");
}

function testBackupDestination() {
  const payload = backupFormPayload();
  const message = payload.provider === "supabase"
    ? "Destino valido para a primeira versao. Crie um bucket privado no Supabase Storage com esse nome/caminho antes de ativar a rotina real."
    : "Destino registrado. Para envio automático real, será necessário configurar a credencial segura desse provedor no backend.";
  alert(`${backupProviderLabel(payload.provider)}\n${payload.destination}\n\n${message}`);
}

async function generateBackupNow() {
  const confirmed = window.confirm("Deseja registrar uma execucao manual de backup agora?");
  if (!confirmed) return;
  Object.assign(backupConfig, backupFormPayload());
  backupConfig.lastBackup = new Date().toISOString();
  backupConfig.nextBackup = computeNextBackupDate(backupConfig);
  backupConfig.status = "Configurado";
  persistBackupConfigLocal();
  renderBackupConfig();
  await persistBackupConfigSupabase();
  alert("Backup manual registrado. A geração real do arquivo será feita quando conectarmos a rotina backend.");
}

["backup-enabled", "backup-frequency", "backup-time", "backup-retention", "backup-weekday", "backup-monthday", "backup-provider", "backup-destination"].forEach((id) => {
  field(id)?.addEventListener("input", () => {
    const preview = { ...backupConfig, ...backupFormPayload() };
    preview.nextBackup = computeNextBackupDate(preview);
    const original = backupConfig;
    backupConfig = preview;
    renderBackupConfig();
    backupConfig = original;
  });
});
field("backup-save")?.addEventListener("click", saveBackupConfig);
field("backup-test")?.addEventListener("click", testBackupDestination);
field("backup-run-now")?.addEventListener("click", generateBackupNow);
if (field("backup-enabled")) {
  loadBackupConfig();
  renderBackupConfig();
}

let sendRecipients = [];

let selectedSendRecipientId = 0;
let selectedSendModuleId = "environmental";

const defaultSystemModules = [
  { id: "environmental", name: "03.1 Licenças Ambientais" },
  { id: "iptu", name: "03.2 IPTU" },
  { id: "diverse-documents", name: "03.3 Lembretes Diversos" },
];

const availableAlertModules = [...defaultSystemModules];

function sendModuleLabel(moduleKey) {
  return availableAlertModules.find((module) => module.id === moduleKey)?.name || moduleKey;
}

const alertModulePermissionMap = {
  environmental: "environmental",
  iptu: "iptu",
  "diverse-documents": "diverseDocuments",
};

function userHasModuleAccess(user, moduleId) {
  const permission = alertModulePermissionMap[moduleId] || moduleId;
  return userPermissions(user).includes(permission);
}

function normalizeAlertModuleId(moduleId, moduleRows = []) {
  const value = String(moduleId || "");
  const row = moduleRows.find((item) => String(item.id) === value || String(item.code) === value);
  return row?.code || value;
}

function sendRecipientModules(recipient) {
  if (Array.isArray(recipient?.modules) && recipient.modules.length) return recipient.modules;
  if (recipient?.module) return [recipient.module];
  return ["environmental"];
}

function recipientIsAutomatic(recipient) {
  return recipient?.source === "user" || Boolean(recipient?.userId);
}

function normalizeRecipientStatus(status) {
  const value = String(status || "Ativo").toLowerCase();
  if (value === "inactive" || value === "inativo") return "Inativo";
  return "Ativo";
}

function recipientReceivesAlerts(recipient) {
  return normalizeRecipientStatus(recipient?.status) === "Ativo";
}

function findAutomaticRecipientForUser(user) {
  if (!user?.email) return null;
  return sendRecipients.find((recipient) => {
    if (!recipientIsAutomatic(recipient)) return false;
    if (recipient.userId && sameId(recipient.userId, user.id)) return true;
    return recipient.email?.toLowerCase() === user.email.toLowerCase();
  });
}

function automaticModuleRecipients(moduleId) {
  return users
    .filter((user) => user?.email && String(user.status || "Ativo") === "Ativo" && userHasModuleAccess(user, moduleId))
    .map((user) => {
      const existing = findAutomaticRecipientForUser(user);
      return {
        id: existing?.id || user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        modules: [moduleId],
        relation: "Usuário do sistema",
        status: normalizeRecipientStatus(existing?.status || "Ativo"),
        readConfirmation: existing?.readConfirmation ?? true,
        source: "user",
      };
    });
}

function externalModuleRecipients(moduleId) {
  return sendRecipients.filter((recipient) => !recipientIsAutomatic(recipient) && sendRecipientModules(recipient).includes(moduleId));
}

function allModuleRecipients(moduleId) {
  const byEmail = new Map();
  [...automaticModuleRecipients(moduleId), ...externalModuleRecipients(moduleId)].forEach((recipient) => {
    const key = String(recipient.email || "").toLowerCase();
    if (key && !byEmail.has(key)) byEmail.set(key, recipient);
  });
  return [...byEmail.values()];
}

function activeModuleRecipients(moduleId) {
  return allModuleRecipients(moduleId).filter(recipientReceivesAlerts);
}

async function ensureModuleAlertRecipients(moduleId) {
  if (!window.DocGestorDB) return activeModuleRecipients(moduleId);
  const moduleUsers = users.filter((user) => user?.email && String(user.status || "Ativo") === "Ativo" && userHasModuleAccess(user, moduleId));
  await Promise.all(moduleUsers.map((user) => syncUserAlertRecipient(user)));
  return activeModuleRecipients(moduleId).filter((recipient) => looksLikeUuid(recipient.id));
}

function renderSendRecipientModuleChecks(selectedModules = ["environmental"]) {
  const wrapper = field("send-recipient-module-checks");
  if (!wrapper) return;
  wrapper.innerHTML = `<span>Módulos vinculados</span>${availableAlertModules
    .map(
      (module) => `
        <label>
          <input type="checkbox" name="send-recipient-module" value="${module.id}" ${selectedModules.includes(module.id) ? "checked" : ""} />
          ${module.name}
        </label>
      `,
    )
    .join("")}`;
}

function selectedSendRecipient() {
  return sendRecipients.find((recipient) => sameId(recipient.id, selectedSendRecipientId)) || sendRecipients[0];
}

function fillSendRecipientForm(recipient) {
  if (!recipient) return;
  selectedSendRecipientId = recipient.id;
  field("send-recipient-id").value = recipient.id;
  field("send-recipient-name").value = recipient.name;
  field("send-recipient-email").value = recipient.email;
  renderSendRecipientModuleChecks(sendRecipientModules(recipient));
  field("send-recipient-status").value = recipient.status;
  field("send-recipient-read-confirmation").checked = Boolean(recipient.readConfirmation);
}

function renderModuleEmailLists(moduleId = selectedSendModuleId) {
  const userList = field("send-recipient-user-list");
  if (userList) {
    const recipients = allModuleRecipients(moduleId);
    userList.innerHTML = recipients.length
      ? recipients.map((recipient) => {
          const automatic = recipientIsAutomatic(recipient);
          const enabled = recipientReceivesAlerts(recipient);
          return `
          <article class="${enabled ? "" : "recipient-disabled"}">
            <strong>${escapeHtml(recipient.name || recipient.email)}</strong>
            <span>${escapeHtml(recipient.email)}</span>
            <small>${automatic ? (enabled ? "Usuário com acesso ao módulo" : "Usuário desabilitado para avisos") : "E-mail externo"}</small>
            ${
              automatic
                ? `<button type="button" data-send-user-toggle="${recipient.userId || recipient.id}" data-send-user-status="${enabled ? "disable" : "enable"}">${enabled ? "Desabilitar" : "Reabilitar"}</button>`
                : `<button type="button" data-send-external-delete="${recipient.id}">Remover</button>`
            }
          </article>
        `;
        }).join("")
      : `<article><strong>Nenhum destinatário</strong><span>Autorize usuários no módulo ou adicione e-mails externos.</span></article>`;
  }
}

function openSendModuleModal(moduleId) {
  selectedSendModuleId = moduleId || "environmental";
  selectedSendRecipientId = 0;
  field("send-recipient-id").value = "";
  field("send-recipient-module-id").value = selectedSendModuleId;
  field("send-recipient-name").value = "";
  field("send-recipient-email").value = "";
  field("send-recipient-status").value = "Ativo";
  field("send-recipient-read-confirmation").checked = true;
  renderSendRecipientModuleChecks([selectedSendModuleId]);
  renderModuleEmailLists(selectedSendModuleId);
  field("send-recipient-modal-title").textContent = `Editar envios - ${sendModuleLabel(selectedSendModuleId)}`;
  openModal("send-recipient-modal");
}

function renderSendRecipients() {
  const list = field("send-recipient-list");
  const count = field("send-recipient-count");
  if (!list || !count) return;
  count.textContent = `${availableAlertModules.length} módulos`;
  list.innerHTML = availableAlertModules
    .map(
      (module) => {
        const recipients = activeModuleRecipients(module.id);
        return `
        <article class="module-recipient-row">
          <div class="module-recipient-main">
            <strong>${module.name}</strong>
          </div>
          <div class="module-recipient-total">
            <strong>${recipients.length}</strong>
            <span>e-mail${recipients.length === 1 ? "" : "s"} destinatário${recipients.length === 1 ? "" : "s"}</span>
          </div>
          <div class="module-recipient-actions">
            <button type="button" data-send-module-action="edit" data-send-module-id="${module.id}">Editar</button>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

function newSendRecipient() {
  openSendModuleModal("environmental");
}

function saveSendRecipient() {
  const moduleId = field("send-recipient-module-id")?.value || selectedSendModuleId || "environmental";
  const email = field("send-recipient-email").value.trim();
  if (!email) {
    alert("Informe o e-mail externo que receberá os avisos deste módulo.");
    return;
  }
  const existing = sendRecipients.find((recipient) => !recipientIsAutomatic(recipient) && recipient.email?.toLowerCase() === email.toLowerCase());
  const payload = {
    id: existing?.id || Date.now(),
    name: field("send-recipient-name").value || email,
    email,
    modules: [...new Set([...(existing?.modules || []), moduleId])],
    relation: sendModuleLabel(moduleId),
    status: field("send-recipient-status").value,
    readConfirmation: field("send-recipient-read-confirmation").checked,
    sent: existing?.sent || 0,
    read: existing?.read || 0,
  };
  if (existing) Object.assign(existing, payload);
  else sendRecipients.push(payload);
  selectedSendRecipientId = payload.id;
  renderSendRecipients();
  renderModuleEmailLists(moduleId);
  field("send-recipient-name").value = "";
  field("send-recipient-email").value = "";
  persistSendRecipient(payload, Boolean(existing));
}

async function toggleAutomaticRecipientAlerts(userId, enable) {
  const user = users.find((item) => sameId(item.id, userId));
  if (!user?.email) return;
  const moduleId = selectedSendModuleId || "environmental";
  let recipient = findAutomaticRecipientForUser(user);
  const modules = [...new Set([...(recipient ? sendRecipientModules(recipient) : []), moduleId])];
  if (!recipient) {
    recipient = {
      id: Date.now(),
      userId: user.id,
      name: user.name,
      email: user.email,
      modules,
      relation: "Usuário do sistema",
      readConfirmation: true,
      source: "user",
      sent: 0,
      read: 0,
    };
    sendRecipients.push(recipient);
  }
  Object.assign(recipient, {
    userId: user.id,
    name: user.name,
    email: user.email,
    modules,
    relation: "Usuário do sistema",
    status: enable ? "Ativo" : "Inativo",
    source: "user",
  });
  renderModuleEmailLists(moduleId);
  renderSendRecipients();
  await persistSendRecipient(recipient, looksLikeUuid(recipient.id));
}

function saveSendRecipientUpdate() {
  renderModuleEmailLists(selectedSendModuleId || "environmental");
  renderSendRecipients();
  closeModal("send-recipient-modal");
}

field("send-recipient-new")?.addEventListener("click", newSendRecipient);
field("send-recipient-save")?.addEventListener("click", saveSendRecipient);
field("send-recipient-update")?.addEventListener("click", saveSendRecipientUpdate);
field("send-recipient-list")?.addEventListener("click", (event) => {
  const moduleButton = event.target.closest("[data-send-module-action]");
  if (moduleButton) {
    openSendModuleModal(moduleButton.dataset.sendModuleId);
    return;
  }
  const button = event.target.closest("[data-send-recipient-action]");
  if (!button) return;
  const id = button.dataset.sendRecipientId;
  const recipient = sendRecipients.find((item) => sameId(item.id, id));
  if (!recipient) return;
  if (button.dataset.sendRecipientAction === "edit") {
    fillSendRecipientForm(recipient);
    field("send-recipient-modal-title").textContent = "Editar e-mail";
    openModal("send-recipient-modal");
  }
  if (button.dataset.sendRecipientAction === "test") {
    recipient.sent += 1;
    if (!recipient.readConfirmation) recipient.read += 1;
    renderSendRecipients();
    alert(`E-mail teste registrado para ${recipient.email}. ${recipient.readConfirmation ? "Aguardando confirmação de leitura." : "Confirmação de leitura não exigida."}`);
  }
  if (button.dataset.sendRecipientAction === "delete") {
    confirmDelete(`Deseja realmente excluir o e-mail ${recipient.email} dos envios?`, () => {
      const index = sendRecipients.findIndex((item) => sameId(item.id, id));
      if (index >= 0) sendRecipients.splice(index, 1);
      renderSendRecipients();
    });
  }
});

field("send-recipient-modal")?.addEventListener("click", (event) => {
  const userToggle = event.target.closest("[data-send-user-toggle]");
  if (userToggle) {
    toggleAutomaticRecipientAlerts(userToggle.dataset.sendUserToggle, userToggle.dataset.sendUserStatus === "enable");
    return;
  }
  const button = event.target.closest("[data-send-external-delete]");
  if (!button) return;
  const id = button.dataset.sendExternalDelete;
  const recipient = sendRecipients.find((item) => sameId(item.id, id));
  if (!recipient) return;
  const moduleId = selectedSendModuleId;
  confirmDelete(`Deseja remover ${recipient.email} dos avisos de ${sendModuleLabel(moduleId)}?`, () => {
    recipient.modules = sendRecipientModules(recipient).filter((item) => item !== moduleId);
    if (!recipient.modules.length) {
      const index = sendRecipients.findIndex((item) => sameId(item.id, id));
      if (index >= 0) sendRecipients.splice(index, 1);
      if (looksLikeUuid(id) && window.DocGestorDB) {
        window.DocGestorDB.removeWhere("alert_recipient_modules", `recipient_id=eq.${encodeURIComponent(id)}`).catch(() => null);
      }
      persistDelete("alert_recipients", id, "e-mail de alerta");
    } else {
      persistSendRecipient(recipient, looksLikeUuid(recipient.id));
    }
    renderModuleEmailLists(moduleId);
    renderSendRecipients();
  });
});

renderSendRecipients();

let alertHistoryItems = [];
const ALERT_HISTORY_RETENTION_DAYS = 90;

const alertHistoryStatusLabels = {
  waiting: "Aguardando",
  pending: "Aguardando",
  sent: "Enviado",
  delivered: "Entregue",
  delivery_delayed: "Entrega atrasada",
  complained: "Marcado como spam",
  bounced: "Devolvido",
  opened: "Aberto",
  clicked: "Clicado",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function alertHistoryStatusClass(status) {
  if (["delivered", "opened", "clicked"].includes(status)) return "green";
  if (["bounced", "complained"].includes(status)) return "red";
  if (["waiting", "pending", "delivery_delayed"].includes(status)) return "yellow";
  return "";
}

function formatAlertHistoryDate(value) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeAlertHistoryItem(item) {
  const status = item.last_event || item.status || "sent";
  return {
    id: item.id,
    subject: item.subject || "Sem assunto",
    to: item.to || item.recipient_emails || [],
    from: item.from || item.sender_email || systemEmailConfig.address,
    created_at: item.created_at || item.sent_at || item.last_event_at,
    last_event: status,
    message_html: item.message_html || item.html || item.raw_payload?.message_html || "",
    raw_payload: item.raw_payload || {},
    related_label: item.related_label || item.relatedLabel || "",
    resend_email_id: item.resend_email_id || item.id || "",
  };
}

function alertHistoryRetentionCutoff() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ALERT_HISTORY_RETENTION_DAYS);
  return cutoff;
}

function alertHistoryDateForRetention(item) {
  return new Date(item.sent_at || item.sentAt || item.last_event_at || item.created_at || item.createdAt || 0);
}

function alertHistoryWithinRetention(item) {
  const status = String(item.status || item.last_event || "").toLowerCase();
  if (status !== "sent" && status !== "enviado") return true;
  const eventDate = alertHistoryDateForRetention(item);
  return !Number.isNaN(eventDate.getTime()) && eventDate >= alertHistoryRetentionCutoff();
}

function retainedAlertHistoryRows(rows) {
  return (rows || []).filter(alertHistoryWithinRetention);
}

function alertHistoryItemById(id) {
  return alertHistoryItems.map(normalizeAlertHistoryItem).find((item) => String(item.id) === String(id));
}

function plainTextFromHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html || "";
  return wrapper.textContent?.trim() || "";
}

function openAlertEmailModal(id) {
  const item = alertHistoryItemById(id);
  if (!item) return;
  const status = item.last_event || "waiting";
  const recipients = Array.isArray(item.to) ? item.to.join(", ") : item.to || "Não informado";
  const messageHtml = item.message_html || item.raw_payload?.message || "";
  const messageText = messageHtml.includes("<") ? plainTextFromHtml(messageHtml) : messageHtml;
  field("alert-email-subject").textContent = item.subject || "Sem assunto";
  field("alert-email-status").textContent = alertHistoryStatusLabels[status] || status;
  field("alert-email-status").className = `pill ${alertHistoryStatusClass(status)}`;
  field("alert-email-from").textContent = item.from || "Remetente não informado";
  field("alert-email-to").textContent = recipients;
  field("alert-email-date").textContent = formatAlertHistoryDate(item.created_at || item.sent_at);
  field("alert-email-resend-id").textContent = item.resend_email_id || "Não informado";
  field("alert-email-related").textContent = item.related_label || "Não vinculado";
  field("alert-email-body").textContent = messageText || "Texto do e-mail não disponível neste registro.";
  openModal("alert-email-modal");
}

function renderAlertHistory(items = alertHistoryItems) {
  const list = field("alert-history-list");
  const count = field("alert-history-count");
  const summary = field("alert-history-summary");
  if (!list || !count || !summary) return;

  count.textContent = `${items.length} itens`;
  if (!items.length) {
    summary.innerHTML = "<span>Nenhum envio encontrado no Resend para a chave configurada.</span>";
    list.innerHTML = "";
    return;
  }

  const normalizedItems = items.map(normalizeAlertHistoryItem);
  const totals = normalizedItems.reduce((acc, item) => {
    const status = item.last_event || "sent";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  summary.innerHTML = Object.entries(totals)
    .map(([status, total]) => `<span><strong>${total}</strong> ${escapeHtml(alertHistoryStatusLabels[status] || status)}</span>`)
    .join("");

  list.innerHTML = normalizedItems
    .map((item) => {
      const status = item.last_event || "sent";
      const recipients = Array.isArray(item.to) ? item.to.join(", ") : item.to || "Não informado";
      return `
        <article>
          <div>
            <strong>${escapeHtml(item.subject || "Sem assunto")}</strong>
            <span>${escapeHtml(item.related_label || recipients || "Sem vínculo informado")}</span>
          </div>
          <div>
            <strong>${escapeHtml(formatAlertHistoryDate(item.created_at))}</strong>
            <span>${escapeHtml(recipients)}</span>
          </div>
          <div>
            <span class="pill ${alertHistoryStatusClass(status)}">${escapeHtml(alertHistoryStatusLabels[status] || status)}</span>
            <button type="button" data-alert-email-id="${escapeHtml(item.id)}">Ver e-mail</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadAlertHistory() {
  const button = field("alert-history-refresh");
  const summary = field("alert-history-summary");
  if (button) button.disabled = true;
  if (summary) summary.innerHTML = "<span>Atualizando fila e histórico de alertas...</span>";
  try {
    await fetch("/api/processar-alertas").catch(() => null);
    if (window.DocGestorDB) {
      const rows = await window.DocGestorDB.list("alert_history", "select=*&order=created_at.desc");
      alertHistoryItems = retainedAlertHistoryRows(rows).map((row) => ({
        id: row.id,
        alert_key: row.alert_key || "",
        subject: row.subject,
        recipient_emails: row.recipient_emails || [],
        sender_email: row.sender_email || systemEmailConfig.address,
        status: row.status || "waiting",
        status_label: row.status_label || "Aguardando",
        related_label: row.related_label || "",
        related_id: row.related_id || "",
        created_at: row.created_at,
        sent_at: row.sent_at,
        resend_email_id: row.resend_email_id || "",
        message_html: row.message_html || "",
        raw_payload: row.raw_payload || {},
      }));
    } else {
      const response = await fetch("/api/historico-alertas");
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Não foi possível carregar o histórico.");
      }
      alertHistoryItems = retainedAlertHistoryRows(result.emails || []);
    }
    renderAlertHistory(alertHistoryItems);
  } catch (error) {
    console.error(error);
    if (summary) summary.innerHTML = `<span>Erro ao buscar histórico: ${escapeHtml(error.message)}</span>`;
  } finally {
    if (button) button.disabled = false;
  }
}

field("alert-history-refresh")?.addEventListener("click", loadAlertHistory);
field("alert-history-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-alert-email-id]");
  if (button) openAlertEmailModal(button.dataset.alertEmailId);
});
renderAlertHistory();

let partners = [];

let selectedPartnerId = 0;
const partnerList = document.querySelector("#partner-list");
const partnerCount = document.querySelector("#partner-count");

function selectedPartner() {
  return partners.find((partner) => sameId(partner.id, selectedPartnerId)) || partners[0];
}

function fillPartnerForm(partner) {
  if (!partner) return;
  selectedPartnerId = partner.id;
  field("partner-id").value = partner.id;
  field("partner-name").value = partner.name;
  field("partner-document").value = partner.document;
  field("partner-role").value = partner.role;
  field("partner-contact").value = partner.contact;
  field("partner-phone").value = partner.phone;
  field("partner-status").value = partner.status;
}

function renderPartners() {
  if (!partnerList) return;
  partnerCount.textContent = `${partners.length} itens`;
  partnerList.innerHTML = partners
    .map(
      (partner) => `
        <article>
          <strong>${partner.name}</strong>
          <span>${partner.role} - ${partner.document} - ${partner.status}</span>
          <div>
            <button type="button" data-partner-action="edit" data-partner-id="${partner.id}">Editar</button>
            <button type="button" data-partner-action="delete" data-partner-id="${partner.id}">Excluir</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function newPartner() {
  const id = Date.now();
  selectedPartnerId = id;
  field("partner-id").value = id;
  field("partner-name").value = "";
  field("partner-document").value = "";
  field("partner-role").value = "Sócio";
  field("partner-contact").value = "";
  field("partner-phone").value = "";
  field("partner-status").value = "Ativo";
  document.querySelector("#partner-modal-title").textContent = "Novo sócio";
  openModal("partner-modal");
}

async function savePartner() {
  const id = field("partner-id").value;
  const existing = partners.find((partner) => sameId(partner.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    name: field("partner-name").value,
    document: field("partner-document").value,
    role: field("partner-role").value,
    contact: field("partner-contact").value,
    phone: field("partner-phone").value,
    status: field("partner-status").value,
  };

  if (existing) {
    Object.assign(existing, payload);
    selectedPartnerId = existing.id;
  } else {
    partners.push(payload);
    selectedPartnerId = payload.id;
  }

  renderPartners();
  closeModal("partner-modal");
  await persistPartner(payload, wasExisting);
  populatePropertyOwners();
  renderCompanyPartnerChecks();
}

document.querySelector("#partner-new")?.addEventListener("click", newPartner);
document.querySelector("#partner-save")?.addEventListener("click", savePartner);

partnerList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-partner-action]");
  if (!button) return;
  const id = button.dataset.partnerId;
  const partner = partners.find((item) => sameId(item.id, id));
  if (!partner) return;

  if (button.dataset.partnerAction === "edit") {
    fillPartnerForm(partner);
    document.querySelector("#partner-modal-title").textContent = "Editar sócio";
    openModal("partner-modal");
  }

  if (button.dataset.partnerAction === "delete") {
    confirmDelete(`Deseja realmente excluir o sócio ${partner.name}?`, () => {
      const index = partners.findIndex((item) => sameId(item.id, id));
      if (index >= 0) partners.splice(index, 1);
      selectedPartnerId = partners[0]?.id ?? 0;
      renderPartners();
      if (partners.length) fillPartnerForm(selectedPartner());
      persistDelete("partners", id, "sócio");
    });
  }
});

if (partnerList) {
  renderPartners();
  fillPartnerForm(selectedPartner());
}

let companies = [];

let selectedCompanyId = 0;
const companyTree = document.querySelector("#company-tree");
const companyCount = document.querySelector("#company-count");
const companyKind = document.querySelector("#company-kind");
const matrixLinkField = document.querySelector("#matrix-link-field");
const companyParent = document.querySelector("#company-parent");

function matrixCompanies() {
  return companies
    .filter((company) => company.kind === "matrix")
    .sort((a, b) => a.cnpj.localeCompare(b.cnpj));
}

function populateCompanyParents() {
  if (!companyParent) return;
  companyParent.innerHTML = matrixCompanies()
    .map((company) => `<option value="${company.id}">${company.cnpj} - ${company.name}</option>`)
    .join("");
}

function updateCompanyKindFields() {
  if (!companyKind || !matrixLinkField) return;
  matrixLinkField.hidden = companyKind.value !== "branch";
}

function selectedCompanyPartners() {
  return Array.from(document.querySelectorAll('input[name="company-partner"]:checked')).map((input) => input.value);
}

function renderCompanyPartnerChecks(selectedPartners = []) {
  const wrapper = field("company-partner-checks");
  if (!wrapper) return;
  wrapper.innerHTML = `<span>Sócios vinculados</span>${
    partners.length
      ? partners
          .map((partner) => `<label><input type="checkbox" name="company-partner" value="${partner.name}" ${selectedPartners.includes(partner.name) ? "checked" : ""} /> ${partner.name}</label>`)
          .join("")
      : "<small>Nenhum sócio cadastrado.</small>"
  }`;
}

function setCompanyPartners(partners) {
  renderCompanyPartnerChecks(partners);
  document.querySelectorAll('input[name="company-partner"]').forEach((input) => {
    input.checked = partners.includes(input.value);
  });
}

function fillCompanyForm(company) {
  if (!company) return;
  selectedCompanyId = company.id;
  field("company-id").value = company.id;
  field("company-kind").value = company.kind;
  populateCompanyParents();
  if (company.parentId !== null) field("company-parent").value = String(company.parentId);
  field("company-name").value = company.name;
  field("company-cnpj").value = company.cnpj;
  field("company-trade-name").value = company.tradeName;
  field("company-status").value = company.status;
  setCompanyPartners(company.partners);
  updateCompanyKindFields();
}

function renderCompanies() {
  if (!companyTree) return;
  companyCount.textContent = `${companies.length} itens`;
  const matrices = matrixCompanies();
  companyTree.innerHTML = matrices
    .map((matrix) => {
      const branches = companies
        .filter((company) => company.kind === "branch" && sameId(company.parentId, matrix.id))
        .sort((a, b) => a.cnpj.localeCompare(b.cnpj));
      const branchRows = matrix.showBranches
        ? branches
            .map(
              (branch) => `
                <div class="branch-row">
                  <div><strong>${branch.name}</strong><span>Filial - ${branch.cnpj}</span></div>
                  <span>${branch.tradeName}</span>
                  <span>Sócios: ${branch.partners.join(", ")}</span>
                  <div class="company-actions">
                    <button type="button" data-company-action="edit" data-company-id="${branch.id}">Editar</button>
                    <button type="button" data-company-action="delete" data-company-id="${branch.id}">Excluir</button>
                  </div>
                </div>
              `,
            )
            .join("")
        : "";

      return `
        <article class="matrix-card">
          <div class="matrix-head">
            <div><strong>${matrix.name}</strong><span>Matriz - ${matrix.cnpj}</span></div>
            <span>${matrix.tradeName}</span>
            <span>Sócios: ${matrix.partners.join(", ")}</span>
            <div class="company-actions">
              <button type="button" data-company-action="toggle" data-company-id="${matrix.id}">
                ${matrix.showBranches ? "Ocultar filiais" : "Exibir filiais"} (${branches.length})
              </button>
              <button type="button" data-company-action="edit" data-company-id="${matrix.id}">Editar</button>
              <button type="button" data-company-action="delete" data-company-id="${matrix.id}">Excluir</button>
            </div>
          </div>
          ${branchRows}
        </article>
      `;
    })
    .join("");
}

function newCompany() {
  const id = Date.now();
  selectedCompanyId = id;
  field("company-id").value = id;
  field("company-kind").value = "matrix";
  populateCompanyParents();
  field("company-name").value = "";
  field("company-cnpj").value = "";
  field("company-trade-name").value = "";
  field("company-status").value = "Ativa";
  setCompanyPartners([]);
  updateCompanyKindFields();
  document.querySelector("#company-modal-title").textContent = "Nova Empresa/Filial";
  openModal("company-modal");
}

async function saveCompany() {
  const id = field("company-id").value;
  const kind = field("company-kind").value;
  const existing = companies.find((company) => sameId(company.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    kind,
    name: field("company-name").value,
    cnpj: field("company-cnpj").value,
    tradeName: field("company-trade-name").value,
    status: field("company-status").value,
    partners: selectedCompanyPartners(),
    parentId: kind === "branch" ? field("company-parent").value : null,
  };

  if (kind === "matrix") payload.showBranches = existing?.showBranches ?? true;

  if (existing) {
    Object.assign(existing, payload);
  } else {
    companies.push(payload);
  }

  renderCompanies();
  closeModal("company-modal");
  await persistCompany(payload, wasExisting);
  populatePropertyOwners();
  populateEnterpriseSelects();
}

document.querySelector("#company-new")?.addEventListener("click", newCompany);
document.querySelector("#company-save")?.addEventListener("click", saveCompany);
companyKind?.addEventListener("change", updateCompanyKindFields);
companyTree?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-company-action]");
  if (!button) return;
  const id = button.dataset.companyId;
  const company = companies.find((item) => sameId(item.id, id));
  if (!company) return;

  if (button.dataset.companyAction === "toggle") {
    company.showBranches = !company.showBranches;
    renderCompanies();
  }

  if (button.dataset.companyAction === "edit") {
    fillCompanyForm(company);
    document.querySelector("#company-modal-title").textContent = "Editar Empresa/Filial";
    openModal("company-modal");
  }

  if (button.dataset.companyAction === "delete") {
    confirmDelete(`Deseja realmente excluir ${company.name}?`, () => {
      if (company.kind === "matrix") {
        for (let index = companies.length - 1; index >= 0; index -= 1) {
          if (sameId(companies[index].id, id) || sameId(companies[index].parentId, id)) companies.splice(index, 1);
        }
      } else {
        const index = companies.findIndex((item) => sameId(item.id, id));
        if (index >= 0) companies.splice(index, 1);
      }
      renderCompanies();
      populateEnterpriseSelects();
      persistDelete("companies", id, "empresa");
    });
  }
});

if (companyTree) {
  populateCompanyParents();
  renderCompanies();
}

let cities = [];
let selectedCityId = 0;
const cityList = document.querySelector("#city-list");
const cityCount = document.querySelector("#city-count");

function cityLabel(city) {
  return city ? `${city.name}/${city.state}` : "";
}

function cityById(cityId) {
  return cities.find((city) => sameId(city.id, cityId));
}

function cityIdByLabel(label) {
  return cities.find((city) => cityLabel(city) === label)?.id || null;
}

function populatePropertyCities(selectedCityIdOrLabel = "") {
  const select = field("property-city");
  if (!select) return;
  select.innerHTML = cities.length
    ? cities.map((city) => `<option value="${city.id}">${cityLabel(city)}</option>`).join("")
    : `<option value="">Cadastre uma cidade em 01.2.3</option>`;
  const selectedId = cityIdByLabel(selectedCityIdOrLabel) || selectedCityIdOrLabel;
  if (selectedId && cities.some((city) => sameId(city.id, selectedId))) select.value = selectedId;
}

function renderCities() {
  if (!cityList) return;
  cityCount.textContent = `${cities.length} itens`;
  cityList.innerHTML = cities
    .sort((a, b) => cityLabel(a).localeCompare(cityLabel(b)))
    .map(
      (city) => `
        <article>
          <strong>${city.name}</strong>
          <span>Estado: ${city.state}</span>
          <div>
            <button type="button" data-city-action="edit" data-city-id="${city.id}">Editar</button>
            <button type="button" data-city-action="delete" data-city-id="${city.id}">Excluir</button>
          </div>
        </article>
      `,
    )
    .join("");
  populatePropertyCities();
}

function fillCityForm(city) {
  if (!city) return;
  selectedCityId = city.id;
  field("city-id").value = city.id;
  field("city-name").value = city.name;
  field("city-state").value = city.state;
}

function newCity() {
  const id = Date.now();
  selectedCityId = id;
  field("city-id").value = id;
  field("city-name").value = "";
  field("city-state").value = "PR";
  document.querySelector("#city-modal-title").textContent = "Nova Cidade";
  openModal("city-modal");
}

async function saveCity() {
  const id = field("city-id").value;
  const existing = cities.find((city) => sameId(city.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    name: field("city-name").value.trim(),
    state: field("city-state").value,
  };
  if (!payload.name) {
    alert("Informe o nome da cidade.");
    return;
  }
  if (existing) Object.assign(existing, payload);
  else cities.push(payload);
  selectedCityId = payload.id;
  renderCities();
  closeModal("city-modal");
  await persistCity(payload, wasExisting);
}

document.querySelector("#city-new")?.addEventListener("click", newCity);
document.querySelector("#city-save")?.addEventListener("click", saveCity);
cityList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-city-action]");
  if (!button) return;
  const city = cities.find((item) => sameId(item.id, button.dataset.cityId));
  if (!city) return;
  if (button.dataset.cityAction === "edit") {
    fillCityForm(city);
    document.querySelector("#city-modal-title").textContent = "Editar Cidade";
    openModal("city-modal");
  }
  if (button.dataset.cityAction === "delete") {
    confirmDelete(`Deseja realmente excluir a cidade ${cityLabel(city)}?`, () => {
      const index = cities.findIndex((item) => sameId(item.id, city.id));
      if (index >= 0) cities.splice(index, 1);
      selectedCityId = cities[0]?.id ?? 0;
      renderCities();
      persistDelete("cities", city.id, "cidade");
    });
  }
});

if (cityList) renderCities();

let properties = [];

let selectedPropertyId = 0;
let pendingPropertyDeleteId = null;
const propertyList = document.querySelector("#property-list");
const propertyCount = document.querySelector("#property-count");
const urbanPropertyList = document.querySelector("#urban-property-list");
const urbanPropertyCount = document.querySelector("#urban-property-count");
const ruralPropertyList = document.querySelector("#rural-property-list");
const ruralPropertyCount = document.querySelector("#rural-property-count");
const propertyOwnerType = document.querySelector("#property-owner-type");
const propertyOwner = document.querySelector("#property-owner");
const propertyType = document.querySelector("#property-type");
const propertyRuralUse = document.querySelector("#property-rural-use");
const propertyHasConstruction = document.querySelector("#property-has-construction");

function propertyOwnersByType(type) {
  if (type === "pf") return partners.map((partner) => partner.name);
  return companies.map((company) => company.name);
}

function populatePropertyOwners(selectedOwner = "") {
  if (!propertyOwner || !propertyOwnerType) return;
  const owners = propertyOwnersByType(propertyOwnerType.value);
  propertyOwner.innerHTML = owners.map((owner) => `<option>${owner}</option>`).join("");
  if (selectedOwner && owners.includes(selectedOwner)) propertyOwner.value = selectedOwner;
}

function updateReserveCalculation() {
  const result = document.querySelector("#reserve-result");
  const status = document.querySelector("#reserve-status");
  if (!result || !status || propertyType?.value !== "rural") return;
  const total = Number(field("property-rural-area").value || 0);
  const hectares = field("property-hectares");
  if (hectares) hectares.value = total ? (total / 10000).toFixed(4) : "";
  const reserve = Number(field("property-legal-reserve").value || 0);
  const required = total * 0.2;
  const reserveHa = reserve / 10000;
  const requiredHa = required / 10000;
  const ok = total > 0 && reserve >= required;
  result.classList.toggle("warning", !ok);
  status.textContent = ok
    ? `Reserva legal em conformidade: ${reserveHa.toFixed(4)} Ha de ${requiredHa.toFixed(4)} Ha exigidos`
    : `Reserva legal abaixo de 20%: minimo exigido ${requiredHa.toFixed(4)} Ha`;
}

function syncAreaPair(sourceId, targetId, direction) {
  const source = field(sourceId);
  const target = field(targetId);
  if (!source || !target) return;
  const value = Math.max(0, Number(source.value || 0));
  if (Number(source.value || 0) < 0) source.value = "0";
  if (direction === "m2-to-ha") target.value = value ? (value / 10000).toFixed(4) : "";
  if (direction === "ha-to-m2") target.value = value ? (value * 10000).toFixed(0) : "";
  updateReserveCalculation();
}

function nonNegativeFieldValue(id) {
  const input = field(id);
  const value = Math.max(0, Number(input?.value || 0));
  if (input && Number(input.value || 0) < 0) input.value = "0";
  return value;
}

function updatePropertyFields() {
  const isRural = propertyType?.value === "rural";
  document.querySelectorAll(".urban-field").forEach((item) => (item.hidden = isRural));
  document.querySelectorAll(".rural-field").forEach((item) => (item.hidden = !isRural));
  document.querySelectorAll(".property-use-field").forEach((item) => (item.hidden = !isRural));

  if (propertyRuralUse) {
    const currentValue = propertyRuralUse.value;
    const options = ["Lavoura", "Empreendimento"];
    propertyRuralUse.innerHTML = options.map((option) => `<option>${option}</option>`).join("");
    propertyRuralUse.value = options.includes(currentValue) ? currentValue : options[0];
  }

  const constructionToggle = document.querySelector(".construction-toggle");
  const showConstructionToggle = !isRural || propertyRuralUse?.value === "Empreendimento";
  if (constructionToggle) constructionToggle.hidden = !showConstructionToggle;
  if (!showConstructionToggle && propertyHasConstruction) propertyHasConstruction.checked = false;

  const constructionAreaField = document.querySelector("#construction-area-field");
  if (constructionAreaField) constructionAreaField.hidden = !showConstructionToggle || !propertyHasConstruction?.checked;
  updateReserveCalculation();
}

function propertyListSummary(property) {
  const owner = property.owner || propertyOwnerLabel(property) || "Proprietário não informado";
  const locationFields = property.type === "urban"
    ? `Lote ${property.lot || "não informado"} - Quadra ${property.block || "não informada"}`
    : `Lote ${property.lot || "não informado"} - Gleba ${property.glebe || "não informada"}`;
  return `Proprietário: ${owner} - ${locationFields} - Referência: ${property.reference || "Não informada"}`;
}

function propertySearchText(property) {
  return normalizeSearchText([
    property.registration,
    property.owner,
    propertyOwnerLabel(property),
    property.lot,
    property.block,
    property.glebe,
    property.reference,
    property.city,
  ].filter(Boolean).join(" "));
}

function filteredPropertiesByMode(mode, searchValue = "") {
  const search = normalizeSearchText(searchValue);
  return properties.filter((property) => {
    if (mode === "urban" && property.type !== "urban") return false;
    if (mode === "rural" && property.type !== "rural") return false;
    return !search || propertySearchText(property).includes(search);
  });
}

function renderPropertyList(target, countTarget, items, options = {}) {
  if (!target || !countTarget) return;
  countTarget.textContent = `${items.length} itens`;
  target.innerHTML = items.length
    ? items
    .map((property) => {
      return `
        <article>
          <strong>Matrícula ${property.registration}</strong>
          <span>${propertyListSummary(property)}</span>
          ${options.actions ? `
            <div>
              <button type="button" data-property-action="edit" data-property-id="${property.id}">Editar</button>
              <button type="button" data-property-action="delete" data-property-id="${property.id}">Excluir</button>
            </div>
          ` : "<div></div>"}
        </article>
      `;
    })
    .join("")
    : `<article><strong>Nenhum imóvel encontrado</strong><span>Ajuste a busca ou cadastre um novo imóvel.</span><div></div></article>`;
}

function renderProperties() {
  renderPropertyList(propertyList, propertyCount, filteredPropertiesByMode("all", field("property-search")?.value || ""), { actions: true });
  renderPropertyList(urbanPropertyList, urbanPropertyCount, filteredPropertiesByMode("urban", field("urban-property-search")?.value || ""));
  renderPropertyList(ruralPropertyList, ruralPropertyCount, filteredPropertiesByMode("rural", field("rural-property-search")?.value || ""));
  renderEnvironmentalReserveDashboard();
}

function fillPropertyForm(property) {
  if (!property) return;
  selectedPropertyId = property.id;
  field("property-id").value = property.id;
  field("property-owner-type").value = property.ownerType;
  populatePropertyOwners(property.owner);
  field("property-type").value = property.type;
  field("property-registration").value = property.registration;
  field("property-reference").value = property.reference || "";
  field("property-address").value = property.address || "";
  populatePropertyCities(property.cityId || property.city || "");
  field("property-lot").value = property.lot;
  field("property-municipal-registration").value = property.municipalRegistration || "";
  field("property-block").value = property.block;
  field("property-glebe").value = property.glebe;
  field("property-car-number").value = property.carNumber || "";
  field("property-ccir-incra").value = property.ccirIncra || "";
  field("property-urban-area").value = property.urbanArea;
  field("property-rural-area").value = property.ruralArea;
  field("property-hectares").value = property.ruralArea ? (property.ruralArea / 10000).toFixed(4) : "";
  field("property-legal-reserve").value = property.legalReserve;
  field("property-legal-reserve-ha").value = property.legalReserve ? (property.legalReserve / 10000).toFixed(4) : "";
  field("property-app-area").value = property.appArea;
  field("property-app-area-ha").value = property.appArea ? (property.appArea / 10000).toFixed(4) : "";
  updatePropertyFields();
  field("property-rural-use").value = property.ruralUse;
  field("property-has-construction").checked = property.hasConstruction;
  field("property-construction-area").value = property.constructionArea;
  updatePropertyFields();
}

function newProperty() {
  const id = Date.now();
  selectedPropertyId = id;
  field("property-id").value = id;
  field("property-owner-type").value = "pf";
  populatePropertyOwners();
  field("property-type").value = "urban";
  field("property-registration").value = "";
  field("property-reference").value = "";
  field("property-address").value = "";
  populatePropertyCities();
  field("property-lot").value = "";
  field("property-municipal-registration").value = "";
  field("property-block").value = "";
  field("property-glebe").value = "";
  field("property-car-number").value = "";
  field("property-ccir-incra").value = "";
  field("property-urban-area").value = "";
  field("property-rural-area").value = "";
  field("property-hectares").value = "";
  field("property-legal-reserve").value = "";
  field("property-legal-reserve-ha").value = "";
  field("property-app-area").value = "";
  field("property-app-area-ha").value = "";
  updatePropertyFields();
  field("property-rural-use").value = "Lavoura";
  field("property-has-construction").checked = false;
  field("property-construction-area").value = "";
  document.querySelector("#property-modal-title").textContent = "Novo Imóvel";
  updatePropertyFields();
  openModal("property-modal");
}

async function saveProperty() {
  const id = field("property-id").value;
  const existing = properties.find((property) => sameId(property.id, id));
  const wasExisting = Boolean(existing);
  const type = field("property-type").value;
  if (cities.length && !field("property-city").value) {
    alert("Selecione a cidade do imóvel.");
    return;
  }
  const payload = {
    id: id || Date.now(),
    ownerType: field("property-owner-type").value,
    owner: field("property-owner").value,
    type,
    registration: field("property-registration").value,
    reference: field("property-reference").value,
    address: field("property-address").value,
    cityId: field("property-city").value,
    city: cityLabel(cityById(field("property-city").value)),
    lot: field("property-lot").value,
    municipalRegistration: type === "urban" ? field("property-municipal-registration").value : "",
    block: type === "urban" ? field("property-block").value : "",
    glebe: type === "rural" ? field("property-glebe").value : "",
    carNumber: type === "rural" ? field("property-car-number").value : "",
    ccirIncra: type === "rural" ? field("property-ccir-incra").value : "",
    urbanArea: type === "urban" ? nonNegativeFieldValue("property-urban-area") : 0,
    ruralArea: type === "rural" ? nonNegativeFieldValue("property-rural-area") : 0,
    legalReserve: type === "rural" ? nonNegativeFieldValue("property-legal-reserve") : 0,
    appArea: type === "rural" ? nonNegativeFieldValue("property-app-area") : 0,
    ruralUse: field("property-rural-use").value,
    hasConstruction: field("property-has-construction").checked,
    constructionArea: field("property-has-construction").checked ? nonNegativeFieldValue("property-construction-area") : 0,
    status: "Ativo",
  };

  if (existing) Object.assign(existing, payload);
  else properties.push(payload);

  renderProperties();
  closeModal("property-modal");
  await persistProperty(payload, wasExisting);
  populateEnterpriseSelects();
}

document.querySelector("#property-new")?.addEventListener("click", newProperty);
document.querySelector("#property-save")?.addEventListener("click", saveProperty);
document.querySelector("#property-delete-confirm")?.addEventListener("click", () => {
  const id = pendingPropertyDeleteId;
  const index = properties.findIndex((property) => sameId(property.id, pendingPropertyDeleteId));
  if (index >= 0) properties.splice(index, 1);
  pendingPropertyDeleteId = null;
  renderProperties();
  persistDelete("properties", id, "imóvel");
  closeModal("property-delete-modal");
});
propertyOwnerType?.addEventListener("change", () => populatePropertyOwners());
propertyType?.addEventListener("change", updatePropertyFields);
propertyRuralUse?.addEventListener("change", updatePropertyFields);
propertyHasConstruction?.addEventListener("change", updatePropertyFields);
field("property-search")?.addEventListener("input", renderProperties);
field("urban-property-search")?.addEventListener("input", renderProperties);
field("rural-property-search")?.addEventListener("input", renderProperties);
["property-urban-area", "property-rural-area", "property-legal-reserve", "property-legal-reserve-ha", "property-app-area", "property-app-area-ha", "property-construction-area"].forEach((id) => {
  document.querySelector(`#${id}`)?.addEventListener("input", () => {
    const input = field(id);
    if (input && Number(input.value || 0) < 0) input.value = "0";
    updateReserveCalculation();
  });
});
document.querySelector("#property-legal-reserve")?.addEventListener("input", () => {
  syncAreaPair("property-legal-reserve", "property-legal-reserve-ha", "m2-to-ha");
});
document.querySelector("#property-legal-reserve-ha")?.addEventListener("input", () => {
  syncAreaPair("property-legal-reserve-ha", "property-legal-reserve", "ha-to-m2");
});
document.querySelector("#property-app-area")?.addEventListener("input", () => {
  syncAreaPair("property-app-area", "property-app-area-ha", "m2-to-ha");
});
document.querySelector("#property-app-area-ha")?.addEventListener("input", () => {
  syncAreaPair("property-app-area-ha", "property-app-area", "ha-to-m2");
});
propertyList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-property-action]");
  if (!button) return;
  const id = button.dataset.propertyId;
  const property = properties.find((item) => sameId(item.id, id));
  if (!property) return;

  if (button.dataset.propertyAction === "edit") {
    fillPropertyForm(property);
    document.querySelector("#property-modal-title").textContent = "Editar Imóvel";
    openModal("property-modal");
  }

  if (button.dataset.propertyAction === "delete") {
    pendingPropertyDeleteId = property.id;
    const text = document.querySelector("#property-delete-text");
    if (text) text.textContent = `Deseja realmente excluir o imóvel de matrícula ${property.registration}?`;
    openModal("property-delete-modal");
  }
});

if (propertyList) {
  populatePropertyOwners();
  renderProperties();
}

let enterprises = [];

let selectedEnterpriseId = 0;
let pendingEnterpriseDeleteId = null;
let enterpriseModuleSelection = ["environmental"];
let enterprisePropertySelection = [];
const enterpriseList = document.querySelector("#enterprise-list");
const enterpriseCount = document.querySelector("#enterprise-count");
const enterpriseCompany = document.querySelector("#enterprise-company");
const enterpriseProperty = document.querySelector("#enterprise-property");
const enterprisePropertyList = document.querySelector("#enterprise-property-list");
const enterprisePropertyOwnerCompany = document.querySelector("#enterprise-property-owner-company");

function activeSystemModules() {
  return availableAlertModules.length ? availableAlertModules : [...defaultSystemModules];
}

function enterpriseModules(enterprise) {
  return Array.isArray(enterprise?.modules) ? enterprise.modules : [];
}

function enterpriseModuleLabels(modules = []) {
  return modules.length ? modules.map(sendModuleLabel).join(", ") : "Nenhum módulo vinculado";
}

function updateEnterpriseModuleSummary(modules = enterpriseModuleSelection) {
  const summary = field("enterprise-module-summary");
  if (summary) summary.textContent = enterpriseModuleLabels(modules);
}

function renderEnterpriseModuleChecks(selectedModules = enterpriseModuleSelection) {
  const wrapper = field("enterprise-module-checks");
  if (!wrapper) return;
  wrapper.innerHTML = `<span>Módulos disponíveis</span>${activeSystemModules()
    .map(
      (module) => `
        <label>
          <input type="checkbox" name="enterprise-module" value="${module.id}" ${selectedModules.includes(module.id) ? "checked" : ""} />
          ${module.name}
        </label>
      `,
    )
    .join("")}`;
}

function openEnterpriseModulesModal() {
  renderEnterpriseModuleChecks(enterpriseModuleSelection);
  openModal("enterprise-modules-modal");
}

function applyEnterpriseModules() {
  enterpriseModuleSelection = checkedValues('input[name="enterprise-module"]');
  updateEnterpriseModuleSummary();
  closeModal("enterprise-modules-modal");
}

function enterprisesForModule(moduleId) {
  return enterprises.filter((enterprise) => enterpriseModules(enterprise).includes(moduleId));
}

function propertyCompanyOwnerName(property) {
  if (property.ownerType !== "pj") return "";
  return property.owner || companyNameById(property.ownerCompanyId);
}

function enterprisePropertyLabels(ids = enterprisePropertySelection) {
  const labels = ids
    .map((id) => properties.find((property) => sameId(property.id, id)))
    .filter(Boolean)
    .map((property) => `Matrícula ${property.registration}`);
  return labels;
}

function updateEnterprisePropertySummary(ids = enterprisePropertySelection) {
  const summary = field("enterprise-property-summary");
  const labels = enterprisePropertyLabels(ids);
  if (summary) summary.textContent = labels.length ? labels.join(", ") : "Nenhum imóvel selecionado";
  if (enterpriseProperty) enterpriseProperty.value = labels[0] || "";
}

function selectedEnterpriseOwnerCompanyName() {
  return enterprisePropertyOwnerCompany?.value || enterpriseCompany?.value || "";
}

function companyProperties(companyName = selectedEnterpriseOwnerCompanyName()) {
  return properties.filter((property) => property.ownerType === "pj" && propertyCompanyOwnerName(property) === companyName);
}

function enterprisePropertySearchText(property) {
  return normalizeSearchText([
    property.registration,
    property.reference,
    property.address,
    property.city,
    property.lot,
    property.block,
    property.glebe,
    property.municipalRegistration,
    property.carNumber,
    property.ccirIncra,
    propertyOwnerLabel(property),
  ].filter(Boolean).join(" "));
}

function renderEnterprisePropertyPicker() {
  if (!enterprisePropertyList) return;
  const search = normalizeSearchText(field("enterprise-property-search")?.value || "");
  const available = companyProperties().filter((property) => !search || enterprisePropertySearchText(property).includes(search));
  enterprisePropertyList.innerHTML = available.length
    ? available
        .map(
          (property) => `
            <article>
              <div>
                <strong>Matrícula ${property.registration}</strong>
                <span>${property.reference || propertyOwnerLabel(property)} - ${property.type === "rural" ? "Rural" : "Urbano"}</span>
              </div>
              <label class="checkbox-line">
                <input type="checkbox" name="enterprise-property-pick" value="${property.id}" ${enterprisePropertySelection.some((id) => sameId(id, property.id)) ? "checked" : ""} />
                Vincular
              </label>
            </article>
          `,
        )
        .join("")
    : `<article><strong>Nenhum imóvel encontrado</strong><span>Cadastre um imóvel vinculado a ${selectedEnterpriseOwnerCompanyName() || "empresa proprietária selecionada"}.</span></article>`;
}

function openEnterprisePropertyPicker() {
  if (field("enterprise-property-search")) field("enterprise-property-search").value = "";
  renderEnterprisePropertyPicker();
  openModal("enterprise-property-modal");
}

function populateEnterpriseSelects(selectedCompany = "", selectedProperty = "") {
  if (enterpriseCompany) {
    const companyNames = companies.map((company) => company.name);
    enterpriseCompany.innerHTML = companyNames.map((name) => `<option>${name}</option>`).join("");
    if (selectedCompany && companyNames.includes(selectedCompany)) enterpriseCompany.value = selectedCompany;
  }

  if (enterprisePropertyOwnerCompany) {
    const companyNames = companies.map((company) => company.name);
    enterprisePropertyOwnerCompany.innerHTML = companyNames.map((name) => `<option>${name}</option>`).join("");
    const selectedOwner = selectedEnterpriseOwnerCompanyName() || selectedCompany;
    if (selectedOwner && companyNames.includes(selectedOwner)) enterprisePropertyOwnerCompany.value = selectedOwner;
    else if (enterpriseCompany?.value) enterprisePropertyOwnerCompany.value = enterpriseCompany.value;
  }

  if (selectedProperty && !enterprisePropertySelection.length) {
    const propertyId = propertyIdByLabel(selectedProperty);
    enterprisePropertySelection = looksLikeUuid(propertyId) ? [propertyId] : [];
  }
  updateEnterprisePropertySummary();
}

function renderEnterprises() {
  if (!enterpriseList) return;
  enterpriseCount.textContent = `${enterprises.length} itens`;
  enterpriseList.innerHTML = enterprises
    .map(
      (enterprise) => {
        const modules = enterpriseModules(enterprise);
        const propertyLabel = enterprisePropertyLabels(enterprise.propertyIds || []).join(", ") || enterprise.property;
        return `
          <article>
            <strong>${enterprise.name}</strong>
            <span>${enterprise.company} - imóveis: ${propertyLabel} - ${enterprise.type} - ${enterprise.status} - modulos: ${enterpriseModuleLabels(modules)} - ${enterprise.potentialPolluter ? "CTF/APP: potencialmente poluidor" : "CTF/APP: não classificado"}</span>
            <div>
              <button type="button" data-enterprise-action="edit" data-enterprise-id="${enterprise.id}">Editar</button>
              <button type="button" data-enterprise-action="delete" data-enterprise-id="${enterprise.id}">Excluir</button>
            </div>
          </article>
        `;
      },
    )
    .join("");
}

function fillEnterpriseForm(enterprise) {
  if (!enterprise) return;
  selectedEnterpriseId = enterprise.id;
  field("enterprise-id").value = enterprise.id;
  enterprisePropertySelection = [...(enterprise.propertyIds || [])];
  populateEnterpriseSelects(enterprise.company, enterprise.property);
  if (field("enterprise-property-owner-company")) field("enterprise-property-owner-company").value = enterprise.propertyOwnerCompany || enterprise.company;
  updateEnterprisePropertySummary();
  field("enterprise-name").value = enterprise.name;
  field("enterprise-type").value = enterprise.type;
  field("enterprise-status").value = enterprise.status;
  field("enterprise-reference").value = enterprise.reference;
  enterpriseModuleSelection = [...enterpriseModules(enterprise)];
  updateEnterpriseModuleSummary();
}

function newEnterprise() {
  const id = Date.now();
  selectedEnterpriseId = id;
  field("enterprise-id").value = id;
  enterprisePropertySelection = [];
  populateEnterpriseSelects();
  field("enterprise-name").value = "";
  field("enterprise-type").value = "Industrial";
  field("enterprise-status").value = "Planejado";
  field("enterprise-reference").value = "";
  enterpriseModuleSelection = ["environmental"];
  updateEnterpriseModuleSummary();
  document.querySelector("#enterprise-modal-title").textContent = "Novo Empreendimento";
  openModal("enterprise-modal");
}

async function saveEnterprise() {
  const id = field("enterprise-id").value;
  const existing = enterprises.find((enterprise) => sameId(enterprise.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    name: field("enterprise-name").value,
    company: field("enterprise-company").value,
    propertyOwnerCompany: field("enterprise-property-owner-company")?.value || field("enterprise-company").value,
    property: field("enterprise-property").value,
    propertyIds: [...enterprisePropertySelection],
    type: field("enterprise-type").value,
    status: field("enterprise-status").value,
    responsible: "",
    reference: field("enterprise-reference").value,
    modules: [...enterpriseModuleSelection],
  };

  if (existing) Object.assign(existing, payload);
  else enterprises.push(payload);

  renderEnterprises();
  populateEnvironmentalProcessSelects();
  closeModal("enterprise-modal");
  await persistEnterprise(payload, wasExisting);
}

document.querySelector("#enterprise-new")?.addEventListener("click", newEnterprise);
document.querySelector("#enterprise-save")?.addEventListener("click", saveEnterprise);
document.querySelector("#enterprise-property-open")?.addEventListener("click", openEnterprisePropertyPicker);
document.querySelector("#enterprise-modules-open")?.addEventListener("click", openEnterpriseModulesModal);
document.querySelector("#enterprise-modules-apply")?.addEventListener("click", applyEnterpriseModules);
enterpriseCompany?.addEventListener("change", () => {
  if (enterprisePropertyOwnerCompany && !enterprisePropertyOwnerCompany.value) enterprisePropertyOwnerCompany.value = enterpriseCompany.value;
});
enterprisePropertyOwnerCompany?.addEventListener("change", () => {
  enterprisePropertySelection = enterprisePropertySelection.filter((id) => companyProperties().some((property) => sameId(property.id, id)));
  updateEnterprisePropertySummary();
});
field("enterprise-property-search")?.addEventListener("input", renderEnterprisePropertyPicker);
enterprisePropertyList?.addEventListener("click", (event) => {
  const checkbox = event.target.closest('input[name="enterprise-property-pick"]');
  if (!checkbox) return;
  const id = checkbox.value;
  if (checkbox.checked && !enterprisePropertySelection.some((item) => sameId(item, id))) enterprisePropertySelection.push(id);
  if (!checkbox.checked) enterprisePropertySelection = enterprisePropertySelection.filter((item) => !sameId(item, id));
  updateEnterprisePropertySummary();
});
field("enterprise-property-apply")?.addEventListener("click", () => {
  updateEnterprisePropertySummary();
  closeModal("enterprise-property-modal");
});
document.querySelector("#enterprise-delete-confirm")?.addEventListener("click", () => {
  const id = pendingEnterpriseDeleteId;
  const index = enterprises.findIndex((enterprise) => sameId(enterprise.id, pendingEnterpriseDeleteId));
  if (index >= 0) enterprises.splice(index, 1);
  pendingEnterpriseDeleteId = null;
  renderEnterprises();
  persistDelete("enterprises", id, "empreendimento");
  closeModal("enterprise-delete-modal");
});
enterpriseList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-enterprise-action]");
  if (!button) return;
  const id = button.dataset.enterpriseId;
  const enterprise = enterprises.find((item) => sameId(item.id, id));
  if (!enterprise) return;

  if (button.dataset.enterpriseAction === "edit") {
    fillEnterpriseForm(enterprise);
    document.querySelector("#enterprise-modal-title").textContent = "Editar Empreendimento";
    openModal("enterprise-modal");
  }

  if (button.dataset.enterpriseAction === "delete") {
    pendingEnterpriseDeleteId = enterprise.id;
    const text = document.querySelector("#enterprise-delete-text");
    if (text) text.textContent = `Deseja realmente excluir o empreendimento ${enterprise.name}?`;
    openModal("enterprise-delete-modal");
  }
});

if (enterpriseList) {
  populateEnterpriseSelects();
  renderEnterprises();
}

let activities = [];
let selectedActivityId = 0;
let activityEnterpriseSelection = [];
const activityList = document.querySelector("#activity-list");
const activityCount = document.querySelector("#activity-count");

function companyByCnpj(cnpj) {
  return companies.find((company) => company.cnpj === cnpj) || null;
}

function enterpriseCompanyCnpj(enterprise) {
  return companies.find((company) => company.name === enterprise.company)?.cnpj || "";
}

function activityEnterpriseLabels(ids = activityEnterpriseSelection) {
  const names = ids
    .map((id) => enterprises.find((enterprise) => sameId(enterprise.id, id))?.name)
    .filter(Boolean);
  return names.length ? names.join(", ") : "Nenhum empreendimento selecionado";
}

function updateActivityEnterpriseSummary(ids = activityEnterpriseSelection) {
  const summary = field("activity-enterprise-summary");
  if (summary) summary.textContent = activityEnterpriseLabels(ids);
}

function populateActivityCompanies(selectedCnpj = "") {
  const select = field("activity-company-cnpj");
  if (!select) return;
  select.innerHTML = companies
    .sort((a, b) => a.cnpj.localeCompare(b.cnpj))
    .map((company) => `<option value="${company.cnpj}">${company.cnpj} - ${company.name}</option>`)
    .join("");
  if (selectedCnpj && companies.some((company) => company.cnpj === selectedCnpj)) select.value = selectedCnpj;
}

function enterprisesForActivityCnpj(cnpj = field("activity-company-cnpj")?.value) {
  const company = companyByCnpj(cnpj);
  if (!company) return [];
  return enterprises.filter((enterprise) => enterprise.company === company.name);
}

function renderActivityEnterpriseChecks() {
  const wrapper = field("activity-enterprise-checks");
  if (!wrapper) return;
  const available = enterprisesForActivityCnpj();
  wrapper.innerHTML = `<span>Empreendimentos do CNPJ selecionado</span>${
    available.length
      ? available
          .map(
            (enterprise) => `
              <label>
                <input type="checkbox" name="activity-enterprise" value="${enterprise.id}" ${activityEnterpriseSelection.some((id) => sameId(id, enterprise.id)) ? "checked" : ""} />
                ${enterprise.name} - ${enterprise.property}
              </label>
            `,
          )
          .join("")
      : "<small>Nenhum empreendimento vinculado a este CNPJ.</small>"
  }`;
}

function openActivityEnterprisePicker() {
  renderActivityEnterpriseChecks();
  openModal("activity-enterprises-modal");
}

function applyActivityEnterprises() {
  activityEnterpriseSelection = checkedValues('input[name="activity-enterprise"]');
  updateActivityEnterpriseSummary();
  closeModal("activity-enterprises-modal");
}

function recalcEnterprisePolluterStatus() {
  enterprises.forEach((enterprise) => {
    enterprise.potentialPolluter = activities.some((activity) => Boolean(activity.ctfApp) && (activity.enterpriseIds || []).some((id) => sameId(id, enterprise.id)));
  });
}

async function persistEnterprisePolluterStatus() {
  if (!window.DocGestorDB) return;
  const rows = enterprises.filter((enterprise) => looksLikeUuid(enterprise.id));
  try {
    await Promise.all(rows.map((enterprise) => window.DocGestorDB.update("enterprises", enterprise.id, {
      potential_polluter: Boolean(enterprise.potentialPolluter),
    })));
  } catch (error) {
    console.warn("Não foi possível atualizar a classificação CTF/APP dos empreendimentos.", error.message);
  }
}

function renderActivities() {
  if (!activityList) return;
  recalcEnterprisePolluterStatus();
  activityCount.textContent = `${activities.length} itens`;
  activityList.innerHTML = activities
    .map(
      (activity) => `
        <article>
          <strong>${activity.name}</strong>
          <span>CNAE ${activity.cnae || "Não informado"} - CNPJ ${activity.companyCnpj || "Não informado"} - ${activity.ctfApp ? "CTF/APP: potencialmente poluidora" : "Sem CTF/APP"} - empreendimentos: ${activityEnterpriseLabels(activity.enterpriseIds || [])}</span>
          <div>
            <button type="button" data-activity-action="edit" data-activity-id="${activity.id}">Editar</button>
            <button type="button" data-activity-action="delete" data-activity-id="${activity.id}">Excluir</button>
          </div>
        </article>
      `,
    )
    .join("");
  renderEnterprises();
}

function fillActivityForm(activity) {
  selectedActivityId = activity.id;
  field("activity-id").value = activity.id;
  field("activity-name").value = activity.name;
  field("activity-cnae").value = activity.cnae || "";
  populateActivityCompanies(activity.companyCnpj);
  field("activity-ctf-app").checked = Boolean(activity.ctfApp);
  activityEnterpriseSelection = [...(activity.enterpriseIds || [])];
  updateActivityEnterpriseSummary();
}

function newActivity() {
  const id = Date.now();
  selectedActivityId = id;
  field("activity-id").value = id;
  field("activity-name").value = "";
  field("activity-cnae").value = "";
  populateActivityCompanies();
  field("activity-ctf-app").checked = false;
  activityEnterpriseSelection = [];
  updateActivityEnterpriseSummary();
  document.querySelector("#activity-modal-title").textContent = "Nova Atividade";
  openModal("activity-modal");
}

async function saveActivity() {
  const id = field("activity-id").value;
  const existing = activities.find((activity) => sameId(activity.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    name: field("activity-name").value,
    cnae: field("activity-cnae").value,
    companyCnpj: field("activity-company-cnpj").value,
    ctfApp: field("activity-ctf-app").checked,
    enterpriseIds: [...activityEnterpriseSelection],
  };
  if (existing) Object.assign(existing, payload);
  else activities.push(payload);
  renderActivities();
  closeModal("activity-modal");
  await persistActivity(payload, wasExisting);
}

document.querySelector("#activity-new")?.addEventListener("click", newActivity);
document.querySelector("#activity-save")?.addEventListener("click", saveActivity);
document.querySelector("#activity-enterprises-open")?.addEventListener("click", openActivityEnterprisePicker);
document.querySelector("#activity-enterprises-apply")?.addEventListener("click", applyActivityEnterprises);
field("activity-company-cnpj")?.addEventListener("change", () => {
  const availableIds = enterprisesForActivityCnpj().map((enterprise) => String(enterprise.id));
  activityEnterpriseSelection = activityEnterpriseSelection.filter((id) => availableIds.includes(String(id)));
  updateActivityEnterpriseSummary();
});
activityList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-activity-action]");
  if (!button) return;
  const id = button.dataset.activityId;
  const activity = activities.find((item) => sameId(item.id, id));
  if (!activity) return;
  if (button.dataset.activityAction === "edit") {
    fillActivityForm(activity);
    document.querySelector("#activity-modal-title").textContent = "Editar Atividade";
    openModal("activity-modal");
  }
  if (button.dataset.activityAction === "delete") {
    confirmDelete(`Deseja realmente excluir a atividade ${activity.name}?`, () => {
      const index = activities.findIndex((item) => sameId(item.id, id));
      if (index >= 0) activities.splice(index, 1);
      renderActivities();
      persistDelete("activities", id, "atividade");
      persistEnterprisePolluterStatus();
    });
  }
});

if (activityList) {
  populateActivityCompanies();
  renderActivities();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.textContent.trim() !== "Excluir") return;
  if (
    button.dataset.userAction ||
    button.dataset.partnerAction ||
    button.dataset.companyAction ||
    button.dataset.propertyAction ||
    button.dataset.enterpriseAction ||
    button.dataset.activityAction ||
    button.dataset.licenseTypeAction ||
    button.dataset.documentAction ||
    button.dataset.checklistModelAction
  ) {
    return;
  }

  const row = button.closest("article, .table-row");
  if (!row) return;
  const label = row.querySelector("strong, span")?.textContent || "este registro";
  confirmDelete(`Deseja realmente excluir ${label}?`, () => row.remove());
});

let environmentalLicenseTypes = [];

let environmentalDocuments = [];

let checklistModelsAdmin = [];

const licenseTypeList = document.querySelector("#license-type-list");
const licenseTypeCount = document.querySelector("#license-type-count");
const environmentalDocumentList = document.querySelector("#environmental-document-list");
const environmentalDocumentCount = document.querySelector("#environmental-document-count");
const checklistModelList = document.querySelector("#checklist-model-list");
const checklistModelCount = document.querySelector("#checklist-model-count");

function checkedValues(selector) {
  return Array.from(document.querySelectorAll(`${selector}:checked`)).map((input) => input.value);
}

function setCheckedValues(selector, values) {
  document.querySelectorAll(selector).forEach((input) => {
    input.checked = values.includes(input.value);
  });
}

function renderEnvironmentalLicenseTypes() {
  if (!licenseTypeList) return;
  licenseTypeCount.textContent = `${environmentalLicenseTypes.length} itens`;
  licenseTypeList.innerHTML = environmentalLicenseTypes.map((item) => `
    <article>
      <strong>${item.name}</strong>
      <span>${item.code} - ${item.phases.join(", ")}</span>
      <div>
        <button type="button" data-license-type-action="edit" data-license-type-id="${item.id}">Editar</button>
        <button type="button" data-license-type-action="delete" data-license-type-id="${item.id}">Excluir</button>
      </div>
    </article>
  `).join("");
}

function renderEnvironmentalDocuments() {
  if (!environmentalDocumentList) return;
  environmentalDocumentCount.textContent = `${environmentalDocuments.length} itens`;
  environmentalDocumentList.innerHTML = environmentalDocuments.map((item) => `
    <article>
      <strong>${item.name}</strong>
      <span>${item.licenses.length} licença(s) vinculada(s)</span>
      <div>
        <button type="button" data-document-action="view" data-document-id="${item.id}">Ver</button>
        <button type="button" data-document-action="edit" data-document-id="${item.id}">Editar</button>
        <button type="button" data-document-action="delete" data-document-id="${item.id}">Excluir</button>
      </div>
    </article>
  `).join("");
}

function openEnvironmentalDocumentView(item) {
  const titleElement = field("environmental-document-view-title");
  const content = field("environmental-document-view-content");
  if (titleElement) titleElement.textContent = item.name || "Documento";
  if (content) {
    content.innerHTML = `
      <div>
        <span>Nome</span>
        <strong>${escapeHtml(item.name || "Não informado")}</strong>
      </div>
      <div>
        <span>Licenças vinculadas</span>
        <p>${escapeHtml(item.licenses?.length ? item.licenses.join(", ") : "Nenhuma licença vinculada")}</p>
      </div>
      <div>
        <span>Exige vencimento</span>
        <strong>${escapeHtml(item.expiration || "Não informado")}</strong>
      </div>
      <div>
        <span>Obrigatório por padrão</span>
        <strong>${escapeHtml(item.required || "Não informado")}</strong>
      </div>
      <div>
        <span>Parâmetros do Documento</span>
        <p>${escapeHtml(item.parameters || "Não informado")}</p>
      </div>
    `;
  }
  openModal("environmental-document-view-modal");
}

function renderDocumentLicenseChecks(selectedLicenses = []) {
  const wrapper = document.querySelector("#document-license-checks");
  if (!wrapper) return;
  wrapper.innerHTML = `<span>Licenças vinculadas</span>${environmentalLicenseTypes
    .map(
      (license) => `
        <label><input type="checkbox" name="document-license" value="${license.name}" ${selectedLicenses.includes(license.name) ? "checked" : ""} /> ${license.name}</label>
      `,
    )
    .join("")}`;
}

function documentsForLicense(licenseName) {
  return environmentalDocuments.filter((documentItem) => documentItem.licenses.includes(licenseName));
}

function renderChecklistDocumentChecks(licenseName, selectedDocuments = null) {
  const wrapper = document.querySelector("#checklist-document-checks");
  if (!wrapper) return;
  const documents = documentsForLicense(licenseName);
  const selected = selectedDocuments || documents.map((item) => item.name);
  wrapper.innerHTML = `<span>Documentos vinculados a licença selecionada</span>${
    documents.length
      ? documents
          .map(
            (documentItem) => `
              <label><input type="checkbox" name="checklist-document" value="${documentItem.name}" ${selected.includes(documentItem.name) ? "checked" : ""} /> ${documentItem.name}</label>
            `,
          )
          .join("")
      : "<small>Nenhum documento vinculado a está licença.</small>"
  }`;
}

function populateChecklistModelSelects(selectedLicense = "", selectedDocuments = null) {
  const licenseSelect = document.querySelector("#checklist-model-license");
  if (licenseSelect) {
    licenseSelect.innerHTML = environmentalLicenseTypes.map((item) => `<option>${item.name}</option>`).join("");
    if (selectedLicense) licenseSelect.value = selectedLicense;
    renderChecklistDocumentChecks(licenseSelect.value, selectedDocuments);
  }
}

function renderChecklistModelsAdmin() {
  if (!checklistModelList) return;
  checklistModelCount.textContent = `${checklistModelsAdmin.length} itens`;
  checklistModelList.innerHTML = checklistModelsAdmin.map((item) => `
    <article>
      <strong>${item.name}</strong>
      <span>${item.license} - documentos: ${item.documents.join(", ")}</span>
      <div>
        <button type="button" data-checklist-model-action="edit" data-checklist-model-id="${item.id}">Editar</button>
        <button type="button" data-checklist-model-action="delete" data-checklist-model-id="${item.id}">Excluir</button>
      </div>
    </article>
  `).join("");
}

document.querySelector("#license-type-new")?.addEventListener("click", () => {
  field("license-type-id").value = Date.now();
  field("license-type-name").value = "";
  field("license-type-code").value = "";
  setCheckedValues('input[name="license-phase"]', []);
  document.querySelector("#license-type-modal-title").textContent = "Novo Tipo de Licença";
  openModal("license-type-modal");
});

document.querySelector("#license-type-save")?.addEventListener("click", async () => {
  const id = field("license-type-id").value;
  const existing = environmentalLicenseTypes.find((item) => sameId(item.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    name: field("license-type-name").value,
    code: field("license-type-code").value,
    validity: "",
    renewal: "",
    phases: checkedValues('input[name="license-phase"]'),
  };
  if (existing) Object.assign(existing, payload);
  else environmentalLicenseTypes.push(payload);
  renderEnvironmentalLicenseTypes();
  populateChecklistModelSelects();
  closeModal("license-type-modal");
  await persistEnvironmentalLicenseType(payload, wasExisting);
});

licenseTypeList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-license-type-action]");
  if (!button) return;
  const id = button.dataset.licenseTypeId;
  const item = environmentalLicenseTypes.find((entry) => sameId(entry.id, id));
  if (!item) return;
  if (button.dataset.licenseTypeAction === "edit") {
    field("license-type-id").value = item.id;
    field("license-type-name").value = item.name;
    field("license-type-code").value = item.code;
    setCheckedValues('input[name="license-phase"]', item.phases);
    document.querySelector("#license-type-modal-title").textContent = "Editar Tipo de Licença";
    openModal("license-type-modal");
  }
  if (button.dataset.licenseTypeAction === "delete") {
    confirmDelete(`Deseja realmente excluir o tipo de licença ${item.name}?`, () => {
      const index = environmentalLicenseTypes.findIndex((entry) => sameId(entry.id, id));
      if (index >= 0) environmentalLicenseTypes.splice(index, 1);
      renderEnvironmentalLicenseTypes();
      populateChecklistModelSelects();
      persistDelete("environmental_license_types", id, "tipo de licença");
    });
  }
});

document.querySelector("#environmental-document-new")?.addEventListener("click", () => {
  field("environmental-document-id").value = Date.now();
  field("environmental-document-name").value = "";
  field("environmental-document-expiration").value = "Nao";
  field("environmental-document-required").value = "Sim";
  field("environmental-document-parameters").value = "";
  renderDocumentLicenseChecks();
  document.querySelector("#environmental-document-modal-title").textContent = "Novo Documento";
  openModal("environmental-document-modal");
});

document.querySelector("#environmental-document-save")?.addEventListener("click", async () => {
  const id = field("environmental-document-id").value;
  const existing = environmentalDocuments.find((item) => sameId(item.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    name: field("environmental-document-name").value,
    expiration: field("environmental-document-expiration").value,
    required: field("environmental-document-required").value,
    parameters: field("environmental-document-parameters").value,
    licenses: checkedValues('input[name="document-license"]'),
  };
  if (existing) Object.assign(existing, payload);
  else environmentalDocuments.push(payload);
  renderEnvironmentalDocuments();
  populateChecklistModelSelects();
  closeModal("environmental-document-modal");
  await persistEnvironmentalDocument(payload, wasExisting);
});

environmentalDocumentList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-document-action]");
  if (!button) return;
  const id = button.dataset.documentId;
  const item = environmentalDocuments.find((entry) => sameId(entry.id, id));
  if (!item) return;
  if (button.dataset.documentAction === "view") {
    openEnvironmentalDocumentView(item);
  }
  if (button.dataset.documentAction === "edit") {
    field("environmental-document-id").value = item.id;
    field("environmental-document-name").value = item.name;
    field("environmental-document-expiration").value = item.expiration;
    field("environmental-document-required").value = item.required;
    field("environmental-document-parameters").value = item.parameters || "";
    renderDocumentLicenseChecks(item.licenses);
    document.querySelector("#environmental-document-modal-title").textContent = "Editar Documento";
    openModal("environmental-document-modal");
  }
  if (button.dataset.documentAction === "delete") {
    confirmDelete(`Deseja realmente excluir o documento ${item.name}?`, () => {
      const index = environmentalDocuments.findIndex((entry) => sameId(entry.id, id));
      if (index >= 0) environmentalDocuments.splice(index, 1);
      renderEnvironmentalDocuments();
      populateChecklistModelSelects();
      persistDelete("environmental_documents", id, "documento ambiental");
    });
  }
});

document.querySelector("#checklist-model-new")?.addEventListener("click", () => {
  field("checklist-model-id").value = Date.now();
  populateChecklistModelSelects();
  field("checklist-model-name").value = "";
  document.querySelector("#checklist-model-modal-title").textContent = "Novo Modelo";
  openModal("checklist-model-modal");
});

document.querySelector("#checklist-model-save")?.addEventListener("click", async () => {
  const id = field("checklist-model-id").value;
  const existing = checklistModelsAdmin.find((item) => sameId(item.id, id));
  const wasExisting = Boolean(existing);
  const payload = {
    id: id || Date.now(),
    name: field("checklist-model-name").value,
    license: field("checklist-model-license").value,
    documents: checkedValues('input[name="checklist-document"]'),
  };
  if (existing) Object.assign(existing, payload);
  else checklistModelsAdmin.push(payload);
  renderChecklistModelsAdmin();
  closeModal("checklist-model-modal");
  await persistChecklistModel(payload, wasExisting);
});

checklistModelList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-checklist-model-action]");
  if (!button) return;
  const id = button.dataset.checklistModelId;
  const item = checklistModelsAdmin.find((entry) => sameId(entry.id, id));
  if (!item) return;
  if (button.dataset.checklistModelAction === "edit") {
    field("checklist-model-id").value = item.id;
    field("checklist-model-name").value = item.name;
    populateChecklistModelSelects(item.license, item.documents);
    document.querySelector("#checklist-model-modal-title").textContent = "Editar Modelo";
    openModal("checklist-model-modal");
  }
  if (button.dataset.checklistModelAction === "delete") {
    confirmDelete(`Deseja realmente excluir o modelo de ${item.license}?`, () => {
      const index = checklistModelsAdmin.findIndex((entry) => sameId(entry.id, id));
      if (index >= 0) checklistModelsAdmin.splice(index, 1);
      renderChecklistModelsAdmin();
      persistDelete("environmental_checklist_models", id, "modelo de check-list");
    });
  }
});

document.querySelector("#checklist-model-license")?.addEventListener("change", (event) => {
  renderChecklistDocumentChecks(event.target.value);
});

renderEnvironmentalLicenseTypes();
renderEnvironmentalDocuments();
populateChecklistModelSelects();
renderChecklistModelsAdmin();

let checklistModels = {};

const licenseTypeSelect = document.querySelector("#license-type-select");
const generatedChecklist = document.querySelector("#generated-checklist");
let environmentalProcesses = [];

let currentLicenseStatus = "general";
let activeStageProcessId = null;
let activeStageNumber = null;

const licenseStatusMeta = {
  general: {
    title: "03.1 Licenças Ambientais",
    subtitle: "Gestao geral dos processos ambientais, abertura de novos processos e acompanhamento operacional.",
    pill: "green",
  },
  open: {
    title: "03.1.1 Abertas",
    subtitle: "Processos ambientais ativos ou em andamento.",
    pill: "green",
  },
  pending: {
    title: "03.1.2 Pendentes",
    subtitle: "Processos com exigências, documentos ou retorno de órgão ambiental pendente.",
    pill: "yellow",
  },
  done: {
    title: "03.1.4 Concluídas",
    subtitle: "Processos finalizados, deferidos ou encerrados.",
    pill: "green",
  },
  expired: {
    title: "03.1.3 Vencidas",
    subtitle: "Processos com licença vencida ou prazo crítico ultrapassado.",
    pill: "red",
  },
  licenses: {
    title: "03.1.5 Licenças",
    subtitle: "Relação das licenças ambientais vinculadas aos processos cadastrados.",
    pill: "green",
  },
};

function renderChecklist(type) {
  if (!generatedChecklist) return;
  const items = checklistModels[type] || checklistModels["Licença de Operação"];
  generatedChecklist.innerHTML = items
    .map(
      ([label, source, checked]) => `
        <label>
          <input type="checkbox" ${checked ? "checked" : ""} />
          ${label}
          <span>${source}</span>
        </label>
      `,
    )
    .join("");
}

if (licenseTypeSelect) {
  licenseTypeSelect.addEventListener("change", () => renderChecklist(licenseTypeSelect.value));
  renderChecklist(licenseTypeSelect.value);
}

function processPillClass(process) {
  if (process.status === "done") return "green";
  if (process.status === "pending") return "yellow";
  if (process.status === "expired") return "red";
  return process.risk.toLowerCase().includes("crítico") ? "red" : "green";
}

function processSortValue(process) {
  const [sequence = "0", year = "0"] = String(process.internalNumber || process.number || "0/0").split("/");
  return Number(year) * 100000 + Number(sequence);
}

function sortedProcesses(processes) {
  return [...processes].sort((a, b) => processSortValue(b) - processSortValue(a));
}

function activeLicenses() {
  return environmentalProcesses
    .filter((process) => process.activeLicense)
    .map((process) => {
      const license = { ...process.activeLicense, process };
      license.status = daysUntil(license.expiryDate) !== null && daysUntil(license.expiryDate) <= 0 ? "Vencida" : license.status || "Ativa";
      return license;
    })
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

function findActiveLicense(processId, stageNumber = null) {
  return activeLicenses().find((license) => {
    const sameProcess = String(license.processId) === String(processId);
    const sameStage = stageNumber === null || String(license.stageNumber) === String(stageNumber);
    return sameProcess && sameStage;
  });
}

function normalizedLicenseText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function operationalLicenseCode(license) {
  const text = normalizedLicenseText([license?.type, license?.licenseType, license?.name].filter(Boolean).join(" "));
  const tokens = text.split(/[^A-Z0-9]+/).filter(Boolean);
  if (tokens.includes("LAC") || text.includes("LICENCA AMBIENTAL CORRETIVA")) return "LAC";
  if (tokens.includes("LAS") || text.includes("LICENCA AMBIENTAL SIMPLIFICADA")) return "LAS";
  if (tokens.includes("LO") || text.includes("LICENCA DE OPERACAO") || text.includes("LICENCA OPERACAO")) return "LO";
  return "";
}

function licenseActiveAt(license, referenceDate = new Date()) {
  if (!license?.expiryDate) return false;
  if (["substituida", "substituída", "cancelada", "excluida", "excluída"].includes(String(license.status || "").toLowerCase())) return false;
  const expiry = parseDateKey(license.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  expiry.setHours(23, 59, 59, 999);
  return expiry >= referenceDate;
}

function licenseBelongsToEnterprise(license, enterprise) {
  const process = license?.process || {};
  if (license?.enterpriseId && sameId(license.enterpriseId, enterprise.id)) return true;
  if (process.enterpriseId && sameId(process.enterpriseId, enterprise.id)) return true;
  const enterpriseNames = [process.enterprise, process.title, license.title].map(normalizeSearchText);
  return enterpriseNames.includes(normalizeSearchText(enterprise.name)) && normalizeSearchText(process.company || license.company) === normalizeSearchText(enterprise.company);
}

function operationalLicensesForEnterprise(enterprise, referenceDate = new Date()) {
  return activeLicenses().filter((license) => operationalLicenseCode(license) && licenseBelongsToEnterprise(license, enterprise) && licenseActiveAt(license, referenceDate));
}

function isOperationLicense(license) {
  return String(license?.type || "").toLowerCase().includes("operação");
}

function licensePhaseForFormat(format) {
  return {
    monofasico: "Monofasica",
    bifasico: "Bifasica",
    trifasico: "Trifasica",
  }[format] || "Monofasica";
}

function licenseTypesForFormat(format) {
  const phase = licensePhaseForFormat(format);
  return environmentalLicenseTypes.filter((type) => type.phases.includes(phase));
}

function licenseSelectionCountForFormat(format) {
  return {
    monofasico: 1,
    bifasico: 2,
    trifasico: 3,
  }[format] || 1;
}

function licensePhaseLabel(format, index) {
  if (format === "bifasico") return index === 0 ? "Primeira licença" : "Última licença";
  if (format === "trifasico") return ["Primeira licença", "Licença 2", "Licença final"][index] || `Licença ${index + 1}`;
  return "Licença ambiental";
}

function selectedEnvironmentalProcessLicenses() {
  return Array.from(document.querySelectorAll(".environmental-process-license-select"))
    .map((select) => select.value)
    .filter(Boolean);
}

function checklistModelsForLicense(licenseName) {
  return checklistModelsAdmin.filter((model) => model.license === licenseName);
}

function fallbackChecklistModel(licenseName) {
  return {
    id: `fallback-${licenseName}`,
    name: `Documentos vinculados a ${licenseName}`,
    license: licenseName,
    documents: documentsForLicense(licenseName).map((documentItem) => documentItem.name),
  };
}

function firstDocumentStageNumber(process) {
  return ensureProcessStages(process).find((stage) => isDocumentStage(stage))?.number || 1;
}

function documentStageIndex(process, stageNumber) {
  return ensureProcessStages(process).filter((stage) => isDocumentStage(stage) && stage.number <= stageNumber).length - 1;
}

function licenseStageIndex(process, stageNumber) {
  return ensureProcessStages(process).filter((stage) => isLicenseStage(stage) && stage.number <= stageNumber).length - 1;
}

function licenseForDocumentStage(process, stageNumber) {
  const index = Math.max(0, documentStageIndex(process, stageNumber));
  return process.licenseTypes?.[index] || process.licenseTypes?.[0] || process.type.split(" / ")[0];
}

function licenseForLicenseStage(process, stageNumber) {
  const index = Math.max(0, licenseStageIndex(process, stageNumber));
  return process.licenseTypes?.[index] || process.licenseTypes?.[0] || process.type.split(" / ")[0];
}

function protocolForLicenseStage(process, stageNumber) {
  const protocolStage = [...ensureProcessStages(process)].reverse().find((stage) => isProtocolStage(stage) && stage.number < stageNumber);
  return protocolStage ? stageRecord(process, protocolStage.number).protocolNumber || "" : "";
}

function documentsForCurrentProcessStage(process) {
  const currentStage = currentProcessStage(process);
  return process.stageDocuments?.[currentStage?.number] || [];
}

function isDocumentStage(stage) {
  const name = stage?.name?.toLowerCase() || "";
  return stage?.stageKind === "checklist" || name.includes("check-list") || name.includes("juntada de documentos");
}

function isProtocolStage(stage) {
  return stage?.stageKind === "protocol" || stage?.name?.toLowerCase().includes("protocolo");
}

function isLicenseStage(stage) {
  return stage?.stageKind === "license" || stage?.name?.toLowerCase().includes("licença");
}

function stageRecord(process, stageNumber) {
  process.stageRecords = process.stageRecords || {};
  process.stageRecords[stageNumber] = process.stageRecords[stageNumber] || {};
  return process.stageRecords[stageNumber];
}

function areStageDocumentsComplete(process, stageNumber) {
  const documents = process.stageDocuments?.[stageNumber] || [];
  return documents.length > 0 && documents.every((documentItem) => documentItem.prepared);
}

function stageGateMessage(process, stage) {
  if (!isDocumentStage(stage)) return "";
  const documents = process.stageDocuments?.[stage.number] || [];
  if (!documents.length) return "Selecione um modelo de check-list e inclua os documentos da etapa.";
  const pending = documents.filter((documentItem) => !documentItem.prepared);
  return pending.length ? `Ainda existe(m) ${pending.length} documento(s) sem marcar como Elaborado.` : "";
}

function canCompleteStage(process, stage) {
  if (isProtocolStage(stage)) {
    const record = stageRecord(process, stage.number);
    if (!record.protocolNumber || !record.protocolDate) return false;
  }
  if (isLicenseStage(stage)) {
    const record = stageRecord(process, stage.number);
    if (!record.licenseNumber || !record.expiryDate) return false;
  }
  if (!isDocumentStage(stage)) return true;
  return areStageDocumentsComplete(process, stage.number);
}

function stageRequiredMessage(process, stage) {
  if (isProtocolStage(stage) && !canCompleteStage(process, stage)) return "Informe o número e a data do protocolo ambiental.";
  if (isLicenseStage(stage) && !canCompleteStage(process, stage)) return "Informe o número da licença e a data de vencimento.";
  return stageGateMessage(process, stage);
}

function canOpenProcessStage(process, stageNumber) {
  const stages = ensureProcessStages(process);
  if (stageNumber <= 1) return true;
  const previousStage = stages.find((stage) => stage.number === stageNumber - 1);
  return previousStage?.status === "Concluída";
}

function showStageAccessMessage(stageNumber) {
  const message = field("environmental-process-stage-access-message");
  const text = field("environmental-process-stage-access-text");
  if (message) message.hidden = false;
  if (text) text.textContent = `Para continuar a etapa ${stageNumber}, conclua a etapa ${stageNumber - 1} primeiro.`;
}

function hideStageAccessMessage() {
  const message = field("environmental-process-stage-access-message");
  if (message) message.hidden = true;
}

function nextEnvironmentalProcessNumber() {
  const year = new Date().getFullYear();
  const numbers = environmentalProcesses
    .map((process) => process.internalNumber || "")
    .filter((number) => number.endsWith(`/${year}`))
    .map((number) => Number(number.split("/")[0]))
    .filter((number) => !Number.isNaN(number));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${String(next).padStart(3, "0")}/${year}`;
}

function updateNextProcessNumber() {
  const target = field("next-process-number");
  if (target) target.textContent = nextEnvironmentalProcessNumber();
}

const licensingFormatStages = {
  monofasico: {
    label: "Monofasico",
    stages: [
      ["Check-list", "Organizar documentos e checklist inicial."],
      ["Protocolo", "Registrar protocolo no órgão ambiental."],
      ["Licença", "Informar número, emissão, vencimento e condicionantes."],
    ],
  },
  bifasico: {
    label: "Bifasico",
    stages: [
      ["Check-list", "Preparar documentos da primeira fase."],
      ["Protocolo", "Protocolar a primeira etapa no órgão ambiental."],
      ["Licença", "Cadastrar a primeira licença emitida."],
      ["Check-list", "Preparar documentos complementares."],
      ["Protocolo", "Protocolar a etapa final."],
      ["Licença", "Cadastrar a licença final e seus vencimentos."],
    ],
  },
  trifasico: {
    label: "Trifasico",
    stages: [
      ["Check-list", "Preparar documentos da primeira fase."],
      ["Protocolo", "Protocolar a primeira fase."],
      ["Licença", "Cadastrar primeira licença emitida."],
      ["Check-list", "Preparar documentos da segunda fase."],
      ["Protocolo", "Protocolar a segunda fase."],
      ["Licença", "Cadastrar segunda licença emitida."],
      ["Check-list", "Preparar documentos da fase final."],
      ["Protocolo", "Protocolar a fase final."],
      ["Licença", "Cadastrar licença final, vencimentos e condicionantes."],
    ],
  },
};

function processStagesForFormat(format) {
  const config = licensingFormatStages[format] || licensingFormatStages.monofasico;
  const stageKinds = ["checklist", "protocol", "license"];
  return config.stages.map(([name, description], index) => ({
    number: index + 1,
    name,
    description,
    blockNumber: Math.floor(index / 3) + 1,
    stageKind: stageKinds[index % 3],
    status: index === 0 ? "Em andamento" : "Não iniciada",
    validityDate: "",
    warningDays: 60,
    warningTime: "09:00",
    criticalDays: 15,
    criticalTime: "09:00",
    emergencyDays: 3,
    emergencyTime: "09:00",
    renewalDays: 120,
    renewalTime: "09:00",
    deadlineTime: "09:00",
    deadlineStatus: "open",
  }));
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target - today) / 86400000);
}

function dateIsAfter(dateValue, limitValue) {
  if (!dateValue || !limitValue) return false;
  const date = parseDateKey(dateValue);
  const limit = parseDateKey(limitValue);
  if (Number.isNaN(date.getTime()) || Number.isNaN(limit.getTime())) return false;
  return date > limit;
}

function updateStageDeadlineStatus(stage) {
  const remaining = daysUntil(stage.validityDate);
  if (stage.status === "Concluída") {
    stage.deadlineStatus = "completed";
    return stage.deadlineStatus;
  }
  if (remaining === null) {
    stage.deadlineStatus = "open";
  } else if (remaining <= 0) {
    stage.deadlineStatus = "expired";
  } else if (remaining <= Number(stage.emergencyDays || 0)) {
    stage.deadlineStatus = "emergency";
  } else if (remaining <= Number(stage.criticalDays || 0)) {
    stage.deadlineStatus = "critical";
  } else if (remaining <= Number(stage.warningDays || 0)) {
    stage.deadlineStatus = "warning";
  } else {
    stage.deadlineStatus = "open";
  }
  return stage.deadlineStatus;
}

function applyProcessDeadlineRules(process) {
  const stages = ensureProcessStages(process);
  stages.forEach(updateStageDeadlineStatus);
  const currentStage = currentProcessStage(process);
  const processDueExpired = daysUntil(process.acquisitionDueDate) !== null && daysUntil(process.acquisitionDueDate) <= 0 && process.status !== "done";
  const expiredStage = stages.find((stage) => stage.deadlineStatus === "expired" && stage.status !== "Concluída");
  const expiredActiveLicense = process.activeLicense && daysUntil(process.activeLicense.expiryDate) !== null && daysUntil(process.activeLicense.expiryDate) <= 0;
  const criticalStage = stages.some((stage) => ["warning", "critical", "emergency"].includes(stage.deadlineStatus) && stage.status !== "Concluída");

  if (expiredActiveLicense) {
    process.status = "expired";
    process.statusLabel = processStatusLabel("expired");
    process.risk = "Licença vencida";
    process.due = "Licença ambiental vencida";
    return;
  }

  if (processDueExpired || expiredStage) {
    process.status = "pending";
    process.statusLabel = processStatusLabel("pending");
    process.risk = processDueExpired ? "Prazo de aquisição vencido" : `${expiredStage.name} vencida`;
    process.due = processDueExpired
      ? "Data limite para aquisição da licença ultrapassada"
      : `Prazo da etapa ${expiredStage.number} ultrapassado`;
    return;
  }

  if (criticalStage && process.status === "open") {
    process.risk = "Prazo em atenção";
    process.due = currentStage?.validityDate ? `Etapa atual vence em ${formatAgendaDate(currentStage.validityDate)}` : "Há etapa próxima do vencimento";
  }
}

function processStatusLabel(status) {
  return {
    open: "Aberta",
    pending: "Pendente",
    expired: "Vencida",
    done: "Concluída",
  }[status] || "Aberta";
}

function ensureProcessStages(process) {
  if (!process.stages?.length) {
    const stages = processStagesForFormat(process.licensingFormat);
    const completedCount = Math.min(stages.length, Math.floor(((process.progress || 0) / 100) * stages.length));
    stages.forEach((stage, index) => {
      if (index < completedCount) stage.status = "Concluída";
      if (index === completedCount && completedCount < stages.length) stage.status = "Em andamento";
      if (index > completedCount) stage.status = "Não iniciada";
    });
    if ((process.progress || 0) >= 100) {
      stages.forEach((stage) => {
        stage.status = "Concluída";
      });
    }
    process.stages = stages;
  }
  return process.stages;
}

function currentProcessStage(process) {
  const stages = ensureProcessStages(process);
  return stages.find((stage) => stage.status === "Em andamento") || stages.find((stage) => stage.status !== "Concluída") || stages[stages.length - 1];
}

function updateProcessProgress(process) {
  const stages = ensureProcessStages(process);
  const completed = stages.filter((stage) => stage.status === "Concluída").length;
  process.progress = Math.round((completed / stages.length) * 100);
  if (completed === stages.length) {
    process.status = "done";
    process.statusLabel = processStatusLabel("done");
    process.risk = "Processo concluído";
    process.due = "Sem pendências";
  }
  applyProcessDeadlineRules(process);
  return process.progress;
}

function setProcessCurrentStage(process, stageNumber) {
  const stages = ensureProcessStages(process);
  stages.forEach((stage) => {
    if (stage.number < stageNumber) stage.status = "Concluída";
    if (stage.number === stageNumber) stage.status = "Em andamento";
    if (stage.number > stageNumber) stage.status = "Não iniciada";
  });
  if (process.status === "done") {
    process.status = "open";
    process.statusLabel = processStatusLabel("open");
    process.risk = "Reaberto";
    process.due = "Acompanhamento retomado";
  }
  updateProcessProgress(process);
}

function restartProcessForExpansion(process) {
  const stages = ensureProcessStages(process);
  stages.forEach((stage, index) => {
    stage.status = index === 0 ? "Em andamento" : "Não iniciada";
  });
  Object.values(process.stageDocuments || {}).forEach((documents) => {
    documents.forEach((documentItem) => {
      documentItem.prepared = false;
      documentItem.notes = "";
    });
  });
  process.stageRecords = {};
  process.status = "open";
  process.statusLabel = processStatusLabel("open");
  process.risk = "Ampliação";
  process.due = "Processo reaberto para ampliação";
  process.progress = 0;
  applyProcessDeadlineRules(process);
}

async function completeProcessStage(process, stageNumber) {
  const stages = ensureProcessStages(process);
  const stage = stages.find((item) => item.number === stageNumber);
  if (!stage) return;
  if (!canCompleteStage(process, stage)) return;
  registerStageData(process, stage);
  stage.status = "Concluída";
  await cancelPendingAlertsForStage(process, stage);
  if (isLicenseStage(stage)) await cancelPendingAlertsForBlock(process, stage.blockNumber || 1);
  const nextStage = stages.find((item) => item.number > stageNumber);
  if (nextStage) {
    setProcessCurrentStage(process, nextStage.number);
  } else {
    stages.forEach((item) => {
      item.status = "Concluída";
    });
    updateProcessProgress(process);
  }
}

function isLastProcessStage(process, stageNumber) {
  const stages = ensureProcessStages(process);
  return stageNumber >= Math.max(...stages.map((stage) => stage.number));
}

function processStageClass(stage) {
  if (stage.status === "Concluída") return "done";
  if (stage.status === "Em andamento") return "current";
  if (stage.status === "Pendente") return "blocked";
  return "";
}

function stageStatusPill(stage) {
  if (stage.deadlineStatus === "expired") return "red";
  if (stage.deadlineStatus === "emergency") return "red";
  if (stage.deadlineStatus === "critical" || stage.deadlineStatus === "warning") return "yellow";
  if (stage.status === "Concluída") return "green";
  if (stage.status === "Em andamento") return "yellow";
  if (stage.status === "Pendente") return "red";
  return "muted";
}

function stageDeadlineLabel(stage) {
  updateStageDeadlineStatus(stage);
  const labels = {
    open: "Prazo normal",
    warning: "Aviso minimo",
    critical: "Prazo crítico",
    emergency: "Emergência",
    expired: "Vencida",
    completed: "Concluída",
  };
  const validity = stage.validityDate ? `Validade: ${formatAgendaDate(stage.validityDate)}` : "Sem validade definida";
  return `${validity} - ${labels[stage.deadlineStatus] || "Prazo normal"}`;
}

function updateEnvironmentalProcessStagesPreview() {
  const format = field("environmental-process-format")?.value || "monofasico";
  const config = licensingFormatStages[format] || licensingFormatStages.monofasico;
  const summary = field("environmental-process-stage-summary");
  const list = field("environmental-process-stage-list");
  if (summary) summary.textContent = `${config.label} - ${config.stages.length} etapas`;
  if (list) {
    list.innerHTML = processStagesForFormat(format)
      .map(
        (stage) => `
          <article class="process-stage-item">
            <span>Bloco ${stage.blockNumber} - Etapa ${stage.number}</span>
            <strong>${stage.name}</strong>
            <small>${stage.description}</small>
          </article>
        `,
      )
      .join("");
  }
}

function populateEnvironmentalProcessSelects() {
  const number = nextEnvironmentalProcessNumber();
  field("environmental-process-number").value = number;
  const enterpriseSelect = field("environmental-process-enterprise");
  const companySelect = field("environmental-process-company");
  const branchSelect = field("environmental-process-branch");
  const propertySelect = field("environmental-process-property");
  const responsibleSelect = field("environmental-process-responsible");

  if (enterpriseSelect) {
    const environmentalEnterprises = enterprisesForModule("environmental");
    enterpriseSelect.innerHTML = environmentalEnterprises.length
      ? environmentalEnterprises.map((enterprise) => `<option value="${enterprise.name}">${enterprise.name}</option>`).join("")
      : `<option value="">Nenhum empreendimento vinculado ao módulo Ambiental</option>`;
  }
  if (companySelect) {
    companySelect.innerHTML = companies
      .filter((company) => company.kind === "matrix")
      .map((company) => `<option value="${company.name}">${company.name}</option>`)
      .join("");
  }
  if (branchSelect) {
    branchSelect.innerHTML = companies
      .filter((company) => company.kind === "branch")
      .map((company) => `<option value="${company.name}">${company.name}</option>`)
      .join("");
  }
  if (propertySelect) {
    propertySelect.innerHTML = properties.map((property) => `<option value="Matrícula ${property.registration}">Matrícula ${property.registration} - ${property.city || "Cidade não informada"} - ${property.reference || propertyOwnerLabel(property)}</option>`).join("");
  }
  if (responsibleSelect) {
    responsibleSelect.innerHTML = partners.map((partner) => `<option value="${partner.name}">${partner.name}</option>`).join("");
  }
  updateEnvironmentalProcessLicenseOptions();
  updateEnvironmentalProcessEnterpriseFields();
  updateEnvironmentalProcessChecklistPreview();
  updateEnvironmentalProcessStagesPreview();
}

function selectedEnvironmentalEnterprise() {
  const selectedName = field("environmental-process-enterprise")?.value;
  return enterprisesForModule("environmental").find((enterprise) => enterprise.name === selectedName) || null;
}

function updateEnvironmentalProcessEnterpriseFields() {
  const enterprise = selectedEnvironmentalEnterprise();
  if (!enterprise) return;
  if (field("environmental-process-company")) field("environmental-process-company").value = enterprise.company;
  if (field("environmental-process-property")) field("environmental-process-property").value = enterprise.property;
}

function updateEnvironmentalProcessLicenseOptions() {
  const wrapper = field("environmental-process-license-fields");
  if (!wrapper) return;
  const format = field("environmental-process-format")?.value || "monofasico";
  const linkedLicenses = licenseTypesForFormat(format);
  const count = licenseSelectionCountForFormat(format);
  const options = linkedLicenses.length
    ? linkedLicenses.map((type) => `<option value="${type.name}">${type.name}</option>`).join("")
    : `<option value="">Nenhum tipo de licença vinculado</option>`;
  wrapper.innerHTML = Array.from({ length: count })
    .map(
      (_, index) => `
        <label>${licensePhaseLabel(format, index)}
          <select class="environmental-process-license-select" ${linkedLicenses.length ? "" : "disabled"}>
            ${options}
          </select>
        </label>
      `,
    )
    .join("");
  updateEnvironmentalProcessChecklistPreview();
}

function updateEnvironmentalProcessChecklistPreview() {
  const selectedLicenses = selectedEnvironmentalProcessLicenses();
  const docs = environmentalDocuments.filter((documentItem) => selectedLicenses.some((license) => documentItem.licenses.includes(license)));
  const preview = field("environmental-process-checklist-preview");
  if (preview) {
    preview.textContent = docs.length
      ? `${docs.length} documento(s) previstos para ${selectedLicenses.join(", ")}`
      : "Nenhum documento vinculado ao tipo selecionado";
  }
}

function openEnvironmentalProcessModal() {
  populateEnvironmentalProcessSelects();
  field("environmental-process-format").value = "monofasico";
  updateEnvironmentalProcessLicenseOptions();
  field("environmental-process-status").value = "open";
  field("environmental-process-priority").value = "Normal";
  field("environmental-process-forecast").value = "";
  field("environmental-process-alert-time").value = "09:00";
  field("environmental-process-objective").value = "";
  field("environmental-process-notes").value = "";
  updateEnvironmentalProcessStagesPreview();
  openModal("environmental-process-modal");
}

async function saveEnvironmentalProcess() {
  const internalNumber = field("environmental-process-number").value || nextEnvironmentalProcessNumber();
  const status = field("environmental-process-status").value;
  const licensingFormat = field("environmental-process-format").value;
  const formatConfig = licensingFormatStages[licensingFormat] || licensingFormatStages.monofasico;
  const selectedLicenses = selectedEnvironmentalProcessLicenses();
  const type = selectedLicenses.join(" / ") || "Tipo de licença não definido";
  const company = field("environmental-process-company").value;
  const branch = field("environmental-process-branch").value;
  const enterprise = selectedEnvironmentalEnterprise();
  const responsible = field("environmental-process-responsible").value;
  const objective = field("environmental-process-objective").value;
  const priority = field("environmental-process-priority").value;
  const acquisitionDueDate = field("environmental-process-forecast").value;
  const acquisitionAlertTime = field("environmental-process-alert-time")?.value || "09:00";
  if (acquisitionDueDate && !validateFutureSchedule(acquisitionDueDate, acquisitionAlertTime, "O vencimento do processo")) return;
  const processId = createUuid();
  const process = {
    id: processId,
    internalNumber,
    licensingFormat,
    licensingFormatLabel: formatConfig.label,
    stages: processStagesForFormat(licensingFormat),
    number: internalNumber,
    title: enterprise?.name || branch || company,
    enterpriseId: enterprise?.id || "",
    enterprise: enterprise?.name || "",
    company,
    branch,
    type,
    licenseTypes: selectedLicenses,
    agency: "Não especificado",
    status,
    statusLabel: processStatusLabel(status),
    risk: priority === "Critica" ? "Risco crítico" : priority === "Alta" ? "Prioridade alta" : "Aberto",
    due: acquisitionDueDate ? `Aquisição prevista até ${formatAgendaDate(acquisitionDueDate)}` : "Sem vencimento de aquisição definido",
    acquisitionDueDate,
    acquisitionAlertTime,
    responsible,
    progress: 0,
    documents: objective || "Preparacao inicial",
    property: field("environmental-process-property").value,
    notes: field("environmental-process-notes").value,
    stageDocuments: {},
  };
  const saved = await persistEnvironmentalProcess(process, false);
  if (!saved) {
    renderLicenseStatus(currentLicenseStatus);
    return;
  }
  if (!environmentalProcesses.some((item) => sameId(item.id, process.id))) {
    environmentalProcesses.push(process);
  }
  if (acquisitionDueDate) {
    scheduleEnvironmentalAlert({
      processId: process.id,
      processNumber: internalNumber,
      stageName: "Conclusão do processo ambiental",
      stageKindLabel: "Processo Ambiental",
      companyName: process.company || "não informada",
      enterpriseName: process.title || process.enterprise || "não informado",
      licenseNumber: alertLicenseValue(process),
      protocolNumber: alertProtocolValue(process),
      alertTypeLabel: "Prazo",
      relatedId: process.id,
      relatedType: "environmental_process",
      relatedLabel: `${internalNumber} - ${process.title}`,
      alertType: "process_deadline",
      alertLabel: "Vencimento para aquisição da licença",
      alertKey: environmentalProcessAlertKey(process),
      date: acquisitionDueDate,
      time: acquisitionAlertTime,
      status: "danger",
      title: `Vencimento para aquisição - ${internalNumber}`,
      subject: alertSubjectByType("deadline", "Vencimento"),
      message: `O processo ${internalNumber} deve ser finalizado por inteiro até ${formatAgendaDate(acquisitionDueDate)}. Se a última etapa não estiver concluída, o processo será classificado como pendente.`,
    });
  }
  closeModal("environmental-process-modal");
  updateNextProcessNumber();
  openLicenseStatus(status);
  openEnvironmentalProcessChecklistSetup(process.id);
}

function selectedChecklistModel() {
  const modelSelect = field("environmental-process-checklist-model");
  if (!modelSelect) return null;
  const selectedId = modelSelect.value;
  const model = checklistModelsAdmin.find((item) => String(item.id) === selectedId);
  if (model) return model;
  const licenseName = modelSelect.selectedOptions?.[0]?.dataset.license || "";
  return fallbackChecklistModel(licenseName);
}

function renderEnvironmentalProcessChecklistDocuments(model) {
  const wrapper = field("environmental-process-checklist-documents");
  if (!wrapper) return;
  const documents = model?.documents || [];
  wrapper.innerHTML = `<span>Documentos incluidos no check-list</span>${
    documents.length
      ? documents
          .map(
            (documentName) => `
              <label>
                <input type="checkbox" name="process-checklist-document" value="${documentName}" checked />
                ${documentName}
              </label>
            `,
          )
          .join("")
      : "<small>Nenhum documento encontrado para este modelo.</small>"
  }`;
}

function openEnvironmentalProcessChecklistSetup(processId, stageNumber = null) {
  const process = environmentalProcesses.find((item) => String(item.id) === String(processId));
  if (!process) return;
  const targetStageNumber = stageNumber || firstDocumentStageNumber(process);
  const targetStage = ensureProcessStages(process).find((stage) => stage.number === targetStageNumber);
  const stageLicense = licenseForDocumentStage(process, targetStageNumber);
  const models = checklistModelsForLicense(stageLicense);
  const modelSelect = field("environmental-process-checklist-model");
  field("environmental-process-checklist-process-id").value = process.id;
  field("environmental-process-checklist-stage-number").value = targetStageNumber;
  field("environmental-process-checklist-title").textContent = `${process.internalNumber} - Etapa ${targetStageNumber}`;
  field("environmental-process-checklist-subtitle").textContent = `${targetStage?.name || "Juntada de documentos"} - modelo para ${stageLicense}`;
  if (modelSelect) {
    const options = models.length ? models : [fallbackChecklistModel(stageLicense)];
    modelSelect.innerHTML = options
      .map((model) => `<option value="${model.id}" data-license="${model.license}">${model.name}</option>`)
      .join("");
    renderEnvironmentalProcessChecklistDocuments(options[0]);
  }
  openModal("environmental-process-checklist-modal");
}

function confirmEnvironmentalProcessChecklist() {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-process-checklist-process-id").value));
  if (!process) return;
  const model = selectedChecklistModel();
  const selectedDocuments = checkedValues('input[name="process-checklist-document"]');
  const stageNumber = Number(field("environmental-process-checklist-stage-number").value) || firstDocumentStageNumber(process);
  process.stageDocuments = process.stageDocuments || {};
  process.stageDocuments[stageNumber] = selectedDocuments.map((name) => ({
    name,
    prepared: false,
    notes: "",
  }));
  process.documents = selectedDocuments.length ? `${selectedDocuments.length} documento(s) incluidos` : "Nenhum documento incluido";
  process.checklistModel = model?.name || "Sem modelo";
  closeModal("environmental-process-checklist-modal");
  renderLicenseStatus(currentLicenseStatus);
  openEnvironmentalProcessDetail(process.id);
  openEnvironmentalStage(process.id, stageNumber);
}

function renderEnvironmentalProcessDocuments(process) {
  const summary = field("environmental-process-documents-summary");
  const list = field("environmental-process-document-list");
  if (!summary || !list) return;
  const stageNumber = activeStageNumber || currentProcessStage(process)?.number;
  const documents = process.stageDocuments?.[stageNumber] || [];
  const prepared = documents.filter((documentItem) => documentItem.prepared).length;
  summary.textContent = documents.length ? `${prepared} de ${documents.length} elaborado(s)` : "Nenhum documento configurado";
  list.innerHTML = documents.length
    ? documents
        .map(
          (documentItem, index) => `
            <article class="process-document-row">
              <div>
                <strong>${documentItem.name}</strong>
                <small>${documentItem.notes ? documentItem.notes : "Sem observações"}</small>
              </div>
              <label>
                <input type="checkbox" data-process-document-prepared="${index}" ${documentItem.prepared ? "checked" : ""} />
                Elaborado
              </label>
              <button type="button" data-process-document-note="${index}">Observações</button>
            </article>
          `,
        )
        .join("")
    : `<article class="process-document-row"><strong>Nenhum documento</strong><span>Configure o check-list da etapa para acompanhar os documentos.</span><button type="button" data-configure-stage-checklist>Configurar check-list</button></article>`;
}

function renderCurrentStageScreen(process, stage) {
  activeStageProcessId = process.id;
  activeStageNumber = stage.number;
  field("environmental-stage-process-id").value = process.id;
  field("environmental-stage-number").value = stage.number;
  field("environmental-stage-modal-title").textContent = `${process.internalNumber || process.number} - Etapa ${stage.number}`;
  field("environmental-stage-modal-subtitle").textContent = `${stage.name} - ${process.title}`;
  const documentsPanel = field("environmental-process-documents-panel");
  const genericStage = field("environmental-process-generic-stage");
  const protocolFields = field("environmental-protocol-fields");
  const licenseFields = field("environmental-license-fields");
  const gate = field("environmental-process-stage-gate");
  const gateMessage = field("environmental-process-stage-gate-message");
  const completeButton = field("environmental-process-complete-stage");
  field("environmental-process-current-stage-code").textContent = `Etapa ${stage.number}`;
  field("environmental-process-current-stage-title").textContent = stage.name;
  field("environmental-process-current-stage-description").textContent = stage.description;
  field("environmental-stage-validity-date").value = stage.validityDate || "";
  field("environmental-stage-deadline-time").value = stage.deadlineTime || "09:00";
  field("environmental-stage-warning-days").value = stage.warningDays ?? 60;
  field("environmental-stage-warning-time").value = stage.warningTime || "09:00";
  field("environmental-stage-critical-days").value = stage.criticalDays ?? 15;
  field("environmental-stage-critical-time").value = stage.criticalTime || "09:00";
  field("environmental-stage-emergency-days").value = stage.emergencyDays ?? 3;
  field("environmental-stage-emergency-time").value = stage.emergencyTime || "09:00";
  field("environmental-stage-renewal-days").value = stage.renewalDays ?? 120;
  field("environmental-stage-renewal-time").value = stage.renewalTime || "09:00";
  syncAllStageAlertDates();
  updateStageDeadlineToggle(stage);
  openStageDeadlinePanel(stageDeadlineConfigured(stage));
  const gateText = stageRequiredMessage(process, stage);
  if (gate) gate.hidden = !gateText;
  if (gateMessage) gateMessage.textContent = gateText || "Etapa liberada para avançar.";
  if (completeButton) {
    completeButton.disabled = Boolean(gateText);
    completeButton.textContent = gateText ? "Etapa bloqueada" : "Concluir etapa";
  }
  const previousButton = field("environmental-process-previous-stage");
  if (previousButton) previousButton.disabled = stage.number <= 1;
  const documentStage = isDocumentStage(stage);
  const licenseStage = isLicenseStage(stage);
  if (documentsPanel) documentsPanel.hidden = !documentStage;
  if (genericStage) genericStage.hidden = documentStage;
  if (protocolFields) protocolFields.hidden = true;
  if (licenseFields) licenseFields.hidden = true;
  if (field("environmental-stage-renewal-days-field")) field("environmental-stage-renewal-days-field").hidden = !licenseStage;
  if (field("environmental-stage-renewal-date-field")) field("environmental-stage-renewal-date-field").hidden = !licenseStage;
  if (field("environmental-stage-renewal-time-field")) field("environmental-stage-renewal-time-field").hidden = !licenseStage;
  if (documentStage) {
    renderEnvironmentalProcessDocuments(process);
  } else {
    const protocolStage = isProtocolStage(stage);
    const record = stageRecord(process, stage.number);
    field("environmental-process-generic-label").textContent = protocolStage ? "Protocolo ambiental" : "Licença ambiental";
    field("environmental-process-generic-title").textContent = stage.name;
    field("environmental-process-generic-help").textContent = protocolStage
      ? "Registre o protocolo, data e comprovantes destá fase antes de concluir a etapa."
      : "Registre número da licença, emissão, validade e condicionantes antes de concluir a etapa.";
    if (protocolStage && protocolFields) {
      protocolFields.hidden = false;
      field("environmental-stage-protocol-number").value = record.protocolNumber || "";
      field("environmental-stage-protocol-date").value = record.protocolDate || "";
    }
    if (licenseStage && licenseFields) {
      licenseFields.hidden = false;
      field("environmental-stage-license-process-number").value = process.internalNumber || process.number || "";
      field("environmental-stage-license-protocol").value = record.protocolNumber || protocolForLicenseStage(process, stage.number);
      field("environmental-stage-license-type").value = licenseForLicenseStage(process, stage.number);
      field("environmental-stage-license-number").value = record.licenseNumber || "";
      field("environmental-stage-license-expiry").value = record.expiryDate || "";
    }
  }
}

function refreshActiveStageGate() {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id")?.value));
  if (!process) return;
  const stage = ensureProcessStages(process).find((item) => item.number === Number(field("environmental-stage-number")?.value));
  if (!stage) return;
  saveCurrentStageForm(process, stage, { validate: false });
  const gateText = stageRequiredMessage(process, stage);
  const gate = field("environmental-process-stage-gate");
  const gateMessage = field("environmental-process-stage-gate-message");
  const completeButton = field("environmental-process-complete-stage");
  if (gate) gate.hidden = !gateText;
  if (gateMessage) gateMessage.textContent = gateText || "Etapa liberada para avançar.";
  if (completeButton) {
    completeButton.disabled = Boolean(gateText);
    completeButton.textContent = gateText ? "Etapa bloqueada" : "Concluir etapa";
  }
}

function saveCurrentStageForm(process, stage, options = {}) {
  const shouldValidate = options.validate !== false;
  const record = stageRecord(process, stage.number);
  stage.validityDate = field("environmental-stage-validity-date")?.value || "";
  if (!isLicenseStage(stage) && dateIsAfter(stage.validityDate, process.acquisitionDueDate)) {
    alert("A data de vencimento da etapa não pode ser superior à data final do processo.");
    stage.validityDate = process.acquisitionDueDate || "";
    if (field("environmental-stage-validity-date")) field("environmental-stage-validity-date").value = stage.validityDate;
    syncAllStageAlertDates();
  }
  stage.deadlineTime = field("environmental-stage-deadline-time")?.value || "09:00";
  stage.warningDays = Number(field("environmental-stage-warning-days")?.value || 60);
  stage.warningTime = field("environmental-stage-warning-time")?.value || "09:00";
  stage.criticalDays = Number(field("environmental-stage-critical-days")?.value || 15);
  stage.criticalTime = field("environmental-stage-critical-time")?.value || "09:00";
  stage.emergencyDays = Number(field("environmental-stage-emergency-days")?.value || 3);
  stage.emergencyTime = field("environmental-stage-emergency-time")?.value || "09:00";
  stage.renewalDays = Number(field("environmental-stage-renewal-days")?.value || 120);
  stage.renewalTime = field("environmental-stage-renewal-time")?.value || "09:00";
  updateStageDeadlineStatus(stage);
  applyProcessDeadlineRules(process);
  if (isProtocolStage(stage)) {
    record.protocolNumber = field("environmental-stage-protocol-number")?.value || "";
    record.protocolDate = field("environmental-stage-protocol-date")?.value || "";
  }
  if (isLicenseStage(stage)) {
    record.licenseType = licenseForLicenseStage(process, stage.number);
    record.protocolNumber = field("environmental-stage-license-protocol")?.value || protocolForLicenseStage(process, stage.number);
    record.processNumber = process.internalNumber || process.number || "";
    record.licenseNumber = field("environmental-stage-license-number")?.value || "";
    record.expiryDate = field("environmental-stage-license-expiry")?.value || "";
  }
  if (shouldValidate && !validateStageAlertSchedules(process, stage)) return false;
  if (shouldValidate && stage.validityDate) scheduleStageAlerts(process, stage);
  return true;
}

function registerStageData(process, stage) {
  const record = stageRecord(process, stage.number);
  if (isProtocolStage(stage) && record.protocolDate) {
    addAgendaEvent({
      date: record.protocolDate,
      time: "09:00",
      title: `Protocolo ${record.protocolNumber} - ${process.internalNumber}`,
      type: "Protocolo ambiental",
      status: "green",
      description: `${process.title} - ${process.type}`,
    });
  }
  if (isLicenseStage(stage) && record.licenseNumber && record.expiryDate) {
    const license = {
      id: `${process.id}-${stage.number}-${record.licenseNumber}`,
      processId: process.id,
      enterpriseId: process.enterpriseId || enterpriseIdByName(process.enterprise || process.title),
      processNumber: process.internalNumber,
      stageNumber: stage.number,
      type: record.licenseType || licenseForLicenseStage(process, stage.number),
      number: record.licenseNumber,
      protocol: record.protocolNumber || protocolForLicenseStage(process, stage.number),
      expiryDate: record.expiryDate,
      company: process.company,
      title: process.title,
      responsible: process.responsible,
      status: "Ativa",
    };
    process.activeLicense = license;
    process.licenseHistory = process.licenseHistory || [];
    const existingIndex = process.licenseHistory.findIndex((item) => item.stageNumber === stage.number);
    if (existingIndex >= 0) process.licenseHistory[existingIndex] = license;
    else process.licenseHistory.push(license);
    process.number = license.number;
    process.due = `Vence em ${formatAgendaDate(license.expiryDate)}`;
    scheduleLicenseAlerts(process, stage, license);
    if (!isLastProcessStage(process, stage.number)) {
      process.acquisitionDueDate = license.expiryDate;
      process.acquisitionAlertTime = stage.deadlineTime || "09:00";
      scheduleEnvironmentalAlert({
        processId: process.id,
        processNumber: process.internalNumber || process.number,
        stageName: "Aquisição da próxima licença ambiental",
        stageKindLabel: "Licença",
        companyName: process.company || "não informada",
        enterpriseName: process.title || process.enterprise || "não informado",
        licenseNumber: license.number,
        protocolNumber: license.protocol || alertProtocolValue(process, stage),
        alertTypeLabel: "Prazo",
        relatedId: process.id,
        relatedType: "environmental_process",
        relatedLabel: `${process.internalNumber || process.number} - Próxima licença`,
        alertType: "next_license_deadline",
        alertLabel: "Vencimento para aquisição da licença posterior",
        date: license.expiryDate,
        time: process.acquisitionAlertTime,
        status: "danger",
        title: `Aquisição da próxima licença - ${process.internalNumber || process.number}`,
        subject: alertSubjectByType("deadline", "Vencimento"),
        message: `A licença ${license.number} vence em ${formatAgendaDate(license.expiryDate)} e essa passa a ser a data limite para aquisição da licença posterior do processo ${process.internalNumber || process.number}.`,
      });
    }
  }
}

function renderProcessDetail(process) {
  ensureProcessStages(process);
  updateProcessProgress(process);
  const currentStage = currentProcessStage(process);
  field("environmental-process-detail-id").value = process.id;
  field("environmental-process-detail-title").textContent = `${process.internalNumber || process.number} - ${process.title}`;
  field("environmental-process-detail-subtitle").textContent = process.type;
  field("environmental-process-detail-format").textContent = process.licensingFormatLabel || "Formato não definido";
  field("environmental-process-detail-current-stage").textContent = currentStage?.name || "Concluído";
  field("environmental-process-detail-progress").textContent = `${process.progress || 0}%`;
  field("environmental-process-detail-status").value = process.status;
  field("environmental-process-detail-company").textContent = `Empresa: ${process.company}`;
  field("environmental-process-detail-property").textContent = `Imóvel: ${process.property || "Não informado"}`;
  field("environmental-process-detail-responsible").textContent = `Responsável: ${process.responsible}`;
  field("environmental-process-detail-stage-summary").textContent = `${process.licensingFormatLabel || "Processo"} - ${process.stages.length} etapas`;
  field("environmental-process-detail-stage-list").innerHTML = process.stages
    .map(
      (stage) => `
        <article class="process-stage-detail-item ${processStageClass(stage)}">
          <span class="process-stage-number">${stage.number}</span>
          <div class="process-stage-detail-copy">
            <span class="process-stage-status">Etapa ${stage.number}</span>
            <strong>${stage.name}</strong>
            <small>${stage.description}</small>
            <small>${stageDeadlineLabel(stage)}</small>
            <span class="pill ${stageStatusPill(stage)}">${stage.status}</span>
          </div>
          <div class="process-stage-detail-actions">
            <button type="button" class="ghost small" data-process-stage-action="open" data-stage-number="${stage.number}">Continuar etapa</button>
          </div>
        </article>
      `,
    )
    .join("");
  hideStageAccessMessage();
}

function openEnvironmentalProcessDetail(processId) {
  const process = environmentalProcesses.find((item) => String(item.id) === String(processId));
  if (!process) return;
  renderProcessDetail(process);
  openModal("environmental-process-detail-modal");
}

function openEnvironmentalStage(processId, stageNumber) {
  const process = environmentalProcesses.find((item) => String(item.id) === String(processId));
  if (!process) return;
  const stage = ensureProcessStages(process).find((item) => item.number === stageNumber);
  if (!stage) return;
  if (!canOpenProcessStage(process, stageNumber)) {
    showStageAccessMessage(stageNumber);
    return;
  }
  hideStageAccessMessage();
  if (stage.status === "Não iniciada") {
    stage.status = "Em andamento";
  }
  renderProcessDetail(process);
  renderCurrentStageScreen(process, stage);
  openModal("environmental-stage-modal");
}

async function saveEnvironmentalProcessDetail() {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-process-detail-id").value));
  if (!process) return;
  process.status = field("environmental-process-detail-status").value;
  process.statusLabel = processStatusLabel(process.status);
  if (process.status === "done") {
    const currentStage = currentProcessStage(process);
    const gateText = stageGateMessage(process, currentStage);
    if (gateText) {
      process.status = "open";
      process.statusLabel = processStatusLabel("open");
      renderCurrentStageScreen(process, currentStage);
      return;
    }
    ensureProcessStages(process).forEach((stage) => {
      stage.status = "Concluída";
    });
  }
  if (process.status === "pending") {
    process.risk = "Pendente";
    process.due = "Aguardando regularização da etapa atual";
  }
  if (process.status === "expired") {
    process.risk = "Vencida";
    process.due = "Prazo vencido";
  }
  if (process.status === "open" && process.progress < 100) {
    process.risk = process.risk === "Processo concluído" ? "Aberto" : process.risk;
  }
  updateProcessProgress(process);
  await persistEnvironmentalProcess(process, true);
  closeModal("environmental-process-detail-modal");
  openLicenseStatus(currentLicenseStatus === "general" ? process.status : currentLicenseStatus);
}

function renderEnvironmentalLicenseCard(license) {
  return `
    <article class="status-process-card">
      <div>
        <strong>${license.number}</strong>
        <span>${license.title}</span>
        <small>Processo interno ${license.processNumber}</small>
      </div>
      <div>
        <strong>${license.type}</strong>
        <span>${license.company}</span>
        <small>Substitui a licença anterior do mesmo processo</small>
        <small>Responsável: ${license.responsible}</small>
      </div>
      <div>
        <span>Vencimento</span>
        <strong>${formatAgendaDate(license.expiryDate)}</strong>
        <small>Status: ${license.status}</small>
      </div>
      <div>
        <span class="pill green">${license.status}</span>
        <button type="button" class="ghost small" data-license-pdf="${license.processId}" data-stage-number="${license.stageNumber}">Baixar dossie PDF</button>
        <button type="button" class="ghost small" data-license-action="renew" data-process-id="${license.processId}" data-stage-number="${license.stageNumber}">Renovação</button>
        <button type="button" class="ghost small" data-license-action="expand" data-process-id="${license.processId}">Ampliação</button>
        <button type="button" class="ghost small danger-action" data-delete-license="${license.processId}" data-stage-number="${license.stageNumber}">Excluir</button>
      </div>
    </article>
  `;
}

function renderEnvironmentalProcessCard(process) {
  const currentStage = currentProcessStage(process);
  return `
    <article class="status-process-card">
      <div>
        <strong>${process.internalNumber || process.number}</strong>
        <span>${process.title}</span>
        <small>${process.number && process.number !== process.internalNumber ? process.number : "Sem número oficial"}</small>
      </div>
      <div>
        <strong>${process.type}</strong>
        <span>${process.company}</span>
        <small>${process.licensingFormatLabel || "Formato não definido"} - etapa atual: ${currentStage?.name || "Acompanhamento"}</small>
        <small>Responsável: ${process.responsible}</small>
      </div>
      <div>
        <span>${process.documents}</span>
        <progress value="${process.progress}" max="100"></progress>
        <small>${process.progress}% concluído</small>
      </div>
      <div>
        <span class="pill ${processPillClass(process)}">${process.risk}</span>
        <small>${process.due}</small>
        <button type="button" class="ghost small" data-process-pdf="${process.id}">Baixar dossie PDF</button>
        <button type="button" class="ghost small" data-open-process="${process.id}">Abrir processo</button>
        <button type="button" class="ghost small danger-action" data-delete-process="${process.id}">Excluir</button>
      </div>
    </article>
  `;
}

function renderEnvironmentalReportSection(titleText, subtitleText, items, renderer, emptyText) {
  return `
    <section class="environmental-report-section">
      <div class="environmental-report-head">
        <div>
          <strong>${titleText}</strong>
          <small>${subtitleText}</small>
        </div>
        <span class="pill green">${items.length} ${items.length === 1 ? "item" : "itens"}</span>
      </div>
      <div class="environmental-report-list">
        ${items.length ? items.map(renderer).join("") : `<article class="status-process-card"><strong>Nenhum registro</strong><span>${emptyText}</span></article>`}
      </div>
    </section>
  `;
}

function renderLicenseStatus(status = "open") {
  const list = document.querySelector("#license-status-list");
  const titleTarget = document.querySelector("#license-status-title");
  const subtitleTarget = document.querySelector("#license-status-subtitle");
  const countTarget = document.querySelector("#license-status-count");
  const newProcessButton = field("environmental-process-new");
  if (!list) return;
  currentLicenseStatus = status;
  const meta = licenseStatusMeta[status] || licenseStatusMeta.open;
  environmentalProcesses.forEach((process) => {
    ensureProcessStages(process);
    updateProcessProgress(process);
  });
  const reportGroups = {
    open: sortedProcesses(environmentalProcesses.filter((process) => process.status === "open")),
    pending: sortedProcesses(environmentalProcesses.filter((process) => process.status === "pending")),
    expired: sortedProcesses(environmentalProcesses.filter((process) => process.status === "expired")),
    licenses: activeLicenses(),
  };
  const items =
    status === "licenses"
      ? activeLicenses()
      : sortedProcesses(status === "general" ? environmentalProcesses : environmentalProcesses.filter((process) => process.status === status));
  if (titleTarget) titleTarget.textContent = meta.title;
  if (subtitleTarget) subtitleTarget.textContent = status === "general" ? "Relatório geral com processos abertos, pendentes, vencidos e licenças ativas." : meta.subtitle;
  if (newProcessButton) newProcessButton.hidden = status !== "general";
  document.querySelectorAll('[data-pdf-report="environmentalModule"]').forEach((button) => {
    button.textContent = status === "general" ? "Baixar relatório geral" : "Baixar relatório";
  });
  if (countTarget) {
    const generalCount = reportGroups.open.length + reportGroups.pending.length + reportGroups.expired.length + reportGroups.licenses.length;
    countTarget.textContent =
      status === "general"
        ? `${generalCount} registro${generalCount === 1 ? "" : "s"}`
        : status === "licenses"
          ? `${items.length} licença${items.length === 1 ? "" : "s"}`
          : `${items.length} processo${items.length === 1 ? "" : "s"}`;
    countTarget.className = `pill ${meta.pill}`;
  }
  if (status === "general") {
    list.innerHTML = `
      ${renderEnvironmentalReportSection("03.1.1 Abertas", "Processos ambientais em andamento, sem licença final gerada.", reportGroups.open, renderEnvironmentalProcessCard, "Não há processos abertos.")}
      ${renderEnvironmentalReportSection("03.1.2 Pendentes", "Processos com exigências, documentos ou retorno pendente.", reportGroups.pending, renderEnvironmentalProcessCard, "Não há processos pendentes.")}
      ${renderEnvironmentalReportSection("03.1.3 Vencidas", "Processos com prazo crítico ultrapassado ou licença vencida.", reportGroups.expired, renderEnvironmentalProcessCard, "Não há processos vencidos.")}
      ${renderEnvironmentalReportSection("03.1.5 Licenças", "Licenças ambientais geradas pelos processos finalizados ou por etapas concluídas.", reportGroups.licenses, renderEnvironmentalLicenseCard, "Não há licenças cadastradas.")}
    `;
    return;
  }
  list.innerHTML = items.length
    ? items
        .map((item) => (status === "licenses" ? renderEnvironmentalLicenseCard(item) : renderEnvironmentalProcessCard(item)))
        .join("")
    : `<article class="status-process-card"><strong>Nenhum registro</strong><span>Não há ${status === "licenses" ? "licenças" : "processos"} nesta categoria.</span></article>`;
}

async function deleteEnvironmentalProcessFromDatabase(process) {
  if (!window.DocGestorDB || !looksLikeUuid(process?.id)) return true;
  const id = encodeURIComponent(process.id);
  const alertKeyTokens = [process.id, process.internalNumber, process.number].filter(Boolean);
  try {
    await Promise.all([
      window.DocGestorDB.removeWhere("alert_queue", `related_id=eq.${id}`),
      window.DocGestorDB.removeWhere("alert_history", `related_id=eq.${id}&status=neq.sent`),
      window.DocGestorDB.removeWhere("agenda_events", `related_id=eq.${id}`),
      window.DocGestorDB.removeWhere("environmental_process_stage_deadlines", `process_id=eq.${id}`),
    ]);
    for (const token of alertKeyTokens) {
      const likeToken = encodeURIComponent(`*${token}*`);
      await Promise.all([
        window.DocGestorDB.removeWhere("alert_queue", `alert_key=like.${likeToken}`),
        window.DocGestorDB.removeWhere("alert_history", `alert_key=like.${likeToken}&status=neq.sent`),
        window.DocGestorDB.removeWhere("agenda_events", `alert_key=like.${likeToken}`),
      ]);
    }
    await window.DocGestorDB.remove("environmental_licenses", process.id);
    return true;
  } catch (error) {
    alert(`Não foi possível excluir o processo no banco de dados: ${error.message}`);
    return false;
  }
}

function openLicenseStatus(status = "open") {
  if (!canAccess("environmental")) return;
  openView("licencas");
  if (currentUser) sessionStorage.setItem(SESSION_LICENSE_STATUS_KEY, status);
  if (moduleSubnav) {
    moduleSubnav.classList.add("open");
    document.querySelector("[data-module-menu-toggle]")?.setAttribute("aria-expanded", "true");
  }
  document.querySelectorAll("[data-module-license-status]").forEach((item) => {
    item.classList.toggle("active", item.dataset.moduleLicenseStatus === status);
  });
  document.querySelectorAll('#module-subnav [data-view-target="licencas"]').forEach((item) => {
    item.classList.toggle("active", status === "general");
    item.classList.toggle("parent-active", status !== "general");
  });
  renderLicenseStatus(status);
}

document.querySelector("#license-status-list")?.addEventListener("click", async (event) => {
  const deleteProcess = event.target.closest("[data-delete-process]");
  if (deleteProcess) {
    const process = environmentalProcesses.find((item) => String(item.id) === String(deleteProcess.dataset.deleteProcess));
    if (!process) return;
    const confirmed = window.confirm(`Deseja realmente excluir o processo ${process.internalNumber || process.number}?`);
    if (!confirmed) return;
    const deleted = await deleteEnvironmentalProcessFromDatabase(process);
    if (!deleted) return;
    const index = environmentalProcesses.findIndex((item) => String(item.id) === String(process.id));
    if (index >= 0) environmentalProcesses.splice(index, 1);
    const tokens = [process.id, process.internalNumber, process.number].filter(Boolean).map(String);
    agendaEvents = agendaEvents.filter((item) => {
      const related = String(item.relatedId || item.linkedTarget?.id || "");
      const key = String(item.alertKey || "");
      return related !== String(process.id) && !tokens.some((token) => key.includes(token));
    });
    alertHistoryItems = alertHistoryItems.filter((item) => {
      const related = String(item.related_id || item.relatedId || "");
      const key = String(item.alert_key || "");
      const sent = String(item.status || item.last_event || "").toLowerCase() === "sent";
      if (sent && alertHistoryWithinRetention(item)) return true;
      return related !== String(process.id) && !tokens.some((token) => key.includes(token));
    });
    renderLicenseStatus(currentLicenseStatus);
    renderAgenda();
    renderAlertHistory(alertHistoryItems);
    updateNextProcessNumber();
    return;
  }

  const deleteLicense = event.target.closest("[data-delete-license]");
  if (deleteLicense) {
    const license = findActiveLicense(deleteLicense.dataset.deleteLicense, deleteLicense.dataset.stageNumber);
    if (!license) return;
    const confirmed = window.confirm(`Deseja realmente excluir a licença ${license.number}?`);
    if (!confirmed) return;
    const process = environmentalProcesses.find((item) => String(item.id) === String(license.processId));
    if (process) {
      if (String(process.activeLicense?.stageNumber) === String(license.stageNumber)) {
        delete process.activeLicense;
      }
      process.licenseHistory = (process.licenseHistory || []).filter((item) => String(item.stageNumber) !== String(license.stageNumber));
      process.number = process.internalNumber || process.number;
      process.due = process.status === "done" ? "Sem pendências" : "Licença removida do cadastro";
      await persistEnvironmentalProcess(process, true);
    }
    renderLicenseStatus(currentLicenseStatus);
    return;
  }

  const processPdf = event.target.closest("[data-process-pdf]");
  if (processPdf) {
    const process = environmentalProcesses.find((item) => String(item.id) === String(processPdf.dataset.processPdf));
    if (process) openPdfReport(buildEnvironmentalProcessDossiêr(process));
    return;
  }

  const licensePdf = event.target.closest("[data-license-pdf]");
  if (licensePdf) {
    const license = findActiveLicense(licensePdf.dataset.licensePdf, licensePdf.dataset.stageNumber);
    if (license) openPdfReport(buildEnvironmentalLicenseDossiêr(license));
    return;
  }

  const licenseAction = event.target.closest("[data-license-action]");
  if (licenseAction) {
    const process = environmentalProcesses.find((item) => String(item.id) === String(licenseAction.dataset.processId));
    if (!process) return;
    if (licenseAction.dataset.licenseAction === "expand") {
      const confirmed = window.confirm(`Deseja realmente iniciar a ampliação do processo ${process.internalNumber || process.number}? Essa ação irá reabrir o processo desde o começo, mantendo o mesmo número interno, e os dados das etapas deverão ser refeitos.`);
      if (!confirmed) return;
      restartProcessForExpansion(process);
      await persistEnvironmentalProcess(process, true);
      renderLicenseStatus(currentLicenseStatus);
      openEnvironmentalProcessDetail(process.id);
      return;
    }
    if (licenseAction.dataset.licenseAction === "renew") {
      const licenseStageNumber = Number(licenseAction.dataset.stageNumber);
      const licenseStage = ensureProcessStages(process).find((stage) => stage.number === licenseStageNumber);
      const confirmed = window.confirm(`Deseja realmente iniciar a renovação da licença do processo ${process.internalNumber || process.number}? Essa ação irá reabrir o último bloco concluído para refazer as etapas e informar nova data de vencimento.`);
      if (!confirmed) return;
      const documentStage = [...ensureProcessStages(process)].reverse().find((stage) => isDocumentStage(stage) && (stage.blockNumber || 1) === (licenseStage?.blockNumber || 1));
      setProcessCurrentStage(process, documentStage?.number || licenseStageNumber);
      process.status = "open";
      process.statusLabel = processStatusLabel("open");
      process.risk = "Renovação";
      process.due = "Renovação da licença em andamento";
      openEnvironmentalProcessDetail(process.id);
      return;
    }
  }
  const button = event.target.closest("[data-open-process]");
  if (!button) return;
  openEnvironmentalProcessDetail(button.dataset.openProcess);
});

document.querySelector("#environmental-process-detail-stage-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-process-stage-action]");
  if (!button) return;
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-process-detail-id").value));
  if (!process) return;
  const stageNumber = Number(button.dataset.stageNumber);
  openEnvironmentalStage(process.id, stageNumber);
});

field("environmental-process-complete-stage")?.addEventListener("click", async () => {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id").value));
  if (!process) return;
  const stageNumber = Number(field("environmental-stage-number").value) || currentProcessStage(process).number;
  const stage = ensureProcessStages(process).find((item) => item.number === stageNumber) || currentProcessStage(process);
  if (!saveCurrentStageForm(process, stage)) return;
  const gateText = stageRequiredMessage(process, stage);
  if (gateText) {
    renderCurrentStageScreen(process, stage);
    return;
  }
  if (isLicenseStage(stage)) {
    const record = stageRecord(process, stage.number);
    const confirmed = window.confirm(`Deseja gerar uma nova licença ambiental para o processo ${process.internalNumber || process.number}?`);
    if (!confirmed) {
      process.status = "open";
      process.statusLabel = processStatusLabel("open");
      process.risk = "Licença informada, aguardando confirmação";
      process.due = "Confirme a geração da licença para avançar a etapa";
      renderCurrentStageScreen(process, stage);
      return;
    }
    record.generateLicense = true;
  }
  await completeProcessStage(process, stage.number);
  renderProcessDetail(process);
  persistEnvironmentalProcess(process, true);
  closeModal("environmental-stage-modal");
});

field("environmental-process-previous-stage")?.addEventListener("click", () => {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id").value));
  if (!process) return;
  const stageNumber = Number(field("environmental-stage-number").value);
  if (stageNumber <= 1) return;
  const previousStage = ensureProcessStages(process).find((stage) => stage.number === stageNumber - 1);
  if (!previousStage) return;
  previousStage.status = "Em andamento";
  ensureProcessStages(process).forEach((stage) => {
    if (stage.number >= stageNumber) stage.status = "Não iniciada";
  });
  process.status = "open";
  process.statusLabel = processStatusLabel("open");
  updateProcessProgress(process);
  renderProcessDetail(process);
  renderCurrentStageScreen(process, previousStage);
});

field("environmental-stage-save")?.addEventListener("click", () => {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id").value));
  if (process) {
    const stage = ensureProcessStages(process).find((item) => item.number === Number(field("environmental-stage-number").value)) || currentProcessStage(process);
    if (!saveCurrentStageForm(process, stage)) return;
    renderProcessDetail(process);
    persistEnvironmentalProcess(process, true);
  }
  closeModal("environmental-stage-modal");
});

["environmental-stage-protocol-number", "environmental-stage-protocol-date", "environmental-stage-license-protocol", "environmental-stage-license-number", "environmental-stage-license-expiry"].forEach((id) => {
  field(id)?.addEventListener("input", refreshActiveStageGate);
  field(id)?.addEventListener("change", refreshActiveStageGate);
});

field("environmental-stage-deadline-toggle")?.addEventListener("click", () => {
  const panel = field("environmental-stage-deadline-fields");
  openStageDeadlinePanel(panel?.hidden);
});

field("environmental-stage-validity-date")?.addEventListener("change", syncAllStageAlertDates);
field("environmental-stage-validity-date")?.addEventListener("input", syncAllStageAlertDates);
stageAlertFieldKeys.forEach((key) => {
  field(`environmental-stage-${key}-days`)?.addEventListener("input", () => syncStageAlertDateFromDays(key));
  field(`environmental-stage-${key}-date`)?.addEventListener("change", () => syncStageAlertDaysFromDate(key));
});

field("environmental-process-checklist-model")?.addEventListener("change", () => {
  renderEnvironmentalProcessChecklistDocuments(selectedChecklistModel());
});

field("environmental-process-checklist-confirm")?.addEventListener("click", confirmEnvironmentalProcessChecklist);

field("environmental-process-document-list")?.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-process-document-prepared]");
  if (!checkbox) return;
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id").value));
  if (!process) return;
  const documents = process.stageDocuments?.[Number(field("environmental-stage-number").value)] || [];
  const documentItem = documents[Number(checkbox.dataset.processDocumentPrepared)];
  if (!documentItem) return;
  documentItem.prepared = checkbox.checked;
  renderCurrentStageScreen(process, currentProcessStage(process));
});

field("environmental-process-document-list")?.addEventListener("click", (event) => {
  const configureButton = event.target.closest("[data-configure-stage-checklist]");
  if (configureButton) {
    const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id").value));
    if (!process) return;
    openEnvironmentalProcessChecklistSetup(process.id, Number(field("environmental-stage-number").value));
    return;
  }
  const button = event.target.closest("[data-process-document-note]");
  if (!button) return;
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id").value));
  if (!process) return;
  const documents = process.stageDocuments?.[Number(field("environmental-stage-number").value)] || [];
  const documentIndex = Number(button.dataset.processDocumentNote);
  const documentItem = documents[documentIndex];
  if (!documentItem) return;
  field("environmental-document-note-process-id").value = process.id;
  field("environmental-document-note-index").value = documentIndex;
  field("environmental-document-note-title").textContent = documentItem.name;
  field("environmental-document-note-text").value = documentItem.notes || "";
  openModal("environmental-document-note-modal");
});

field("environmental-document-note-save")?.addEventListener("click", () => {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-document-note-process-id").value));
  if (!process) return;
  const documents = process.stageDocuments?.[activeStageNumber || currentProcessStage(process).number] || [];
  const documentItem = documents[Number(field("environmental-document-note-index").value)];
  if (!documentItem) return;
  documentItem.notes = field("environmental-document-note-text").value;
  closeModal("environmental-document-note-modal");
  renderEnvironmentalProcessDocuments(process);
});

document.querySelectorAll("[data-module-license-status]").forEach((button) => {
  button.addEventListener("click", () => {
    openLicenseStatus(button.dataset.moduleLicenseStatus);
  });
});

field("environmental-process-new")?.addEventListener("click", openEnvironmentalProcessModal);
field("home-new-process")?.addEventListener("click", () => {
  openLicenseStatus("general");
  openEnvironmentalProcessModal();
});
field("environmental-process-format")?.addEventListener("change", () => {
  updateEnvironmentalProcessLicenseOptions();
  updateEnvironmentalProcessStagesPreview();
});
field("environmental-process-enterprise")?.addEventListener("change", updateEnvironmentalProcessEnterpriseFields);
field("environmental-process-license-fields")?.addEventListener("change", updateEnvironmentalProcessChecklistPreview);
field("environmental-process-save")?.addEventListener("click", saveEnvironmentalProcess);
field("environmental-process-detail-save")?.addEventListener("click", saveEnvironmentalProcessDetail);
updateNextProcessNumber();
renderLicenseStatus("general");
renderAgenda();

const PDF_STANDARD = {
  page: "A4",
  margin: "14mm",
  portraitLimit: 820,
  portraitContinuationLimit: 1010,
  landscapeLimit: 545,
  landscapeContinuationLimit: 735,
  generatedBy: "Usuário DocGestor by Carminatti",
  organization: "DocGestor",
  exclusive: "DocGestor by Carminatti",
};

function escapePdfText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPdfDate(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function pdfSection(titleText, bodyHtml, estimate = 120, options = {}) {
  return {
    type: "block",
    title: titleText,
    bodyHtml,
    estimate,
    className: options.className || "",
  };
}

function pdfFieldsSection(titleText, fields, options = {}) {
  const body = `
    <div class="pdf-fields">
      ${fields
        .map(
          ([label, value]) => `
            <div>
              <span>${escapePdfText(label)}</span>
              <strong>${escapePdfText(value || "Não informado")}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
  const estimate = options.estimate || 64 + Math.ceil(fields.length / 2) * 34;
  return pdfSection(titleText, body, estimate, { className: "pdf-keep" });
}

function pdfTableSection(titleText, columns, rows, options = {}) {
  return {
    type: "table",
    title: titleText,
    columns,
    rows,
    rowEstimate: options.rowEstimate || 34,
    headerEstimate: options.headerEstimate || 76,
  };
}

function renderPdfTable(section, rows) {
  return `
    <section class="pdf-section pdf-table-section">
      <h2>${escapePdfText(section.title)}</h2>
      <table>
        <thead>
          <tr>${section.columns.map((column) => `<th>${escapePdfText(column)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>${row.map((cell) => `<td>${escapePdfText(cell || "Não informado")}</td>`).join("")}</tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}

function paginatePdfSections(sections, orientation = "portrait") {
  const firstLimit = orientation === "landscape" ? PDF_STANDARD.landscapeLimit : PDF_STANDARD.portraitLimit;
  const continuationLimit = orientation === "landscape" ? PDF_STANDARD.landscapeContinuationLimit : PDF_STANDARD.portraitContinuationLimit;
  const pages = [[]];
  let used = 0;

  function pageLimit() {
    return pages.length === 1 ? firstLimit : continuationLimit;
  }

  function nextPage() {
    pages.push([]);
    used = 0;
  }

  function pushBlock(section) {
    const estimate = Math.min(section.estimate || 120, pageLimit());
    if (used > 0 && used + estimate > pageLimit()) nextPage();
    pages[pages.length - 1].push(section);
    used += estimate;
  }

  sections.forEach((section) => {
    if (section.type !== "table") {
      pushBlock(section);
      return;
    }

    let chunk = [];
    let chunkEstimate = section.headerEstimate;
    section.rows.forEach((row) => {
      const nextEstimate = chunkEstimate + section.rowEstimate;
      if (chunk.length > 0 && used + nextEstimate > pageLimit()) {
        pushBlock({
          type: "html",
          html: renderPdfTable(section, chunk),
          estimate: chunkEstimate,
        });
        chunk = [];
        chunkEstimate = section.headerEstimate;
      }
      chunk.push(row);
      chunkEstimate += section.rowEstimate;
    });

    if (chunk.length) {
      pushBlock({
        type: "html",
        html: renderPdfTable(section, chunk),
        estimate: chunkEstimate,
      });
    }
  });

  return pages;
}

function renderPdfSection(section) {
  if (section.type === "html") return section.html;
  if (section.type === "table") return renderPdfTable(section, section.rows);
  return `
    <section class="pdf-section ${section.className || ""}">
      <h2>${escapePdfText(section.title)}</h2>
      ${section.bodyHtml}
    </section>
  `;
}

function pdfDocumentHtml(report) {
  const orientation = report.orientation || "portrait";
  const generatedAt = formatPdfDate();
  const pageSize = orientation === "landscape" ? "A4 landscape" : "A4 portrait";

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapePdfText(report.title)}</title>
        <style>
          @page { size: ${pageSize}; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #d8dde1;
            color: #172026;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pdf-page {
            background: #fff;
            display: flex;
            flex-direction: column;
            margin: 0 auto;
            min-height: auto;
            overflow: visible;
            padding: ${PDF_STANDARD.margin};
            width: ${orientation === "landscape" ? "297mm" : "210mm"};
          }
          .pdf-header {
            background: #ffffff;
            border-bottom: 1px solid #dfe5ea;
            border-radius: 0;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 14px;
            min-height: 16mm;
            padding: 0 0 5mm;
          }
          .pdf-brand {
            align-items: center;
            display: flex;
            gap: 0;
            min-width: 0;
          }
          .pdf-wordmark {
            align-self: center;
            display: block;
            line-height: 1.05;
            white-space: nowrap;
          }
          .pdf-wordmark strong,
          .pdf-wordmark small {
            display: block;
            white-space: nowrap;
          }
          .pdf-wordmark strong {
            font-size: 18px;
            letter-spacing: 0;
          }
          .pdf-wordmark small {
            font-size: 12px;
            font-weight: 700;
            margin-top: 3px;
          }
          .pdf-wordmark span {
            display: inline;
            font-size: inherit;
            line-height: inherit;
          }
          .pdf-brand span,
          .pdf-meta span,
          .pdf-footer span {
            color: #63717d;
            display: block;
            font-size: 10px;
            line-height: 1.35;
          }
          .pdf-wordmark span {
            display: inline;
            font-size: inherit;
            line-height: inherit;
          }
          .pdf-doc { color: #172026; }
          .pdf-gestor,
          .pdf-carminatti { color: #ed101f; }
          .pdf-by { color: #11824f; }
          .pdf-meta {
            text-align: right;
          }
          .pdf-meta strong {
            color: #172026;
            display: block;
            font-size: 11px;
            margin-bottom: 2px;
          }
          .pdf-meta span {
            color: #63717d;
          }
          .pdf-title {
            margin: 5mm 0 5mm;
          }
          .pdf-title h1 {
            font-size: 20px;
            margin: 0 0 3px;
          }
          .pdf-title p {
            color: #63717d;
            font-size: 11px;
            margin: 0;
          }
          .pdf-body {
            flex: 1;
            overflow: visible;
          }
          .pdf-section {
            border: 1px solid #dfe5ea;
            border-radius: 4px;
            break-inside: avoid;
            break-before: auto;
            break-after: auto;
            margin-bottom: 5mm;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .pdf-section h2 {
            background: #f7f9fa;
            border-bottom: 1px solid #dfe5ea;
            color: #172026;
            font-size: 12px;
            margin: 0;
            padding: 7px 9px;
          }
          .pdf-fields {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pdf-fields div {
            border-bottom: 1px solid #eef2f4;
            min-height: 30px;
            padding: 7px 9px;
          }
          .pdf-fields div:nth-last-child(-n + 2) {
            border-bottom: 0;
          }
          .pdf-fields span {
            color: #63717d;
            display: block;
            font-size: 9px;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .pdf-fields strong {
            display: block;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.35;
          }
          table {
            border-collapse: collapse;
            font-size: 10px;
            page-break-inside: auto;
            width: 100%;
          }
          thead {
            display: table-header-group;
          }
          tbody {
            break-inside: auto;
            page-break-inside: auto;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          th,
          td {
            border-bottom: 1px solid #eef2f4;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f7f9fa;
            color: #63717d;
            font-size: 9px;
            text-transform: uppercase;
          }
          .pdf-note {
            color: #63717d;
            font-size: 10px;
            line-height: 1.5;
            padding: 8px 9px;
          }
          .pdf-footer {
            border-top: 1px solid #dfe5ea;
            display: grid;
            grid-template-columns: 1fr;
            padding-top: 4mm;
          }
          @media print {
            body { background: #fff; }
            .pdf-page {
              margin: 0;
              padding: ${PDF_STANDARD.margin};
              width: auto;
            }
            .pdf-section {
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="pdf-page pdf-page-first">
          <header class="pdf-header">
            <div class="pdf-brand">
              <span class="pdf-wordmark">
                <strong><span class="pdf-doc">Doc</span><span class="pdf-gestor">Gestor</span></strong>
                <small><span class="pdf-by">by</span> <span class="pdf-carminatti">Carminatti</span></small>
              </span>
            </div>
            <div class="pdf-meta">
              <strong>${escapePdfText(report.module || "Relatório")}</strong>
              <span>Formato ${PDF_STANDARD.page} - ${orientation === "landscape" ? "Paisagem" : "Retrato"}</span>
              <span>Gerado em ${escapePdfText(generatedAt)}</span>
            </div>
          </header>
          <section class="pdf-title">
            <h1>${escapePdfText(report.title)}</h1>
            <p>${escapePdfText(report.subtitle || "Documento gerado automaticamente pelo DocGestor by Carminatti.")}</p>
          </section>
          <div class="pdf-body">
            ${report.sections.map(renderPdfSection).join("")}
          </div>
          <footer class="pdf-footer">
            <span>Documento gerado automaticamente pelo DocGestor by Carminatti. Conferir dados antes de protocolo externo.</span>
          </footer>
        </main>
      </body>
    </html>
  `;
}

let activePdfPreviewHtml = "";
let activePdfPreviewLoaded = false;

function writePdfPreviewFrame(html) {
  const frame = field("pdf-preview-frame");
  const frameDocument = frame?.contentDocument || frame?.contentWindow?.document;
  if (!frameDocument) return false;
  activePdfPreviewLoaded = false;
  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
  activePdfPreviewLoaded = true;
  return true;
}

function openPdfReport(report) {
  const frame = field("pdf-preview-frame");
  const titleElement = field("pdf-preview-title");
  if (!frame) {
    alert("Não foi possível abrir a pré-visualização do PDF.");
    return;
  }
  activePdfPreviewHtml = pdfDocumentHtml(report);
  if (titleElement) titleElement.textContent = report.title || "Relatório";
  if (!writePdfPreviewFrame(activePdfPreviewHtml)) {
    alert("Não foi possível carregar a pré-visualização do PDF.");
    return;
  }
  openModal("pdf-preview-modal");
}

function printPdfPreview() {
  const frame = field("pdf-preview-frame");
  const frameWindow = frame?.contentWindow;
  if (!frameWindow || !activePdfPreviewLoaded) {
    alert("Não foi possível acessar a pré-visualização para impressão.");
    return;
  }
  frameWindow.focus();
  setTimeout(() => frameWindow.print(), 150);
}

field("pdf-preview-print")?.addEventListener("click", printPdfPreview);

function companyNameById(id) {
  return companies.find((company) => sameId(company.id, id))?.name || "Não informado";
}

function partnerNameById(id) {
  return partners.find((partner) => sameId(partner.id, id))?.name || "Não informado";
}

function propertyOwnerLabel(property) {
  if (property.owner) return property.owner;
  if (property.ownerType === "pf") return partnerNameById(property.ownerPartnerId);
  return companyNameById(property.ownerCompanyId);
}

function formatAreaM2(value) {
  return `${Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m2`;
}

function formatAreaHa(value) {
  return `${(Number(value || 0) / 10000).toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} Ha`;
}

function propertyReserveRequired(property) {
  return property.type === "rural" ? Number(property.ruralArea || 0) * 0.2 : 0;
}

function propertyReserveOk(property) {
  return property.type !== "rural" || Number(property.legalReserve || 0) >= propertyReserveRequired(property);
}

function buildPartnersReport() {
  return {
    title: "Relatório de Sócios e Responsaveis Legais",
    module: "01.2.1 Sócios",
    subtitle: "Listagem administrativa usada para alimentar empresas, imóveis, empreendimentos e licenças.",
    sections: [
      pdfTableSection(
        "Sócios cadastrados",
        ["Nome", "Documento", "Função", "Contato", "Telefone", "Status"],
        partners.map((partner) => [partner.name, partner.document, partner.role, partner.contact, partner.phone, partner.status]),
      ),
    ],
  };
}

function buildCompaniesReport(filters = {}) {
  const rows = [];
  const matrixIds = filters.matrixIds || [];
  const branchIds = filters.branchIds || [];
  matrixCompanies()
    .filter((matrix) => !matrixIds.length || matrixIds.includes(String(matrix.id)))
    .forEach((matrix) => {
    rows.push([matrix.cnpj, matrix.name, "Matriz", matrix.tradeName, matrix.partners.join(", "), matrix.status]);
    companies
      .filter((company) => company.kind === "branch" && sameId(company.parentId, matrix.id))
      .filter((company) => !branchIds.length || branchIds.includes(String(company.id)))
      .sort((a, b) => a.cnpj.localeCompare(b.cnpj))
      .forEach((branch) => {
        rows.push([branch.cnpj, branch.name, `Filial de ${matrix.cnpj}`, branch.tradeName, branch.partners.join(", "), branch.status]);
      });
  });

  return {
    title: "Relatório de Empresas e Filiais",
    module: "01.2.2 Empresas e Filiais",
    subtitle: filters.summary || "Matrizes e filiais ordenadas por CNPJ, com vinculo de sócios.",
    orientation: "landscape",
    sections: [pdfTableSection("Empresas cadastradas", ["CNPJ", "Razão social / filial", "Tipo", "Nome fantasia", "Sócios", "Status"], rows, { rowEstimate: 32 })],
  };
}

function buildPropertiesRelationReport(filteredProperties, filters = {}) {
  return {
    title: "Relação de Imóveis",
    module: "01.2.4 Imóveis",
    subtitle: filters.summary || "Ficha consolidada dos imóveis cadastrados.",
    sections: filteredProperties.map((property) => {
      const isRural = property.type === "rural";
      const reserveRequired = propertyReserveRequired(property);
      const reserveOk = propertyReserveOk(property);
      return pdfFieldsSection(`Matrícula ${property.registration}`, [
        ["Proprietário", propertyOwnerLabel(property)],
        ["Tipo de proprietário", property.ownerType === "pf" ? "Pessoa física" : "Pessoa jurídica"],
        ["Tipo de imóvel", isRural ? "Rural" : "Urbano"],
        ["Referência", property.reference],
        ["Endereço", property.address],
        ["Cidade", property.city],
        ["Lote", property.lot],
        [isRural ? "Gleba" : "Quadra", isRural ? property.glebe : property.block],
        [isRural ? "Número do CAR" : "Inscrição imobiliária", isRural ? property.carNumber : property.municipalRegistration],
        ...(isRural ? [["Número CCIR/INCRA", property.ccirIncra]] : []),
        ["Área total", isRural ? `${formatAreaM2(property.ruralArea)} / ${formatAreaHa(property.ruralArea)}` : formatAreaM2(property.urbanArea)],
        ["Reserva legal", isRural ? `${formatAreaM2(property.legalReserve)} / ${formatAreaHa(property.legalReserve)}` : "Não aplicável"],
        ["APP", isRural ? `${formatAreaM2(property.appArea)} / ${formatAreaHa(property.appArea)}` : "Não aplicável"],
        ["Reserva exigida", isRural ? `${formatAreaM2(reserveRequired)} / ${formatAreaHa(reserveRequired)}` : "Não aplicável"],
        ["Conformidade ambiental", reserveOk ? "Reserva legal em conformidade" : "Reserva legal abaixo de 20%"],
        ["Construção", property.hasConstruction ? `${property.constructionArea || 0} m2` : "Não informada"],
      ], { estimate: 270 });
    }),
  };
}

function buildPropertiesEnvironmentalReport(filteredProperties, filters = {}) {
  const ruralProperties = filteredProperties.filter((property) => property.type === "rural");
  const totals = ruralProperties.reduce(
    (acc, property) => {
      acc.area += Number(property.ruralArea || 0);
      acc.reserve += Number(property.legalReserve || 0);
      acc.app += Number(property.appArea || 0);
      return acc;
    },
    { area: 0, reserve: 0, app: 0 },
  );
  const required = totals.area * 0.2;
  const isOk = totals.reserve >= required;
  const rows = ruralProperties.map((property) => {
    const requiredByProperty = propertyReserveRequired(property);
    return [
      `Matrícula ${property.registration}`,
      propertyOwnerLabel(property),
      property.reference || "Não informada",
      `${formatAreaM2(property.ruralArea)} / ${formatAreaHa(property.ruralArea)}`,
      `${formatAreaM2(property.legalReserve)} / ${formatAreaHa(property.legalReserve)}`,
      `${formatAreaM2(property.appArea)} / ${formatAreaHa(property.appArea)}`,
      `${formatAreaM2(requiredByProperty)} / ${formatAreaHa(requiredByProperty)}`,
      propertyReserveOk(property) ? "Conforme" : "Abaixo de 20%",
    ];
  });

  return {
    title: "Relatório Ambiental de Imóveis",
    module: "01.2.4 Imóveis",
    subtitle: filters.summary || "Análise consolidada de área rural, reserva legal e APP.",
    orientation: "landscape",
    sections: [
      pdfTableSection(
        "Imóveis rurais analisados",
        ["Imóvel", "Proprietário", "Referência", "Área total", "Reserva legal", "APP", "Reserva exigida", "Situação"],
        rows.length ? rows : [["Nenhum imóvel rural encontrado", "", "", "", "", "", "", ""]],
        { rowEstimate: 42, headerEstimate: 82 },
      ),
      pdfFieldsSection("Totalizador ambiental", [
        ["Quantidade de imóveis", ruralProperties.length],
        ["Área total somada", `${formatAreaM2(totals.area)} / ${formatAreaHa(totals.area)}`],
        ["Reserva legal somada", `${formatAreaM2(totals.reserve)} / ${formatAreaHa(totals.reserve)}`],
        ["APP somada", `${formatAreaM2(totals.app)} / ${formatAreaHa(totals.app)}`],
        ["Reserva legal exigida 20%", `${formatAreaM2(required)} / ${formatAreaHa(required)}`],
        ["Resultado consolidado", isOk ? "Conforme a exigência minima de 20%" : "Reserva legal consolidada abaixo de 20%"],
      ], { estimate: 160 }),
      pdfSection(
        "Criterio tecnico aplicado",
        `<p class="pdf-note">A APP foi demonstrada separadamente para indicar existência de área ambiental protegida. Ela está contida na reserva legal e não foi somada novamente ao calculo consolidado.</p>`,
        90,
      ),
    ],
  };
}

function buildPropertiesReport(filters = {}) {
  const filteredProperties = filterPropertiesForPdf(filters);
  if (filters.reportType === "environmental") return buildPropertiesEnvironmentalReport(filteredProperties, filters);
  return buildPropertiesRelationReport(filteredProperties, filters);
}

function buildEnterprisesReport() {
  return {
    title: "Relatório de Empreendimentos",
    module: "01.2.5 Empreendimento",
    subtitle: "Empreendimentos vinculados a empresas e imóveis.",
    sections: [
      pdfTableSection(
        "Empreendimentos cadastrados",
        ["Nome", "Empresa", "Imóvel", "Tipo", "Status", "Módulos", "CTF/APP", "Referência"],
        enterprises.map((enterprise) => [enterprise.name, enterprise.company, enterprise.property, enterprise.type, enterprise.status, enterpriseModuleLabels(enterpriseModules(enterprise)), enterprise.potentialPolluter ? "Potencialmente poluidor" : "Não classificado", enterprise.reference]),
        { rowEstimate: 38 },
      ),
    ],
    orientation: "landscape",
  };
}

function buildLicenseTypesReport() {
  return {
    title: "Relatório de Tipos de Licenças Ambientais",
    module: "01.3.1 Tipos de Licenças",
    subtitle: "Classificação dos tipos de licença.",
    sections: [
      pdfTableSection(
        "Tipos cadastrados",
        ["Nome", "Sigla", "Classificação"],
        environmentalLicenseTypes.map((item) => [item.name, item.code, item.phases.join(", ")]),
      ),
    ],
  };
}

function buildEnvironmentalDocumentsReport() {
  return {
    title: "Relatório de Documentos Ambientais",
    module: "01.3.2 Documentos",
    subtitle: "Documentos vinculados aos tipos de licença ambiental.",
    orientation: "landscape",
    sections: [
      pdfTableSection(
        "Documentos cadastrados",
        ["Documento", "Licenças vinculadas", "Exige vencimento", "Obrigatorio", "Parâmetros"],
        environmentalDocuments.map((item) => [item.name, item.licenses.join(", "), item.expiration, item.required, item.parameters || "Não informado"]),
        { rowEstimate: 38 },
      ),
    ],
  };
}

function buildChecklistModelsReport() {
  return {
    title: "Relatório de Modelos de Check-list",
    module: "01.3.3 Modelos de Check-list",
    subtitle: "Modelos que alimentam a criação de novas licenças ambientais.",
    orientation: "landscape",
    sections: [
      pdfTableSection(
        "Modelos cadastrados",
        ["Modelo", "Tipo de licença", "Documentos selecionados"],
        checklistModelsAdmin.map((item) => [item.name, item.license, item.documents.join(", ")]),
        { rowEstimate: 42 },
      ),
    ],
  };
}

function formatPdfDateOnly(value) {
  return value ? formatAgendaDate(value) : "Não informado";
}

function fallbackPdfRows(rows, columns) {
  return rows.length ? rows : [columns.map((column, index) => (index === 0 ? "Nenhum registro" : "-"))];
}

function processStatusRows() {
  const statuses = [
    ["Abertas", "open"],
    ["Pendentes", "pending"],
    ["Vencidas", "expired"],
  ];
  return statuses.map(([label, status]) => [label, environmentalProcesses.filter((process) => process.status === status).length]);
}

function environmentalProcessReportRows(status) {
  return sortedProcesses(environmentalProcesses.filter((process) => process.status === status)).map((process) => {
    const currentStage = currentProcessStage(process);
    return [
      process.internalNumber || process.number,
      process.title,
      process.type,
      currentStage?.name || "Acompanhamento",
      `${process.progress || 0}%`,
      process.due,
    ];
  });
}

function buildEnvironmentalModuleReport() {
  environmentalProcesses.forEach((process) => {
    ensureProcessStages(process);
    updateProcessProgress(process);
  });
  const openRows = environmentalProcessReportRows("open");
  const pendingRows = environmentalProcessReportRows("pending");
  const expiredRows = environmentalProcessReportRows("expired");
  const licenseRows = activeLicenses().map((license) => [
    license.number,
    license.type,
    license.processNumber,
    license.company,
    formatPdfDateOnly(license.expiryDate),
    license.status,
  ]);
  const processColumns = ["Processo", "Empreendimento", "Tipo de licença", "Etapa atual", "Progresso", "Prazo / situação"];

  return {
    title: "Relatório do Módulo Ambiental",
    module: "03.1 Módulo operacional",
    subtitle: "Processos ambientais em aberto, pendentes, vencidos e licenças ativas.",
    orientation: "landscape",
    sections: [
      pdfFieldsSection("Resumo operacional", [
        ["Processos relacionados", openRows.length + pendingRows.length + expiredRows.length],
        ["Licenças ativas", activeLicenses().length],
        ["Abertas", openRows.length],
        ["Pendentes", pendingRows.length],
        ["Vencidas", expiredRows.length],
      ], { estimate: 170 }),
      pdfTableSection("Abertas", processColumns, fallbackPdfRows(openRows, processColumns), { rowEstimate: 38 }),
      pdfTableSection("Pendentes", processColumns, fallbackPdfRows(pendingRows, processColumns), { rowEstimate: 38 }),
      pdfTableSection("Vencidas", processColumns, fallbackPdfRows(expiredRows, processColumns), { rowEstimate: 38 }),
      pdfTableSection("Licenças", ["Licença", "Tipo", "Processo", "Empresa", "Vencimento", "Status"], fallbackPdfRows(licenseRows, ["Licença", "Tipo", "Processo", "Empresa", "Vencimento", "Status"]), { rowEstimate: 36 }),
    ],
  };
}

function buildEnvironmentalStatusReport(status = currentLicenseStatus) {
  environmentalProcesses.forEach((process) => {
    ensureProcessStages(process);
    updateProcessProgress(process);
  });
  const meta = licenseStatusMeta[status] || licenseStatusMeta.general;
  const processColumns = ["Processo", "Empreendimento", "Tipo de licença", "Etapa atual", "Progresso", "Prazo / situação"];

  if (status === "licenses") {
    const licenseRows = activeLicenses().map((license) => [
      license.number,
      license.type,
      license.processNumber,
      license.company,
      formatPdfDateOnly(license.expiryDate),
      license.status,
    ]);
    return {
      title: "Relatório de Licenças",
      module: "03.1.5 Licenças",
      subtitle: "Licenças ambientais ativas geradas pelos processos ambientais.",
      orientation: "landscape",
      sections: [
        pdfFieldsSection("Resumo", [
          ["Licenças listadas", licenseRows.length],
          ["Módulo", "03.1.5 Licenças"],
        ], { estimate: 120 }),
        pdfTableSection("Licenças", ["Licença", "Tipo", "Processo", "Empresa", "Vencimento", "Status"], fallbackPdfRows(licenseRows, ["Licença", "Tipo", "Processo", "Empresa", "Vencimento", "Status"]), { rowEstimate: 36 }),
      ],
    };
  }

  const processRows = environmentalProcessReportRows(status);
  return {
    title: `Relatório - ${meta.title}`,
    module: meta.title,
    subtitle: meta.subtitle,
    orientation: "landscape",
    sections: [
      pdfFieldsSection("Resumo", [
        ["Processos listados", processRows.length],
        ["Módulo", meta.title],
      ], { estimate: 120 }),
      pdfTableSection(meta.title.replace(/^03\.1\.\d+\s+/, ""), processColumns, fallbackPdfRows(processRows, processColumns), { rowEstimate: 38 }),
    ],
  };
}

function buildEnvironmentalContextReport() {
  return currentLicenseStatus === "general" ? buildEnvironmentalModuleReport() : buildEnvironmentalStatusReport(currentLicenseStatus);
}

function buildEnvironmentalProcessDossiêr(process) {
  ensureProcessStages(process);
  updateProcessProgress(process);
  const currentStage = currentProcessStage(process);
  const stageRows = ensureProcessStages(process).map((stage) => {
    const record = process.stageRecords?.[stage.number] || {};
    const documentCount = process.stageDocuments?.[stage.number]?.length || 0;
    const preparedCount = (process.stageDocuments?.[stage.number] || []).filter((item) => item.prepared).length;
    const detail = isProtocolStage(stage)
      ? `${record.protocolNumber || "Sem protocolo"} - ${formatPdfDateOnly(record.protocolDate)}`
      : isLicenseStage(stage)
        ? `${record.licenseNumber || "Sem licença"} - venc. ${formatPdfDateOnly(record.expiryDate)}`
        : documentCount
          ? `${preparedCount} de ${documentCount} documento(s) elaborado(s)`
          : "Sem check-list selecionado";
    return [`Etapa ${stage.number}`, stage.name, stage.status, detail];
  });
  const documentRows = ensureProcessStages(process).flatMap((stage) =>
    (process.stageDocuments?.[stage.number] || []).map((documentItem) => [
      `Etapa ${stage.number}`,
      documentItem.name,
      documentItem.prepared ? "Elaborado" : "Pendente",
      documentItem.notes || "Sem observações",
    ]),
  );
  const licenseRows = (process.licenseHistory || []).map((license) => [
    license.number,
    license.type,
    `Etapa ${license.stageNumber}`,
    formatPdfDateOnly(license.expiryDate),
    license.status,
  ]);

  return {
    title: `Dossiê do Processo ${process.internalNumber || process.number}`,
    module: "03.1 Licenças Ambientais",
    subtitle: process.title,
    orientation: "portrait",
    sections: [
      pdfFieldsSection("Dados principais", [
        ["Processo interno", process.internalNumber || process.number],
        ["Número oficial / licença atual", process.number || "Não informado"],
        ["Formato", process.licensingFormatLabel || "Não definido"],
        ["Tipo de licença", process.type],
        ["Empresa", process.company],
        ["Imóvel", process.property || "Não informado"],
        ["Responsável", process.responsible],
        ["Status", process.statusLabel || processStatusLabel(process.status)],
        ["Etapa atual", currentStage?.name || "Concluído"],
        ["Progresso", `${process.progress || 0}%`],
        ["Prazo / situação", process.due],
        ["Observações", process.notes || "Sem observações"],
      ], { estimate: 260 }),
      pdfTableSection("Etapas do processo", ["Etapa", "Nome", "Status", "Detalhe"], stageRows, { rowEstimate: 38 }),
      pdfTableSection("Documentos do processo", ["Etapa", "Documento", "Situação", "Observações"], fallbackPdfRows(documentRows, ["Etapa", "Documento", "Situação", "Observações"]), { rowEstimate: 38 }),
      pdfTableSection("Licenças geradas no processo", ["Licença", "Tipo", "Etapa", "Vencimento", "Status"], fallbackPdfRows(licenseRows, ["Licença", "Tipo", "Etapa", "Vencimento", "Status"]), { rowEstimate: 34 }),
    ],
  };
}

function buildEnvironmentalLicenseDossiêr(license) {
  const process = license.process || environmentalProcesses.find((item) => String(item.id) === String(license.processId));
  const stage = process ? ensureProcessStages(process).find((item) => item.number === Number(license.stageNumber)) : null;
  const record = process?.stageRecords?.[license.stageNumber] || {};
  const previousLicenses = (process?.licenseHistory || []).filter((item) => item.stageNumber <= license.stageNumber);

  return {
    title: `Dossiê da Licença ${license.number}`,
    module: "03.1.5 Licenças",
    subtitle: `${license.type} - ${license.company}`,
    orientation: "portrait",
    sections: [
      pdfFieldsSection("Licença ambiental", [
        ["Número da licença", license.number],
        ["Tipo", license.type],
        ["Status", license.status],
        ["Vencimento", formatPdfDateOnly(license.expiryDate)],
        ["Processo interno", license.processNumber],
        ["Empreendimento", license.title],
        ["Empresa", license.company],
        ["Responsável", license.responsible],
        ["Etapa de origem", stage ? `${stage.number} - ${stage.name}` : `Etapa ${license.stageNumber}`],
        ["Registro da etapa", record.licenseNumber || license.number],
      ], { estimate: 230 }),
      pdfFieldsSection("Processo vinculado", [
        ["Formato", process?.licensingFormatLabel || "Não informado"],
        ["Tipos previstos", process?.type || license.type],
        ["Imóvel", process?.property || "Não informado"],
        ["Progresso", process ? `${process.progress || 0}%` : "Não informado"],
        ["Situação", process?.statusLabel || processStatusLabel(process?.status)],
        ["Prazo / situação", process?.due || "Não informado"],
      ], { estimate: 180 }),
      pdfTableSection("Histórico de licenças do processo", ["Licença", "Tipo", "Etapa", "Vencimento", "Status"], fallbackPdfRows(
        previousLicenses.map((item) => [item.number, item.type, `Etapa ${item.stageNumber}`, formatPdfDateOnly(item.expiryDate), item.status]),
        ["Licença", "Tipo", "Etapa", "Vencimento", "Status"],
      ), { rowEstimate: 34 }),
    ],
  };
}

const pdfFilterState = {
  companyMatrixIds: [],
  companyBranchIds: [],
  propertyOwners: [],
  propertyIds: [],
  activePicker: null,
};

function summarizeSelection(selectedCount, totalCount, allText, itemText) {
  if (!totalCount) return "Nenhum disponível";
  if (selectedCount === totalCount) return allText;
  if (selectedCount === 0) return "Nenhum selecionado";
  return `${selectedCount} ${itemText}`;
}

function companyPdfBranches(matrixIds = []) {
  return companies
    .filter((company) => company.kind === "branch")
    .filter((company) => !matrixIds.length || matrixIds.includes(String(company.parentId)))
    .sort((a, b) => a.cnpj.localeCompare(b.cnpj));
}

function populateCompanyPdfFilters() {
  pdfFilterState.companyMatrixIds = matrixCompanies().map((matrix) => String(matrix.id));
  pdfFilterState.companyBranchIds = companyPdfBranches(pdfFilterState.companyMatrixIds).map((branch) => String(branch.id));
  updateCompanyPdfBranches();
}

function updateCompanyPdfBranches() {
  const availableBranches = companyPdfBranches(pdfFilterState.companyMatrixIds).map((branch) => String(branch.id));
  pdfFilterState.companyBranchIds = pdfFilterState.companyBranchIds.filter((id) => availableBranches.includes(id));
  if (!pdfFilterState.companyBranchIds.length) pdfFilterState.companyBranchIds = [...availableBranches];
  updateCompanyPdfSummaries();
}

function companyPdfSummary() {
  const matrixText = summarizeSelection(pdfFilterState.companyMatrixIds.length, matrixCompanies().length, "todas as matrizes", "matriz(es)");
  const availableBranches = companyPdfBranches(pdfFilterState.companyMatrixIds);
  const branchText = summarizeSelection(pdfFilterState.companyBranchIds.length, availableBranches.length, "todas as filiais disponíveis", "filial(is)");
  return `PDF com ${matrixText} e ${branchText}`;
}

function updateCompanyPdfSummaries() {
  const matrixSummary = field("company-pdf-matrix-summary");
  const branchSummary = field("company-pdf-branch-summary");
  const preview = field("company-pdf-preview");
  if (matrixSummary) matrixSummary.textContent = summarizeSelection(pdfFilterState.companyMatrixIds.length, matrixCompanies().length, "Todas as matrizes", "matriz(es)");
  if (branchSummary) branchSummary.textContent = summarizeSelection(pdfFilterState.companyBranchIds.length, companyPdfBranches(pdfFilterState.companyMatrixIds).length, "Todas as filiais disponíveis", "filial(is)");
  if (preview) preview.textContent = companyPdfSummary();
}

function selectedCompanyPdfFilters() {
  return {
    matrixIds: pdfFilterState.companyMatrixIds,
    branchIds: pdfFilterState.companyBranchIds,
    summary: companyPdfSummary(),
  };
}

function openCompanyPdfFilters() {
  populateCompanyPdfFilters();
  openModal("company-pdf-modal");
}

function generateCompanyFilteredPdf() {
  closeModal("company-pdf-modal");
  openPdfReport(buildCompaniesReport(selectedCompanyPdfFilters()));
}

function propertyOwnersForPdf() {
  return Array.from(new Set(properties.map((property) => propertyOwnerLabel(property)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function basePropertyPdfFilterValues() {
  return {
    reportType: field("property-pdf-report-type")?.value || "environmental",
    ownerIds: pdfFilterState.propertyOwners,
    propertyType: field("property-pdf-property-type")?.value || "all",
    compliance: field("property-pdf-compliance")?.value || "all",
    selectionMode: field("property-pdf-selection-mode")?.value || "all",
  };
}

function filterPropertiesForPdf(filters = {}) {
  const selectedIds = filters.selectedPropertyIds || [];
  return properties.filter((property) => {
    if (filters.ownerIds?.length && !filters.ownerIds.includes(propertyOwnerLabel(property))) return false;
    if (filters.reportType === "environmental" && property.type !== "rural") return false;
    if (filters.propertyType && filters.propertyType !== "all" && property.type !== filters.propertyType) return false;
    if (filters.reportType === "environmental" && filters.compliance === "ok" && !propertyReserveOk(property)) return false;
    if (filters.reportType === "environmental" && filters.compliance === "warning" && propertyReserveOk(property)) return false;
    if (filters.selectionMode === "selected" && selectedIds.length && !selectedIds.includes(String(property.id))) return false;
    if (filters.selectionMode === "selected" && !selectedIds.length) return false;
    return true;
  });
}

function populatePropertyPdfFilters() {
  pdfFilterState.propertyOwners = propertyOwnersForPdf();
  pdfFilterState.propertyIds = properties.map((property) => String(property.id));
  updatePropertyPdfFilters();
}

function propertyPdfSummary(filters = basePropertyPdfFilterValues()) {
  const filtered = filterPropertiesForPdf({
    ...filters,
    selectedPropertyIds: pdfFilterState.propertyIds,
  });
  const type = filters.reportType === "environmental" ? "Ambiental" : "Relação de Imóveis";
  const scope = filters.selectionMode === "selected" ? "imóveis selecionados" : "imóveis filtrados";
  return `${type}: ${filtered.length} ${scope}`;
}

function updatePropertyPdfSummaries() {
  const filters = basePropertyPdfFilterValues();
  const ownerSummary = field("property-pdf-owner-summary");
  const propertySummary = field("property-pdf-property-summary");
  const preview = field("property-pdf-preview");
  const propertyCard = field("property-pdf-property-card");
  const availableProperties = filterPropertiesForPdf({ ...filters, selectionMode: "all" });
  pdfFilterState.propertyIds = pdfFilterState.propertyIds.filter((id) => availableProperties.some((property) => String(property.id) === id));
  if (!pdfFilterState.propertyIds.length) pdfFilterState.propertyIds = availableProperties.map((property) => String(property.id));
  if (ownerSummary) ownerSummary.textContent = summarizeSelection(pdfFilterState.propertyOwners.length, propertyOwnersForPdf().length, "Todos os proprietários", "proprietário(s)");
  if (propertySummary) propertySummary.textContent = summarizeSelection(pdfFilterState.propertyIds.length, availableProperties.length, "Todos os imóveis filtrados", "imóvel(is)");
  if (propertyCard) propertyCard.hidden = filters.selectionMode !== "selected";
  if (preview) preview.textContent = propertyPdfSummary(filters);
}

function updatePropertyPdfFilters() {
  const filters = basePropertyPdfFilterValues();
  const complianceField = field("property-pdf-compliance-field");
  const propertyType = field("property-pdf-property-type");
  const help = field("property-pdf-help");
  if (filters.reportType === "environmental" && propertyType) propertyType.value = "rural";
  if (propertyType) propertyType.disabled = filters.reportType === "environmental";
  if (complianceField) complianceField.hidden = filters.reportType !== "environmental";
  if (help) {
    help.textContent =
      filters.reportType === "environmental"
        ? "No relatório ambiental, o sistema totaliza área, reserva legal e APP, validando a exigência de 20%."
        : "Na relacao de imóveis, o PDF monta fichas cadastrais completas dos imóveis filtrados.";
  }
  updatePropertyPdfSummaries();
}

function openPropertyPdfFilters() {
  populatePropertyPdfFilters();
  openModal("property-pdf-modal");
}

function generatePropertyFilteredPdf() {
  const filters = {
    ...basePropertyPdfFilterValues(),
    selectedPropertyIds: pdfFilterState.propertyIds,
  };
  filters.summary = propertyPdfSummary(filters);
  closeModal("property-pdf-modal");
  openPdfReport(buildPropertiesReport(filters));
}

function pickerConfig(kind) {
  if (kind === "company-matrices") {
    return {
      title: "Selecionar matrizes",
      context: "01.2.2 Empresas e Filiais",
      options: matrixCompanies().map((matrix) => ({ value: String(matrix.id), label: `${matrix.cnpj} - ${matrix.name}` })),
      selected: pdfFilterState.companyMatrixIds,
      apply(values) {
        pdfFilterState.companyMatrixIds = values;
        updateCompanyPdfBranches();
      },
    };
  }
  if (kind === "company-branches") {
    return {
      title: "Selecionar filiais",
      context: "01.2.2 Empresas e Filiais",
      options: companyPdfBranches(pdfFilterState.companyMatrixIds).map((branch) => {
        const matrix = companies.find((company) => sameId(company.id, branch.parentId));
        return { value: String(branch.id), label: `${branch.cnpj} - ${branch.name}`, detail: matrix?.name || "" };
      }),
      selected: pdfFilterState.companyBranchIds,
      apply(values) {
        pdfFilterState.companyBranchIds = values;
        updateCompanyPdfSummaries();
      },
    };
  }
  if (kind === "property-owners") {
    return {
      title: "Selecionar proprietários",
      context: "01.2.4 Imóveis",
      options: propertyOwnersForPdf().map((owner) => ({ value: owner, label: owner })),
      selected: pdfFilterState.propertyOwners,
      apply(values) {
        pdfFilterState.propertyOwners = values;
        updatePropertyPdfFilters();
      },
    };
  }
  if (kind === "property-properties") {
    const available = filterPropertiesForPdf({ ...basePropertyPdfFilterValues(), selectionMode: "all" });
    return {
      title: "Selecionar imóveis",
      context: "01.2.4 Imóveis",
      options: available.map((property) => ({
        value: String(property.id),
        label: `Matrícula ${property.registration} - ${propertyOwnerLabel(property)}`,
        detail: property.reference || "Sem referencia informada",
      })),
      selected: pdfFilterState.propertyIds,
      apply(values) {
        pdfFilterState.propertyIds = values;
        updatePropertyPdfSummaries();
      },
    };
  }
  return null;
}

function openPdfPicker(kind) {
  const config = pickerConfig(kind);
  if (!config) return;
  pdfFilterState.activePicker = kind;
  const title = field("pdf-picker-title");
  const context = field("pdf-picker-context");
  const list = field("pdf-picker-list");
  if (title) title.textContent = config.title;
  if (context) context.textContent = config.context;
  if (list) {
    list.innerHTML = `<span>Opcoes</span>${
      config.options.length
        ? config.options
            .map(
              (option) => `
                <label>
                  <input type="checkbox" name="pdf-picker-option" value="${escapePdfText(option.value)}" ${config.selected.includes(option.value) ? "checked" : ""} />
                  ${escapePdfText(option.label)}
                  ${option.detail ? `<small>${escapePdfText(option.detail)}</small>` : ""}
                </label>
              `,
            )
            .join("")
        : "<small>Nenhuma opcao disponível para o filtro atual.</small>"
    }`;
  }
  openModal("pdf-picker-modal");
}

function setPdfPickerChecked(checked) {
  document.querySelectorAll('input[name="pdf-picker-option"]').forEach((input) => {
    input.checked = checked;
  });
}

function applyPdfPicker() {
  const config = pickerConfig(pdfFilterState.activePicker);
  if (!config) return;
  config.apply(checkedValues('input[name="pdf-picker-option"]'));
  closeModal("pdf-picker-modal");
}

const pdfReports = {
  partners: buildPartnersReport,
  companies: buildCompaniesReport,
  properties: buildPropertiesReport,
  enterprises: buildEnterprisesReport,
  licenseTypes: buildLicenseTypesReport,
  environmentalDocuments: buildEnvironmentalDocumentsReport,
  checklistModels: buildChecklistModelsReport,
  environmentalModule: buildEnvironmentalContextReport,
};

function addPdfButton(container, label, reportKey) {
  if (!container || container.querySelector(`[data-pdf-report="${reportKey}"]`)) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ghost small pdf-action";
  button.dataset.pdfReport = reportKey;
  button.textContent = label;
  button.addEventListener("click", () => {
    if (reportKey === "companies") {
      openCompanyPdfFilters();
      return;
    }
    if (reportKey === "properties") {
      openPropertyPdfFilters();
      return;
    }
    const builder = pdfReports[reportKey];
    if (builder) openPdfReport(builder());
  });
  container.appendChild(button);
}

field("company-pdf-generate")?.addEventListener("click", generateCompanyFilteredPdf);

[
  "property-pdf-property-type",
  "property-pdf-compliance",
  "property-pdf-selection-mode",
].forEach((id) => field(id)?.addEventListener("change", updatePropertyPdfFilters));
field("property-pdf-owner-checks")?.addEventListener("change", updatePropertyPdfFilters);
field("property-pdf-report-type")?.addEventListener("change", () => {
  const propertyType = field("property-pdf-property-type");
  if (propertyType) propertyType.value = field("property-pdf-report-type")?.value === "environmental" ? "rural" : "all";
  updatePropertyPdfFilters();
});
field("property-pdf-generate")?.addEventListener("click", generatePropertyFilteredPdf);
document.querySelectorAll("[data-pdf-picker]").forEach((button) => {
  button.addEventListener("click", () => openPdfPicker(button.dataset.pdfPicker));
});
field("pdf-picker-all")?.addEventListener("click", () => setPdfPickerChecked(true));
field("pdf-picker-none")?.addEventListener("click", () => setPdfPickerChecked(false));
field("pdf-picker-apply")?.addEventListener("click", applyPdfPicker);

function installPdfButtons() {
  document.querySelectorAll(".list-head").forEach((head) => {
    if (head.querySelector(".list-head-actions")) return;
    const count = head.querySelector("span");
    if (!count) return;
    const actions = document.createElement("div");
    actions.className = "list-head-actions";
    count.replaceWith(actions);
    actions.appendChild(count);
  });

  addPdfButton(document.querySelector("#partner-count")?.parentElement, "Baixar PDF", "partners");
  addPdfButton(document.querySelector("#company-count")?.parentElement, "Baixar PDF", "companies");
  addPdfButton(document.querySelector("#property-count")?.parentElement, "Baixar PDF", "properties");
  addPdfButton(document.querySelector("#enterprise-count")?.parentElement, "Baixar PDF", "enterprises");
  addPdfButton(document.querySelector("#license-type-count")?.parentElement, "Baixar PDF", "licenseTypes");
  addPdfButton(document.querySelector("#environmental-document-count")?.parentElement, "Baixar PDF", "environmentalDocuments");
  addPdfButton(document.querySelector("#checklist-model-count")?.parentElement, "Baixar PDF", "checklistModels");

  const environmentalHead = document.querySelector("#licencas .module-context");
  if (environmentalHead && !environmentalHead.querySelector('[data-pdf-report="environmentalModule"]')) {
    const actionWrap = document.createElement("div");
    actionWrap.className = "title-actions";
    addPdfButton(actionWrap, "Baixar relatório", "environmentalModule");
    environmentalHead.appendChild(actionWrap);
  }
}

installPdfButtons();

async function dbList(table, query = "select=*") {
  if (!window.DocGestorDB) return [];
  try {
    return await window.DocGestorDB.list(table, query);
  } catch (error) {
    console.warn(`Tabela ${table} indisponível no Supabase.`, error.message);
    return [];
  }
}

function statusFromSupabase(value) {
  const normalized = String(value || "").toLowerCase();
  if (["vencida", "vencido", "expired", "critico", "crítico"].includes(normalized)) return "expired";
  if (["pendente", "pending", "em analise", "em análise", "renovar", "suspenso"].includes(normalized)) return "pending";
  if (["concluida", "concluída", "concluido", "concluído", "deferido", "done", "encerrado"].includes(normalized)) return "done";
  return "open";
}

function renderDashboard() {
  environmentalProcesses.forEach(applyProcessDeadlineRules);
  const activeProcesses = environmentalProcesses.filter((process) => process.status !== "done");
  const criticalProcesses = activeProcesses.filter((process) => process.status === "expired" || process.risk?.toLowerCase().includes("crítico") || process.risk?.toLowerCase().includes("vencida"));
  const warningProcesses = activeProcesses.filter((process) => process.status === "pending" || process.risk?.toLowerCase().includes("atencao"));
  const concluded = environmentalProcesses.filter((process) => process.status === "done").length;
  const compliance = environmentalProcesses.length ? Math.round((concluded / environmentalProcesses.length) * 100) : 0;

  if (field("dashboard-critical-count")) field("dashboard-critical-count").textContent = criticalProcesses.length;
  if (field("dashboard-warning-count")) field("dashboard-warning-count").textContent = warningProcesses.length;
  if (field("dashboard-process-count")) field("dashboard-process-count").textContent = activeProcesses.length;
  if (field("dashboard-compliance")) field("dashboard-compliance").textContent = `${compliance}%`;

  const riskTable = field("dashboard-risk-table");
  if (riskTable) {
    const head = riskTable.querySelector(".table-head")?.outerHTML || "";
    const rows = [...criticalProcesses, ...warningProcesses].slice(0, 8);
    riskTable.innerHTML = `${head}${
      rows.length
        ? rows
            .map(
              (process) => `
                <div class="table-row">
                  <span>Ambiental</span>
                  <span>${escapeHtml(process.internalNumber || process.number || process.title || "Processo")}</span>
                  <span>${escapeHtml(process.due || "Sem prazo definido")}</span>
                  <span class="pill ${process.status === "expired" ? "red" : "yellow"}">${escapeHtml(process.statusLabel || processStatusLabel(process.status))}</span>
                </div>
              `,
            )
            .join("")
        : `<div class="table-row"><span>Ambiental</span><span>Nenhum risco real cadastrado</span><span>-</span><span class="pill green">Em dia</span></div>`
    }`;
  }

  const taskList = field("dashboard-task-list");
  if (taskList) {
    const nextEvents = [...agendaEvents].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).slice(0, 5);
    taskList.innerHTML = nextEvents.length
      ? nextEvents.map((event) => `<li><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.type)} - ${escapeHtml(formatAgendaDate(event.date))} ${escapeHtml(event.time || "")}</span></li>`).join("")
      : `<li><strong>Nenhum agendamento pendente</strong><span>Cadastre prazos na Agenda ou nas etapas dos processos.</span></li>`;
  }

  renderEnvironmentalDashboard();
  renderIptuDashboard();
  renderScheduleDashboard();
}

function renderDashboardTable(targetId, columns, rows, emptyMessage) {
  const target = field(targetId);
  if (!target) return;
  const head = `<div class="table-row table-head">${columns.map((column) => `<span>${column}</span>`).join("")}</div>`;
  target.innerHTML = `${head}${
    rows.length
      ? rows.map((row) => `<div class="table-row">${row.map((cell) => `<span>${cell}</span>`).join("")}</div>`).join("")
      : `<div class="table-row"><span>${emptyMessage}</span><span>-</span><span>-</span><span class="pill green">Em dia</span></div>`
  }`;
}

function renderEnvironmentalDashboard() {
  environmentalProcesses.forEach(applyProcessDeadlineRules);
  const open = environmentalProcesses.filter((process) => process.status === "open");
  const pending = environmentalProcesses.filter((process) => process.status === "pending");
  const expired = environmentalProcesses.filter((process) => process.status === "expired");
  const activeLicenses = environmentalProcesses.map((process) => process.activeLicense).filter((license) => license?.number && license.status !== "Substituída");
  if (field("environmental-dashboard-open")) field("environmental-dashboard-open").textContent = open.length;
  if (field("environmental-dashboard-pending")) field("environmental-dashboard-pending").textContent = pending.length;
  if (field("environmental-dashboard-expired")) field("environmental-dashboard-expired").textContent = expired.length;
  if (field("environmental-dashboard-licenses")) field("environmental-dashboard-licenses").textContent = activeLicenses.length;
  const rows = [...environmentalProcesses]
    .filter((process) => process.status !== "done")
    .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")))
    .slice(0, 8)
    .map((process) => [
      escapeHtml(process.internalNumber || process.number || "Processo"),
      escapeHtml(process.enterprise || "Empreendimento não informado"),
      escapeHtml(process.due || "Sem prazo"),
      `<span class="pill ${process.status === "expired" ? "red" : process.status === "pending" ? "yellow" : "green"}">${escapeHtml(processStatusLabel(process.status))}</span>`,
    ]);
  renderDashboardTable("environmental-dashboard-table", ["Processo", "Empreendimento", "Prazo", "Status"], rows, "Nenhum processo ambiental em risco");
  renderEnvironmentalLegalCompliance();
  renderEnvironmentalReserveDashboard();
}

function endOfMonthReference(monthOffset = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59, 999);
}

function monthShortLabel(date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

function environmentalLegalComplianceSnapshot(referenceDate = new Date()) {
  const environmentalEnterprises = enterprisesForModule("environmental");
  const rows = environmentalEnterprises.map((enterprise) => {
    const licenses = operationalLicensesForEnterprise(enterprise, referenceDate);
    const codes = licenses.map(operationalLicenseCode).filter(Boolean);
    const uniqueCodes = [...new Set(codes)];
    const compliant = licenses.length === 1 && uniqueCodes.length === 1;
    const conflict = licenses.length > 1 || uniqueCodes.length > 1;
    return {
      enterprise,
      licenses,
      codes,
      compliant,
      conflict,
      status: compliant ? "Conforme" : conflict ? "Conflito operacional" : "Sem licença operacional",
    };
  });
  const compliant = rows.filter((row) => row.compliant).length;
  const conflict = rows.filter((row) => row.conflict).length;
  const missing = rows.length - compliant - conflict;
  const percent = rows.length ? Math.round((compliant / rows.length) * 100) : 0;
  return { rows, total: rows.length, compliant, conflict, missing, percent };
}

function renderEnvironmentalLegalCompliance() {
  const current = environmentalLegalComplianceSnapshot(new Date());
  if (field("environmental-legal-compliance-percent")) field("environmental-legal-compliance-percent").textContent = `${current.percent}%`;
  if (field("environmental-legal-total")) field("environmental-legal-total").textContent = current.total;
  if (field("environmental-legal-ok")) field("environmental-legal-ok").textContent = current.compliant;
  if (field("environmental-legal-missing")) field("environmental-legal-missing").textContent = current.missing;
  if (field("environmental-legal-conflict")) field("environmental-legal-conflict").textContent = current.conflict;

  const chart = field("environmental-legal-compliance-chart");
  if (chart) {
    const points = Array.from({ length: 6 }, (_, index) => {
      const reference = index === 0 ? new Date() : endOfMonthReference(index);
      return {
        label: index === 0 ? "Atual" : monthShortLabel(reference),
        percent: environmentalLegalComplianceSnapshot(reference).percent,
      };
    });
    chart.innerHTML = points
      .map((point) => `
        <div class="compliance-bar-item">
          <div class="compliance-bar-track">
            <span style="height: ${point.percent}%"></span>
          </div>
          <strong>${point.percent}%</strong>
          <small>${point.label}</small>
        </div>
      `)
      .join("");
  }

  const tableRows = current.rows.map((row) => {
    const licenseLabel = row.licenses.length
      ? row.licenses.map((license) => `${operationalLicenseCode(license)} ${license.number || ""}`.trim()).join(", ")
      : "Nenhuma LAC, LAS ou LO ativa";
    const pill = row.compliant ? "green" : row.conflict ? "red" : "yellow";
    return [
      escapeHtml(row.enterprise.name),
      escapeHtml(row.enterprise.company || "Empresa não informada"),
      escapeHtml(licenseLabel),
      `<span class="pill ${pill}">${row.status}</span>`,
    ];
  });
  renderDashboardTable("environmental-legal-compliance-table", ["Empreendimento", "Empresa", "Licença operacional", "Conformidade"], tableRows, "Nenhum empreendimento com módulo ambiental vinculado");
}

function renderEnvironmentalReserveDashboard() {
  const ruralProperties = properties.filter((property) => property.type === "rural");
  const totals = ruralProperties.reduce(
    (acc, property) => {
      acc.area += Number(property.ruralArea || 0);
      acc.reserve += Number(property.legalReserve || 0);
      return acc;
    },
    { area: 0, reserve: 0 },
  );
  const required = totals.area * 0.2;
  const reservePercent = totals.area ? Math.round((totals.reserve / totals.area) * 100) : 0;
  const reserveRatio = totals.area ? Math.min(100, (totals.reserve / totals.area) * 100) : 0;
  const requiredRatio = totals.area ? Math.min(100, (required / totals.area) * 100) : 0;

  if (field("environmental-reserve-percent")) {
    field("environmental-reserve-percent").textContent = `${reservePercent}%`;
    field("environmental-reserve-percent").className = `pill ${totals.reserve >= required ? "green" : "yellow"}`;
  }
  if (field("environmental-reserve-properties")) field("environmental-reserve-properties").textContent = ruralProperties.length;
  if (field("environmental-reserve-total-area")) field("environmental-reserve-total-area").textContent = formatAreaM2(totals.area);
  if (field("environmental-reserve-total-area-reserved")) field("environmental-reserve-total-area-reserved").textContent = formatAreaM2(totals.reserve);
  if (field("environmental-reserve-required-area")) field("environmental-reserve-required-area").textContent = formatAreaM2(required);

  const chart = field("environmental-reserve-chart");
  if (chart) {
    const bars = [
      { label: "Área total", percent: totals.area ? 100 : 0, value: formatAreaM2(totals.area), tone: "total" },
      { label: "Reserva legal", percent: reserveRatio, value: formatAreaM2(totals.reserve), tone: totals.reserve >= required ? "ok" : "warning" },
      { label: "Mínimo 20%", percent: requiredRatio, value: formatAreaM2(required), tone: "required" },
    ];
    chart.innerHTML = bars
      .map((bar) => `
        <div class="compliance-bar-item reserve-bar-item">
          <div class="compliance-bar-track reserve-${bar.tone}">
            <span style="height: ${bar.percent}%"></span>
          </div>
          <strong>${bar.value}</strong>
          <small>${bar.label}</small>
        </div>
      `)
      .join("");
  }

  const rows = ruralProperties.map((property) => {
    const requiredByProperty = propertyReserveRequired(property);
    const reserve = Number(property.legalReserve || 0);
    const percent = Number(property.ruralArea || 0) ? Math.round((reserve / Number(property.ruralArea || 0)) * 100) : 0;
    return [
      escapeHtml(`Matrícula ${property.registration || "Não informada"}`),
      escapeHtml(propertyOwnerLabel(property)),
      escapeHtml(formatAreaM2(property.ruralArea)),
      escapeHtml(`${formatAreaM2(reserve)} (${percent}%)`),
      `<span class="pill ${reserve >= requiredByProperty ? "green" : "yellow"}">${reserve >= requiredByProperty ? "Conforme" : "Abaixo de 20%"}</span>`,
    ];
  });
  renderDashboardTable("environmental-reserve-table", ["Imóvel", "Proprietário", "Área total", "Reserva legal", "Status"], rows, "Nenhum imóvel rural cadastrado");
}

function renderIptuDashboard() {
  const urbanProperties = properties.filter((property) => property.type === "urban");
  const missingRegistration = urbanProperties.filter((property) => !property.municipalRegistration);
  const linkedCities = new Set(properties.map((property) => property.city).filter(Boolean));
  if (field("iptu-dashboard-properties")) field("iptu-dashboard-properties").textContent = properties.length;
  if (field("iptu-dashboard-urban")) field("iptu-dashboard-urban").textContent = urbanProperties.length;
  if (field("iptu-dashboard-missing")) field("iptu-dashboard-missing").textContent = missingRegistration.length;
  if (field("iptu-dashboard-cities")) field("iptu-dashboard-cities").textContent = linkedCities.size;
  const rows = urbanProperties.slice(0, 8).map((property) => [
    escapeHtml(`Matrícula ${property.registration || "Não informada"}`),
    escapeHtml(property.city || "Cidade não informada"),
    escapeHtml(property.municipalRegistration || "Sem inscrição"),
    `<span class="pill ${property.municipalRegistration ? "green" : "yellow"}">${property.municipalRegistration ? "Cadastrado" : "Revisar"}</span>`,
  ]);
  renderDashboardTable("iptu-dashboard-table", ["Imóvel", "Cidade", "Inscrição", "Status"], rows, "Nenhum imóvel urbano cadastrado");
}

function renderScheduleDashboard() {
  const today = dateKey(new Date());
  const weekLimit = dateKey(new Date(Date.now() + 7 * 86400000));
  const pendingEvents = agendaEvents.filter((event) => event.status !== "Concluído");
  const weekEvents = pendingEvents.filter((event) => event.date >= today && event.date <= weekLimit);
  const lateEvents = pendingEvents.filter((event) => event.date < today);
  const waitingAlerts = alertHistoryItems.filter((item) => ["waiting", "scheduled", "aguardando"].includes(String(item.status || "").toLowerCase()));
  if (field("agenda-dashboard-total")) field("agenda-dashboard-total").textContent = pendingEvents.length;
  if (field("agenda-dashboard-week")) field("agenda-dashboard-week").textContent = weekEvents.length;
  if (field("agenda-dashboard-late")) field("agenda-dashboard-late").textContent = lateEvents.length;
  if (field("agenda-dashboard-alerts")) field("agenda-dashboard-alerts").textContent = waitingAlerts.length;
  const rows = [...pendingEvents]
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 8)
    .map((event) => [
      escapeHtml(event.title || "Agendamento"),
      escapeHtml(formatAgendaDate(event.date)),
      escapeHtml(event.time || "09:00"),
      `<span class="pill ${event.date < today ? "red" : event.date <= weekLimit ? "yellow" : "green"}">${event.date < today ? "Atrasado" : "Programado"}</span>`,
    ]);
  renderDashboardTable("agenda-dashboard-table", ["Agendamento", "Data", "Hora", "Status"], rows, "Nenhum agendamento pendente");
}

function looksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

const DEFAULT_ORGANIZATION_NAME = "Grupo Carminatti";
let cachedOrganizationId = null;

async function defaultOrganizationId() {
  if (cachedOrganizationId) return cachedOrganizationId;
  if (!window.DocGestorDB) return null;
  try {
    const rows = await window.DocGestorDB.list("organizations", "select=id,name&limit=1");
    if (rows[0]?.id) {
      cachedOrganizationId = rows[0].id;
      return cachedOrganizationId;
    }
    const [created] = await window.DocGestorDB.create("organizations", {
      name: DEFAULT_ORGANIZATION_NAME,
      exclusive_label: "DocGestor",
      status: "Ativa",
    });
    cachedOrganizationId = created?.id || null;
    return cachedOrganizationId;
  } catch (error) {
    console.warn("Não foi possível obter a organização padrão no Supabase.", error.message);
    return null;
  }
}

function updateLocalId(collection, oldId, newId) {
  if (!newId || sameId(oldId, newId)) return;
  const item = collection.find((record) => sameId(record.id, oldId));
  if (item) item.id = newId;
}

function partnerIdByName(name) {
  return partners.find((partner) => partner.name === name)?.id || null;
}

function companyIdByName(name) {
  return companies.find((company) => company.name === name)?.id || null;
}

function companyIdByCnpj(cnpj) {
  return companies.find((company) => company.cnpj === cnpj)?.id || null;
}

function propertyIdByLabel(label) {
  const registration = String(label || "").replace(/^Matrícula\s+/i, "").trim();
  return properties.find((property) => property.registration === registration || `Matrícula ${property.registration}` === label)?.id || null;
}

function enterpriseIdByName(name) {
  return enterprises.find((enterprise) => enterprise.name === name)?.id || null;
}

function licenseTypeIdByName(name) {
  return environmentalLicenseTypes.find((license) => license.name === name)?.id || null;
}

function statusToSupabase(status) {
  return {
    open: "open",
    pending: "pending",
    expired: "expired",
    done: "done",
  }[status] || "open";
}

function documentIdByName(name) {
  return environmentalDocuments.find((documentItem) => documentItem.name === name)?.id || null;
}

async function persistDelete(table, id, label) {
  if (!window.DocGestorDB || !looksLikeUuid(id)) return;
  try {
    await cleanupBeforeDelete(table, id);
    await window.DocGestorDB.remove(table, id);
    return true;
  } catch (error) {
    console.warn(`Não foi possível excluir ${label} no Supabase.`, error.message);
    showSystemMessage(
      `Não foi possível excluir ${label} no banco de dados: ${error.message}`,
      "Exclusão não concluída",
    );
    return false;
  }
}

async function cleanupBeforeDelete(table, id) {
  const encodedId = encodeURIComponent(id);
  const removalsByTable = {
    app_users: [
      ["user_permissions", `user_id=eq.${encodedId}`],
      ["alert_recipient_modules", `recipient_id=eq.${encodedId}`],
    ],
    partners: [
      ["company_partners", `partner_id=eq.${encodedId}`],
    ],
    companies: [
      ["company_partners", `company_id=eq.${encodedId}`],
    ],
    properties: [
      ["enterprise_properties", `property_id=eq.${encodedId}`],
    ],
    enterprises: [
      ["enterprise_modules", `enterprise_id=eq.${encodedId}`],
      ["enterprise_properties", `enterprise_id=eq.${encodedId}`],
      ["activity_enterprises", `enterprise_id=eq.${encodedId}`],
    ],
    activities: [
      ["activity_enterprises", `activity_id=eq.${encodedId}`],
    ],
    environmental_license_types: [
      ["environmental_license_type_phases", `license_type_id=eq.${encodedId}`],
      ["environmental_document_license_types", `license_type_id=eq.${encodedId}`],
    ],
    environmental_documents: [
      ["environmental_document_license_types", `document_id=eq.${encodedId}`],
      ["environmental_checklist_model_documents", `document_id=eq.${encodedId}`],
    ],
    environmental_checklist_models: [
      ["environmental_checklist_model_documents", `checklist_model_id=eq.${encodedId}`],
    ],
    alert_recipients: [
      ["alert_recipient_modules", `recipient_id=eq.${encodedId}`],
    ],
  };
  const removals = removalsByTable[table] || [];
  await Promise.all(removals.map(([relatedTable, query]) => window.DocGestorDB.removeWhere(relatedTable, query).catch(() => null)));
}

async function persistPartner(partner, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const payload = {
    organization_id: organizationId,
    name: partner.name,
    document: partner.document,
    role: partner.role,
    contact: partner.contact,
    phone: partner.phone,
    status: partner.status,
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(partner.id)) {
      [saved] = await window.DocGestorDB.update("partners", partner.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("partners", payload);
    }
    if (saved?.id) {
      updateLocalId(partners, partner.id, saved.id);
      partner.id = saved.id;
      selectedPartnerId = saved.id;
      renderPartners();
    }
  } catch (error) {
    console.warn("Não foi possível salvar o sócio no Supabase.", error.message);
    alert(`Não foi possível salvar o sócio no banco: ${error.message}`);
  }
}

async function persistCompany(company, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const parentId = company.kind === "branch" ? company.parentId : null;
  if (company.kind === "branch" && !looksLikeUuid(parentId)) {
    alert("Não foi possível salvar a filial no banco porque a matriz ainda não possui ID válido no Supabase.");
    return;
  }
  const payload = {
    organization_id: organizationId,
    kind: company.kind,
    parent_id: company.kind === "branch" && looksLikeUuid(parentId) ? parentId : null,
    name: company.name,
    cnpj: company.cnpj,
    trade_name: company.tradeName,
    status: company.status,
    show_branches: company.showBranches ?? true,
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(company.id)) {
      [saved] = await window.DocGestorDB.update("companies", company.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("companies", payload);
    }
    if (saved?.id) {
      updateLocalId(companies, company.id, saved.id);
      company.id = saved.id;
      selectedCompanyId = saved.id;
      await window.DocGestorDB.removeWhere("company_partners", `company_id=eq.${encodeURIComponent(saved.id)}`);
      const partnerIds = company.partners.map(partnerIdByName).filter(looksLikeUuid);
      await Promise.all(partnerIds.map((partnerId) => window.DocGestorDB.create("company_partners", {
        company_id: saved.id,
        partner_id: partnerId,
        role: "Sócio",
      })));
      populateCompanyParents();
      renderCompanies();
    }
  } catch (error) {
    console.warn("Não foi possível salvar a empresa no Supabase.", error.message);
    alert(`Não foi possível salvar a empresa no banco: ${error.message}`);
  }
}

async function persistCity(city, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const payload = {
    organization_id: organizationId,
    name: city.name,
    state: city.state,
    status: "Ativa",
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(city.id)) {
      [saved] = await window.DocGestorDB.update("cities", city.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("cities", payload);
    }
    if (saved?.id) {
      updateLocalId(cities, city.id, saved.id);
      city.id = saved.id;
      selectedCityId = saved.id;
      renderCities();
    }
  } catch (error) {
    console.warn("Não foi possível salvar a cidade no Supabase.", error.message);
    alert(`Não foi possível salvar a cidade no banco: ${error.message}`);
  }
}

async function persistProperty(property, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const ownerPartnerId = property.ownerType === "pf" ? partnerIdByName(property.owner) : null;
  const ownerCompanyId = property.ownerType === "pj" ? companyIdByName(property.owner) : null;
  const cityId = property.cityId || cityIdByLabel(property.city);
  if ((property.ownerType === "pf" && !looksLikeUuid(ownerPartnerId)) || (property.ownerType === "pj" && !looksLikeUuid(ownerCompanyId))) {
    alert("Não foi possível salvar o imóvel no banco porque o proprietário ainda não possui ID válido no Supabase.");
    return;
  }
  const payload = {
    organization_id: organizationId,
    owner_type: property.ownerType,
    owner_partner_id: property.ownerType === "pf" ? ownerPartnerId : null,
    owner_company_id: property.ownerType === "pj" ? ownerCompanyId : null,
    type: property.type,
    registration: property.registration,
    reference: property.reference,
    address: property.address,
    city_id: looksLikeUuid(cityId) ? cityId : null,
    lot: property.lot,
    block: property.type === "urban" ? property.block : null,
    glebe: property.type === "rural" ? property.glebe : null,
    car_number: property.type === "rural" ? property.carNumber : null,
    ccir_incra_number: property.type === "rural" ? property.ccirIncra : null,
    urban_property_registration: property.type === "urban" ? property.municipalRegistration : null,
    urban_area_m2: property.type === "urban" ? Number(property.urbanArea || 0) : null,
    rural_area_m2: property.type === "rural" ? Number(property.ruralArea || 0) : null,
    legal_reserve_m2: property.type === "rural" ? Number(property.legalReserve || 0) : null,
    app_area_m2: property.type === "rural" ? Number(property.appArea || 0) : null,
    use_type: property.type === "rural" ? property.ruralUse : null,
    has_construction: Boolean(property.hasConstruction),
    construction_area_m2: Number(property.constructionArea || 0),
    status: property.status,
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(property.id)) {
      [saved] = await window.DocGestorDB.update("properties", property.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("properties", payload);
    }
    if (saved?.id) {
      updateLocalId(properties, property.id, saved.id);
      property.id = saved.id;
      selectedPropertyId = saved.id;
      renderProperties();
    }
  } catch (error) {
    console.warn("Não foi possível salvar o imóvel no Supabase.", error.message);
    alert(`Não foi possível salvar o imóvel no banco: ${error.message}`);
  }
}

async function persistEnterprise(enterprise, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const companyId = companyIdByName(enterprise.company);
  const selectedPropertyIds = (enterprise.propertyIds || []).filter(looksLikeUuid);
  const propertyId = selectedPropertyIds[0] || propertyIdByLabel(enterprise.property);
  const responsibleId = partnerIdByName(enterprise.responsible);
  if (!looksLikeUuid(companyId) || !looksLikeUuid(propertyId)) {
    alert("Não foi possível salvar o empreendimento no banco porque empresa ou imóvel ainda não possui ID válido no Supabase.");
    return;
  }
  const payload = {
    organization_id: organizationId,
    name: enterprise.name,
    company_id: companyId,
    property_id: propertyId,
    type: enterprise.type,
    status: enterprise.status,
    responsible_partner_id: looksLikeUuid(responsibleId) ? responsibleId : null,
    reference: enterprise.reference,
    potential_polluter: Boolean(enterprise.potentialPolluter),
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(enterprise.id)) {
      [saved] = await window.DocGestorDB.update("enterprises", enterprise.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("enterprises", payload);
    }
    if (saved?.id) {
      updateLocalId(enterprises, enterprise.id, saved.id);
      enterprise.id = saved.id;
      selectedEnterpriseId = saved.id;
      await window.DocGestorDB.removeWhere("enterprise_modules", `enterprise_id=eq.${encodeURIComponent(saved.id)}`);
      await Promise.all(enterpriseModules(enterprise).map((moduleId) => window.DocGestorDB.create("enterprise_modules", {
        enterprise_id: saved.id,
        module_id: moduleId,
      })));
      await window.DocGestorDB.removeWhere("enterprise_properties", `enterprise_id=eq.${encodeURIComponent(saved.id)}`).catch(() => null);
      await Promise.all(selectedPropertyIds.map((selectedPropertyId) => window.DocGestorDB.create("enterprise_properties", {
        enterprise_id: saved.id,
        property_id: selectedPropertyId,
      }).catch(() => null)));
      renderEnterprises();
      populateEnvironmentalProcessSelects();
    }
  } catch (error) {
    console.warn("Não foi possível salvar o empreendimento no Supabase.", error.message);
    alert(`Não foi possível salvar o empreendimento no banco: ${error.message}`);
  }
}

async function persistEnvironmentalLicenseType(licenseType, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const payload = {
    organization_id: organizationId,
    name: licenseType.name,
    code: licenseType.code,
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(licenseType.id)) {
      [saved] = await window.DocGestorDB.update("environmental_license_types", licenseType.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("environmental_license_types", payload);
    }
    if (saved?.id) {
      updateLocalId(environmentalLicenseTypes, licenseType.id, saved.id);
      licenseType.id = saved.id;
      await window.DocGestorDB.removeWhere("environmental_license_type_phases", `license_type_id=eq.${encodeURIComponent(saved.id)}`);
      await Promise.all((licenseType.phases || []).map((phase) => window.DocGestorDB.create("environmental_license_type_phases", {
        license_type_id: saved.id,
        phase,
      })));
      renderEnvironmentalLicenseTypes();
      populateChecklistModelSelects();
    }
  } catch (error) {
    console.warn("Não foi possível salvar o tipo de licença no Supabase.", error.message);
    alert(`Não foi possível salvar o tipo de licença no banco: ${error.message}`);
  }
}

async function persistEnvironmentalDocument(documentItem, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const payload = {
    organization_id: organizationId,
    name: documentItem.name,
    expiration: documentItem.expiration,
    required: documentItem.required,
    document_parameters: documentItem.parameters || "",
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(documentItem.id)) {
      [saved] = await window.DocGestorDB.update("environmental_documents", documentItem.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("environmental_documents", payload);
    }
    if (saved?.id) {
      updateLocalId(environmentalDocuments, documentItem.id, saved.id);
      documentItem.id = saved.id;
      await window.DocGestorDB.removeWhere("environmental_document_license_types", `document_id=eq.${encodeURIComponent(saved.id)}`);
      const licenseIds = (documentItem.licenses || []).map(licenseTypeIdByName).filter(looksLikeUuid);
      await Promise.all(licenseIds.map((licenseTypeId) => window.DocGestorDB.create("environmental_document_license_types", {
        document_id: saved.id,
        license_type_id: licenseTypeId,
      })));
      renderEnvironmentalDocuments();
      populateChecklistModelSelects();
    }
  } catch (error) {
    console.warn("Não foi possível salvar o documento ambiental no Supabase.", error.message);
    alert(`Não foi possível salvar o documento ambiental no banco: ${error.message}`);
  }
}

async function persistActivity(activity, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const companyId = companyIdByCnpj(activity.companyCnpj);
  if (!looksLikeUuid(companyId)) {
    alert("Não foi possível salvar a atividade no banco porque o CNPJ selecionado ainda não possui ID válido no Supabase.");
    return;
  }
  const payload = {
    organization_id: organizationId,
    company_id: companyId,
    name: activity.name,
    cnae: activity.cnae || "",
    ctf_app: Boolean(activity.ctfApp),
    status: "Ativo",
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(activity.id)) {
      [saved] = await window.DocGestorDB.update("activities", activity.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("activities", payload);
    }
    if (saved?.id) {
      updateLocalId(activities, activity.id, saved.id);
      activity.id = saved.id;
      await window.DocGestorDB.removeWhere("activity_enterprises", `activity_id=eq.${encodeURIComponent(saved.id)}`);
      const enterpriseIds = (activity.enterpriseIds || []).filter(looksLikeUuid);
      await Promise.all(enterpriseIds.map((enterpriseId) => window.DocGestorDB.create("activity_enterprises", {
        activity_id: saved.id,
        enterprise_id: enterpriseId,
      })));
      recalcEnterprisePolluterStatus();
      await persistEnterprisePolluterStatus();
      renderActivities();
    }
  } catch (error) {
    console.warn("Não foi possível salvar a atividade no Supabase.", error.message);
    alert(`Não foi possível salvar a atividade no banco: ${error.message}`);
  }
}

async function persistChecklistModel(model, wasExisting) {
  if (!window.DocGestorDB) return;
  const organizationId = await defaultOrganizationId();
  if (!organizationId) return;
  const licenseTypeId = licenseTypeIdByName(model.license);
  if (!looksLikeUuid(licenseTypeId)) {
    alert("Não foi possível salvar o modelo no banco porque o tipo de licença ainda não possui ID válido no Supabase.");
    return;
  }
  const payload = {
    organization_id: organizationId,
    name: model.name,
    license_type_id: licenseTypeId,
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(model.id)) {
      [saved] = await window.DocGestorDB.update("environmental_checklist_models", model.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("environmental_checklist_models", payload);
    }
    if (saved?.id) {
      updateLocalId(checklistModelsAdmin, model.id, saved.id);
      model.id = saved.id;
      await window.DocGestorDB.removeWhere("environmental_checklist_model_documents", `checklist_model_id=eq.${encodeURIComponent(saved.id)}`);
      const documentIds = (model.documents || []).map(documentIdByName).filter(looksLikeUuid);
      await Promise.all(documentIds.map((documentId, index) => window.DocGestorDB.create("environmental_checklist_model_documents", {
        checklist_model_id: saved.id,
        document_id: documentId,
        display_order: index + 1,
      })));
      renderChecklistModelsAdmin();
    }
  } catch (error) {
    console.warn("Não foi possível salvar o modelo de check-list no Supabase.", error.message);
    alert(`Não foi possível salvar o modelo de check-list no banco: ${error.message}`);
  }
}

async function persistEnvironmentalProcess(process, wasExisting = false) {
  if (!window.DocGestorDB) return false;
  const organizationId = await defaultOrganizationId();
  const companyId = companyIdByName(process.company);
  const branchId = companyIdByName(process.branch);
  const propertyId = propertyIdByLabel(process.property);
  const enterpriseId = enterpriseIdByName(process.enterprise || process.title);
  const responsibleId = partnerIdByName(process.responsible);
  const licenseTypeId = licenseTypeIdByName(process.licenseTypes?.[0] || process.type?.split(" / ")[0]);
  if (![organizationId, companyId, propertyId, licenseTypeId].every(looksLikeUuid)) {
    const missing = [
      !looksLikeUuid(organizationId) ? "organização" : "",
      !looksLikeUuid(companyId) ? "empresa" : "",
      !looksLikeUuid(propertyId) ? "imóvel" : "",
      !looksLikeUuid(licenseTypeId) ? "tipo de licença" : "",
    ].filter(Boolean).join(", ");
    const message = `Processo ambiental não salvo no Supabase. Verifique o cadastro de ${missing}.`;
    console.warn(message);
    alert(message);
    return false;
  }
  const activeLicense = process.activeLicense || {};
  const resolvedExpirationDate = activeLicense.expiryDate || process.acquisitionDueDate || null;
  const currentStage = ensureProcessStages(process).find((stage) => stage.number === process.currentStage) || ensureProcessStages(process)[0] || {};
  const payload = {
    id: looksLikeUuid(process.id) ? process.id : undefined,
    process_id: null,
    organization_id: organizationId,
    enterprise_id: looksLikeUuid(enterpriseId) ? enterpriseId : null,
    company_id: companyId,
    branch_id: looksLikeUuid(branchId) ? branchId : null,
    property_id: propertyId,
    responsible_partner_id: looksLikeUuid(responsibleId) ? responsibleId : null,
    license_type_id: licenseTypeId,
    license_type: process.licenseTypes?.[0] || process.type || "Licença ambiental",
    license_number: activeLicense.number || null,
    process_number: process.internalNumber || process.number,
    process_internal_number: process.internalNumber || process.number,
    licensing_format: process.licensingFormat || "monofasico",
    licensing_format_label: process.licensingFormatLabel || "Monofásico",
    current_stage_number: Number(process.currentStage || 1),
    current_block_number: Number(currentStage.blockNumber || 1),
    stage_number: Number(process.currentStage || currentStage.number || 1),
    stage_name: currentStage.name || "Juntada de documentos",
    block_number: Number(currentStage.blockNumber || 1),
    stage_kind: currentStage.stageKind || "checklist",
    expiration_date: resolvedExpirationDate,
    expiry_date: resolvedExpirationDate,
    acquisition_due_date: process.acquisitionDueDate || null,
    acquisition_alert_time: process.acquisitionAlertTime || "09:00",
    process_due_alert_time: process.acquisitionAlertTime || "09:00",
    renewal_recommended_at: activeLicense.expiryDate ? subtractDaysFromDate(activeLicense.expiryDate, 120) : null,
    status: statusToSupabase(process.status),
    risk_level: process.risk || "",
    progress_percent: Number(process.progress || 0),
    notes: process.notes || process.documents || "",
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(process.id)) {
      [saved] = await window.DocGestorDB.update("environmental_licenses", process.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("environmental_licenses", payload);
    }
    if (saved?.id) {
      updateLocalId(environmentalProcesses, process.id, saved.id);
      process.id = saved.id;
      if (process.activeLicense) process.activeLicense.processId = saved.id;
      await persistEnvironmentalProcessStages(process);
      renderLicenseStatus(currentLicenseStatus);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("Não foi possível salvar o processo ambiental no Supabase.", error.message);
    alert(`Não foi possível salvar o processo ambiental no banco: ${error.message}`);
    return false;
  }
}

async function persistEnvironmentalProcessStages(process) {
  if (!window.DocGestorDB || !looksLikeUuid(process.id)) return;
  try {
    await window.DocGestorDB.removeWhere("environmental_process_stage_deadlines", `process_id=eq.${encodeURIComponent(process.id)}`);
    await Promise.all(ensureProcessStages(process).map((stage) => window.DocGestorDB.create("environmental_process_stage_deadlines", {
      process_id: process.id,
      stage_number: stage.number,
      stage_name: stage.name,
      block_number: Number(stage.blockNumber || 1),
      stage_kind: stage.stageKind || "checklist",
      validity_date: stage.validityDate || null,
      warning_days: Number(stage.warningDays || 0),
      warning_time: stage.warningTime || "09:00",
      critical_days: Number(stage.criticalDays || 0),
      critical_time: stage.criticalTime || "09:00",
      emergency_days: Number(stage.emergencyDays || 0),
      emergency_time: stage.emergencyTime || "09:00",
      renewal_days: Number(stage.renewalDays || 0),
      renewal_time: stage.renewalTime || "09:00",
      deadline_time: stage.deadlineTime || "09:00",
      status: stage.deadlineStatus || "open",
      completed_at: stage.status === "Concluída" ? new Date().toISOString() : null,
    })));
  } catch (error) {
    console.warn("Não foi possível salvar as etapas do processo no Supabase.", error.message);
  }
}

async function persistSendRecipient(recipient, wasExisting) {
  if (!window.DocGestorDB) return;
  const basePayload = {
    name: recipient.name,
    email: recipient.email,
    relation: recipient.relation,
    status: recipient.status === "Ativo" ? "active" : "inactive",
    require_read_confirmation: Boolean(recipient.readConfirmation),
  };
  const payload = {
    ...basePayload,
    source: recipient.source || "external",
    user_id: looksLikeUuid(recipient.userId) ? recipient.userId : null,
  };
  try {
    let saved = null;
    if (wasExisting && looksLikeUuid(recipient.id)) {
      [saved] = await window.DocGestorDB.update("alert_recipients", recipient.id, payload);
    } else {
      [saved] = await window.DocGestorDB.create("alert_recipients", payload);
      if (saved?.id) {
        const local = sendRecipients.find((item) => sameId(item.id, recipient.id));
        if (local) local.id = saved.id;
        recipient.id = saved.id;
        selectedSendRecipientId = saved.id;
      }
    }

    const recipientId = saved?.id || recipient.id;
    if (!looksLikeUuid(recipientId)) return;
    await window.DocGestorDB.removeWhere("alert_recipient_modules", `recipient_id=eq.${encodeURIComponent(recipientId)}`);
    await Promise.all(sendRecipientModules(recipient).map((moduleId) => window.DocGestorDB.create("alert_recipient_modules", {
      recipient_id: recipientId,
      module_id: moduleId,
    })));
    renderSendRecipients();
  } catch (error) {
    if (/source|user_id/i.test(error.message || "")) {
      try {
        let saved = null;
        if (wasExisting && looksLikeUuid(recipient.id)) {
          [saved] = await window.DocGestorDB.update("alert_recipients", recipient.id, basePayload);
        } else {
          [saved] = await window.DocGestorDB.create("alert_recipients", basePayload);
        }
        if (saved?.id) {
          const local = sendRecipients.find((item) => sameId(item.id, recipient.id));
          if (local) local.id = saved.id;
          recipient.id = saved.id;
        }
        const recipientId = saved?.id || recipient.id;
        if (looksLikeUuid(recipientId)) {
          await window.DocGestorDB.removeWhere("alert_recipient_modules", `recipient_id=eq.${encodeURIComponent(recipientId)}`);
          await Promise.all(sendRecipientModules(recipient).map((moduleId) => window.DocGestorDB.create("alert_recipient_modules", {
            recipient_id: recipientId,
            module_id: moduleId,
          })));
        }
        renderSendRecipients();
        return;
      } catch (fallbackError) {
        console.warn("Não foi possível salvar o e-mail de alerta no Supabase.", fallbackError.message);
        showSystemMessage(`Não foi possível salvar o e-mail de alerta no banco: ${fallbackError.message}`, "Envios não atualizados");
        return;
      }
    }
    console.warn("Não foi possível salvar o e-mail de alerta no Supabase.", error.message);
    showSystemMessage(`Não foi possível salvar o e-mail de alerta no banco: ${error.message}`, "Envios não atualizados");
  }
}

async function syncUserAlertRecipient(user) {
  if (!window.DocGestorDB || !user?.email || !looksLikeUuid(user.id)) return;
  const moduleIds = availableAlertModules.filter((module) => userHasModuleAccess(user, module.id)).map((module) => module.id);
  const existing = findAutomaticRecipientForUser(user);
  if (!moduleIds.length) {
    if (existing && recipientIsAutomatic(existing)) {
      existing.status = "Inativo";
      existing.modules = [];
      await persistSendRecipient(existing, looksLikeUuid(existing.id));
    }
    return;
  }
  const recipient = existing || {
    id: Date.now(),
    sent: 0,
    read: 0,
  };
  Object.assign(recipient, {
    userId: user.id,
    name: user.name,
    email: user.email,
    modules: moduleIds,
    relation: "Usuário do sistema",
    status: String(user.status || "Ativo") === "Ativo" ? normalizeRecipientStatus(existing?.status || "Ativo") : "Inativo",
    readConfirmation: recipient.readConfirmation ?? true,
    source: "user",
  });
  if (!existing) sendRecipients.push(recipient);
  await persistSendRecipient(recipient, looksLikeUuid(recipient.id));
}

async function syncUserAlertRecipients() {
  if (!window.DocGestorDB) return;
  for (const user of users) {
    await syncUserAlertRecipient(user);
  }
  renderSendRecipients();
}

async function loadSupabaseData() {
  const [
    partnerRows,
    companyRows,
    companyPartnerRows,
    cityRows,
    propertyRows,
    enterpriseRows,
    enterpriseModuleRows,
    enterprisePropertyRows,
    activityRows,
    activityEnterpriseRows,
    licenseTypeRows,
    phaseRows,
    documentRows,
    documentLicenseRows,
    checklistRows,
    checklistDocumentRows,
    licenseRows,
    stageDeadlineRows,
    appModuleRows,
    diverseReminderRows,
    alertRecipientRows,
    alertRecipientModuleRows,
    agendaRows,
    alertHistoryRows,
    userRows,
    backupRows,
    systemEmailRows,
  ] = await Promise.all([
    dbList("partners"),
    dbList("companies"),
    dbList("company_partners"),
    dbList("cities"),
    dbList("properties"),
    dbList("enterprises"),
    dbList("enterprise_modules"),
    dbList("enterprise_properties"),
    dbList("activities"),
    dbList("activity_enterprises"),
    dbList("environmental_license_types"),
    dbList("environmental_license_type_phases"),
    dbList("environmental_documents"),
    dbList("environmental_document_license_types"),
    dbList("environmental_checklist_models"),
    dbList("environmental_checklist_model_documents"),
    dbList("environmental_licenses"),
    dbList("environmental_process_stage_deadlines"),
    dbList("app_modules"),
    dbList("diverse_reminders"),
    dbList("alert_recipients"),
    dbList("alert_recipient_modules"),
    dbList("agenda_events"),
    dbList("alert_history", "select=*&order=created_at.desc"),
    dbList("app_users"),
    dbList("system_backup_configs", "select=*&order=updated_at.desc&limit=1"),
    dbList("system_email_configs", "select=*&order=updated_at.desc&limit=1"),
  ]);

  const partnerById = Object.fromEntries(partnerRows.map((row) => [row.id, row]));
  const companyById = Object.fromEntries(companyRows.map((row) => [row.id, row]));
  const cityByRowId = Object.fromEntries(cityRows.map((row) => [row.id, row]));
  const propertyById = Object.fromEntries(propertyRows.map((row) => [row.id, row]));
  const licenseTypeById = Object.fromEntries(licenseTypeRows.map((row) => [row.id, row]));
  const documentById = Object.fromEntries(documentRows.map((row) => [row.id, row]));

  if (appModuleRows.length) {
    const loadedModules = appModuleRows
      .filter((row) => row.is_active !== false && !row.is_admin_area)
      .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
      .map((row) => ({
        id: row.code || row.id,
        name: row.name,
      }));
    const mergedModules = [...loadedModules];
    defaultSystemModules.forEach((module) => {
      if (!mergedModules.some((item) => item.id === module.id)) mergedModules.push(module);
    });
    availableAlertModules.splice(
      0,
      availableAlertModules.length,
      ...mergedModules,
    );
  }

  partners = partnerRows.map((row) => ({
    id: row.id,
    name: row.name,
    document: row.document,
    role: row.role,
    contact: row.contact || "",
    phone: row.phone || "",
    status: row.status || "Ativo",
  }));

  companies = companyRows.map((row) => ({
    id: row.id,
    kind: row.kind,
    name: row.name,
    cnpj: row.cnpj,
    tradeName: row.trade_name || "",
    status: row.status || "Ativa",
    partners: companyPartnerRows.filter((link) => sameId(link.company_id, row.id)).map((link) => partnerById[link.partner_id]?.name).filter(Boolean),
    parentId: row.parent_id,
    showBranches: row.show_branches ?? true,
  }));

  cities = cityRows.map((row) => ({
    id: row.id,
    name: row.name,
    state: row.state,
    status: row.status || "Ativa",
  }));

  properties = propertyRows.map((row) => {
    const ownerRow = row.owner_type === "pf" ? partnerById[row.owner_partner_id] : companyById[row.owner_company_id];
    const cityRow = cityByRowId[row.city_id];
    return {
      id: row.id,
      ownerType: row.owner_type,
      ownerPartnerId: row.owner_partner_id || "",
      ownerCompanyId: row.owner_company_id || "",
      owner: ownerRow?.name || "Proprietário não encontrado",
      type: row.type,
      registration: row.registration,
      reference: row.reference || "",
      address: row.address || "",
      cityId: row.city_id || "",
      city: cityRow ? `${cityRow.name}/${cityRow.state}` : "",
      lot: row.lot || "",
      block: row.block || "",
      glebe: row.glebe || "",
      municipalRegistration: row.urban_property_registration || "",
      carNumber: row.car_number || "",
      ccirIncra: row.ccir_incra_number || "",
      urbanArea: Number(row.urban_area_m2 || 0),
      ruralArea: Number(row.rural_area_m2 || 0),
      legalReserve: Number(row.legal_reserve_m2 || 0),
      appArea: Number(row.app_area_m2 || 0),
      ruralUse: row.use_type || "",
      hasConstruction: Boolean(row.has_construction),
      constructionArea: Number(row.construction_area_m2 || 0),
      status: row.status || "Ativo",
    };
  });

  enterprises = enterpriseRows.map((row) => ({
    id: row.id,
    name: row.name,
    company: companyById[row.company_id]?.name || "Empresa não encontrada",
    property: propertyById[row.property_id] ? `Matrícula ${propertyById[row.property_id].registration}` : "Imóvel não encontrado",
    propertyOwnerCompany: propertyById[row.property_id]?.owner_company_id ? companyById[propertyById[row.property_id].owner_company_id]?.name : companyById[row.company_id]?.name || "",
    propertyIds: [
      ...enterprisePropertyRows.filter((link) => sameId(link.enterprise_id, row.id)).map((link) => link.property_id),
      row.property_id,
    ].filter(Boolean).filter((id, index, all) => all.findIndex((item) => sameId(item, id)) === index),
    type: row.type || "",
    status: row.status || "Planejado",
    responsible: partnerById[row.responsible_partner_id]?.name || "",
    reference: row.reference || "",
    potentialPolluter: Boolean(row.potential_polluter),
    modules: enterpriseModuleRows
      .filter((link) => sameId(link.enterprise_id, row.id))
      .map((link) => normalizeAlertModuleId(link.module_id, appModuleRows)),
  }));

  activities = activityRows.map((row) => ({
    id: row.id,
    name: row.name,
    cnae: row.cnae || "",
    companyCnpj: companyById[row.company_id]?.cnpj || "",
    ctfApp: Boolean(row.ctf_app),
    status: row.status || "Ativo",
    enterpriseIds: activityEnterpriseRows.filter((link) => sameId(link.activity_id, row.id)).map((link) => link.enterprise_id),
  }));

  recalcEnterprisePolluterStatus();

  environmentalLicenseTypes = licenseTypeRows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code || "",
    validity: row.validity || "",
    renewal: row.renewal || "",
    phases: phaseRows.filter((phase) => sameId(phase.license_type_id, row.id)).map((phase) => phase.phase),
  }));

  environmentalDocuments = documentRows.map((row) => ({
    id: row.id,
    name: row.name,
    expiration: row.expiration || "Nao",
    required: row.required || "Sim",
    parameters: row.document_parameters || "",
    licenses: documentLicenseRows.filter((link) => sameId(link.document_id, row.id)).map((link) => licenseTypeById[link.license_type_id]?.name).filter(Boolean),
  }));

  checklistModelsAdmin = checklistRows.map((row) => ({
    id: row.id,
    name: row.name,
    license: licenseTypeById[row.license_type_id]?.name || "",
    documents: checklistDocumentRows.filter((link) => sameId(link.checklist_model_id, row.id)).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((link) => documentById[link.document_id]?.name).filter(Boolean),
  }));

  checklistModels = checklistModelsAdmin.reduce((acc, model) => {
    acc[model.license] = model.documents.map((name) => [name, `Checklist: ${model.name}`, true]);
    return acc;
  }, {});

  environmentalProcesses = licenseRows.map((row) => {
    const status = daysUntil(row.expiration_date) !== null && daysUntil(row.expiration_date) <= 0 ? "expired" : statusFromSupabase(row.status);
    const licenseType = licenseTypeById[row.license_type_id]?.name || "Licença ambiental";
    const company = companyById[row.company_id]?.name || "Empresa não encontrada";
    const property = propertyById[row.property_id] ? `Matrícula ${propertyById[row.property_id].registration}` : "";
    const process = {
      id: row.id,
      internalNumber: row.process_number || row.license_number || "Sem número",
      licensingFormat: "monofasico",
      licensingFormatLabel: "Monofasico",
      number: row.license_number || row.process_number || "Sem número",
      title: enterprises.find((enterprise) => sameId(enterprise.id, row.enterprise_id))?.name || company,
      enterpriseId: row.enterprise_id || "",
      company,
      type: licenseType,
      licenseTypes: [licenseType],
      agency: row.environmental_agency || "",
      status,
      statusLabel: processStatusLabel(status),
      risk: row.risk_level || "",
      due: row.expiration_date ? `Vence em ${formatAgendaDate(row.expiration_date)}` : "Sem vencimento cadastrado",
      acquisitionDueDate: row.license_number ? "" : row.expiration_date || "",
      acquisitionAlertTime: row.process_due_alert_time || "09:00",
      responsible: partnerById[row.responsible_partner_id]?.name || "",
      progress: Number(row.progress_percent || 0),
      documents: row.notes || "",
      property,
      notes: row.notes || "",
      activeLicense: row.license_number
        ? {
            id: row.id,
            processId: row.id,
            enterpriseId: row.enterprise_id || "",
            processNumber: row.process_number || row.license_number,
            stageNumber: 3,
            type: licenseType,
            number: row.license_number,
            expiryDate: row.expiration_date,
            company,
            title: enterprises.find((enterprise) => sameId(enterprise.id, row.enterprise_id))?.name || company,
            responsible: partnerById[row.responsible_partner_id]?.name || "",
            status: status === "expired" ? "Vencida" : "Ativa",
          }
        : null,
    };
    const savedStages = stageDeadlineRows.filter((stageRow) => sameId(stageRow.process_id, row.id));
    if (savedStages.length) {
      process.stages = processStagesForFormat(process.licensingFormat);
      savedStages.forEach((stageRow) => {
        const stage = process.stages.find((item) => item.number === Number(stageRow.stage_number));
        if (!stage) return;
        stage.name = stageRow.stage_name || stage.name;
        stage.blockNumber = Number(stageRow.block_number || stage.blockNumber || 1);
        stage.stageKind = stageRow.stage_kind || stage.stageKind || "checklist";
        stage.validityDate = stageRow.validity_date || "";
        stage.warningDays = Number(stageRow.warning_days || 60);
        stage.warningTime = stageRow.warning_time || "09:00";
        stage.criticalDays = Number(stageRow.critical_days || 15);
        stage.criticalTime = stageRow.critical_time || "09:00";
        stage.emergencyDays = Number(stageRow.emergency_days || 3);
        stage.emergencyTime = stageRow.emergency_time || "09:00";
        stage.renewalDays = Number(stageRow.renewal_days || 120);
        stage.renewalTime = stageRow.renewal_time || "09:00";
        stage.deadlineTime = stageRow.deadline_time || "09:00";
        stage.deadlineStatus = stageRow.status || "open";
        if (stageRow.completed_at) stage.status = "Concluída";
      });
      const firstOpen = process.stages.find((stage) => stage.status !== "Concluída");
      if (firstOpen) firstOpen.status = "Em andamento";
    }
    return process;
  });

  sendRecipients = alertRecipientRows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    modules: alertRecipientModuleRows
      .filter((link) => sameId(link.recipient_id, row.id))
      .map((link) => normalizeAlertModuleId(link.module_id, appModuleRows)),
    relation: row.relation || "Administrativo",
    status: normalizeRecipientStatus(row.status),
    readConfirmation: row.require_read_confirmation ?? true,
    source: row.source || "external",
    userId: row.user_id || "",
    sent: 0,
    read: 0,
  }));

  diverseReminders = diverseReminderRows.map((row) => ({
    id: row.id,
    name: row.name,
    companyId: row.company_id || "",
    companyLabel: row.company_label || diverseReminderCompanyLabel(row.company_id),
    format: Number(row.alert_format || 1),
    alerts: Array.isArray(row.alerts) ? row.alerts : [],
    repeat: {
      enabled: Boolean(row.repeat_enabled),
      count: Number(row.repeat_count || 1),
      intervalDays: Number(row.repeat_interval_days || 30),
    },
    description: row.description || "",
    status: row.status || "pending",
  }));

  agendaEvents = agendaRows.map((row) => ({
    id: row.id,
    date: row.event_date || row.date,
    time: row.event_time || row.time || "09:00",
    title: row.title || "Agendamento",
    type: row.module_id ? sendModuleLabel(row.module_id) : row.type || "Agenda",
    status: row.status || "green",
    description: row.description || "",
    alertKey: row.alert_key || "",
    relatedId: row.related_id || "",
  })).filter((event) => event.date);

  alertHistoryItems = retainedAlertHistoryRows(alertHistoryRows).map((row) => ({
    id: row.id,
    alert_key: row.alert_key || "",
    subject: row.subject,
    recipient_emails: row.recipient_emails || [],
    sender_email: row.sender_email || systemEmailConfig.address,
    status: row.status || "waiting",
    status_label: row.status_label || "Aguardando",
    related_label: row.related_label || "",
    related_id: row.related_id || "",
    created_at: row.created_at,
    sent_at: row.sent_at,
    resend_email_id: row.resend_email_id || "",
    message_html: row.message_html || "",
    raw_payload: row.raw_payload || {},
  }));
  renderAlertHistory(alertHistoryItems);

  users = userRows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    cpf: row.cpf || "",
    roleTitle: row.role_title || "",
    company: companyById[row.company_id]?.name || "",
    branch: companyById[row.branch_id]?.name || "",
    profile: row.profile || "Consulta",
    status: row.status || "Ativo",
    password: row.password || "123456",
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  }));
  await syncUserAlertRecipients();

  if (backupRows[0]) {
    Object.assign(backupConfig, {
      id: backupRows[0].id,
      enabled: Boolean(backupRows[0].enabled),
      frequency: backupRows[0].frequency || "daily",
      time: backupRows[0].backup_time || "02:00",
      retentionDays: Number(backupRows[0].retention_days || 90),
      weekday: Number(backupRows[0].weekday || 1),
      monthday: Number(backupRows[0].monthday || 1),
      provider: backupRows[0].provider || "supabase",
      destination: backupRows[0].destination || "docgestor-backups/ambiental",
      status: backupRows[0].status || "Configurado",
      lastBackup: backupRows[0].last_backup_at || "",
      nextBackup: backupRows[0].next_backup_at || "",
    });
    if (!backupConfig.nextBackup) backupConfig.nextBackup = computeNextBackupDate(backupConfig);
    persistBackupConfigLocal();
  }

  if (systemEmailRows[0]) {
    applySystemEmailConfigRow(systemEmailRows[0]);
    renderSystemEmailConfig();
  }

  selectedPartnerId = partners[0]?.id ?? 0;
  selectedCompanyId = companies[0]?.id ?? 0;
  selectedCityId = cities[0]?.id ?? 0;
  selectedPropertyId = properties[0]?.id ?? 0;
  selectedEnterpriseId = enterprises[0]?.id ?? 0;
  selectedSendRecipientId = sendRecipients[0]?.id ?? 0;
  selectedUserId = users[0]?.id ?? 0;
  const restoredSession = restoreSessionUser();
  const restoredView = sessionStorage.getItem(SESSION_VIEW_KEY) || "home";
  const restoredLicenseStatus = sessionStorage.getItem(SESSION_LICENSE_STATUS_KEY) || currentLicenseStatus || "general";

  renderUsers();
  renderPartners();
  renderCompanies();
  populateCompanyParents();
  renderCities();
  populatePropertyOwners();
  populatePropertyCities();
  renderProperties();
  populateEnterpriseSelects();
  renderEnterprises();
  populateActivityCompanies();
  renderActivities();
  renderEnvironmentalLicenseTypes();
  renderEnvironmentalDocuments();
  populateChecklistModelSelects();
  renderChecklistModelsAdmin();
  renderSendRecipients();
  renderAgenda();
  renderAgendaNotes();
  renderBackupConfig();
  renderDiverseReminders();
  updateNextProcessNumber();
  renderLicenseStatus(currentLicenseStatus || "general");
  renderDashboard();
  if (restoredSession) {
    if (restoredView === "licencas") openLicenseStatus(restoredLicenseStatus);
    else openView(restoredView);
  }
}

async function processPendingAlertsOnServer() {
  try {
    await fetch("/api/processar-alertas", { method: "POST" });
    const rows = await dbList("alert_history", "select=*&order=created_at.desc");
    if (rows.length) {
      alertHistoryItems = retainedAlertHistoryRows(rows).map((row) => ({
        id: row.id,
        alert_key: row.alert_key || "",
        subject: row.subject,
        recipient_emails: row.recipient_emails || [],
        sender_email: row.sender_email || systemEmailConfig.address,
        status: row.status || "waiting",
        status_label: row.status_label || "Aguardando",
        related_label: row.related_label || "",
        related_id: row.related_id || "",
        created_at: row.created_at,
        sent_at: row.sent_at,
        resend_email_id: row.resend_email_id || "",
        message_html: row.message_html || "",
        raw_payload: row.raw_payload || {},
      }));
      renderAlertHistory(alertHistoryItems);
    }
  } catch (error) {
    console.warn("Não foi possível processar alertas pendentes agora.", error.message);
  }
}

configureDesktopDownloadButton();
renderDashboard();
loadSupabaseData().then(() => {
  processPendingAlertsOnServer();
  window.setInterval(processPendingAlertsOnServer, 60000);
});







