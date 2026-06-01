const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const title = document.querySelector("#page-title");
const adminSubnav = document.querySelector("#admin-subnav");
const moduleSubnav = document.querySelector("#module-subnav");
const agendaSubnav = document.querySelector("#agenda-subnav");

const titles = {
  home: "Home",
  admin: "Painel Admin",
  dashboard: "Painel geral",
  cadastros: "Cadastros",
  modulos: "Modulos",
  licencas: "03.1 Licencas Ambientais",
  usuarios: "Usuarios e permissoes",
  agenda: "04.1 Calendario",
  "agenda-notes": "04.2 Anotacoes",
};

function openView(viewName) {
  const requiredPermission = viewPermission(viewName);
  if (currentUser && !canAccess(requiredPermission)) {
    openView(firstAccessibleView());
    return;
  }
  const parentView = ["cadastros", "usuarios"].includes(viewName) ? "admin" : viewName === "licencas" ? "modulos" : viewName === "agenda-notes" ? "agenda" : viewName;
  navItems.forEach((nav) => nav.classList.toggle("active", nav.dataset.view === parentView));
  views.forEach((view) => view.classList.toggle("active", view.id === viewName));
  title.textContent = titles[viewName];

  if (adminSubnav && parentView !== "admin") {
    adminSubnav.classList.remove("open");
    document.querySelector("[data-admin-menu-toggle]")?.setAttribute("aria-expanded", "false");
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

  if (viewName !== "licencas") {
    document.querySelectorAll("[data-module-license-status]").forEach((item) => item.classList.remove("active"));
  }

  document.querySelectorAll("[data-agenda-target]").forEach((item) => {
    item.classList.toggle("active", item.dataset.agendaTarget === viewName);
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const isAdminToggle = item.hasAttribute("data-admin-menu-toggle");
    const isAdminActive = item.classList.contains("active");
    const wasAdminOpen = adminSubnav?.classList.contains("open");
    const isModuleToggle = item.hasAttribute("data-module-menu-toggle");
    const isModuleActive = item.classList.contains("active");
    const wasModuleOpen = moduleSubnav?.classList.contains("open");
    const isAgendaToggle = item.hasAttribute("data-agenda-menu-toggle");
    const isAgendaActive = item.classList.contains("active");
    const wasAgendaOpen = agendaSubnav?.classList.contains("open");

    openView(item.dataset.view);

    if (isAdminToggle && adminSubnav) {
      const shouldOpen = !isAdminActive || !wasAdminOpen;
      adminSubnav.classList.toggle("open", shouldOpen);
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

  });
});

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

document.querySelectorAll("[data-agenda-target]").forEach((button) => {
  button.addEventListener("click", () => {
    openView(button.dataset.agendaTarget);
    if (agendaSubnav) {
      agendaSubnav.classList.add("open");
      document.querySelector("[data-agenda-menu-toggle]")?.setAttribute("aria-expanded", "true");
    }
  });
});

const agendaEvents = [
  {
    id: 1,
    date: "2026-05-30",
    time: "09:00",
    title: "Conferir documentos - processo 006/2026",
    type: "Ambiental",
    status: "warning",
    description: "Revisar documentos elaborados antes do protocolo.",
  },
  {
    id: 2,
    date: "2026-06-03",
    time: "14:00",
    title: "Protocolo ambiental",
    type: "Licencas Ambientais",
    status: "green",
    description: "Registrar protocolo no acompanhamento do processo.",
  },
  {
    id: 3,
    date: "2026-06-12",
    time: "10:30",
    title: "Vencimento critico - LO 4821/2022",
    type: "Vencimento",
    status: "danger",
    description: "Licenca em prazo critico de renovacao.",
  },
  {
    id: 4,
    date: "2026-06-18",
    time: "16:00",
    title: "Retorno do orgao ambiental",
    type: "Pendencia",
    status: "warning",
    description: "Checar resposta e atualizar etapa do processo.",
  },
];
let nextAgendaEventId = 100;

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
  const key = `${event.date}|${event.title}|${event.type}`;
  const exists = agendaEvents.some((item) => `${item.date}|${item.title}|${item.type}` === key);
  if (exists) return;
  agendaEvents.push({
    id: nextAgendaEventId++,
    time: "09:00",
    status: "green",
    description: "Prazo registrado automaticamente pelo processo ambiental.",
    ...event,
  });
  renderAgenda();
  renderAgendaNotes();
}

function agendaLinkedText(linkedTarget) {
  return linkedTarget?.label || "Nenhum processo ou licenca selecionado.";
}

function updateAgendaLinkBox() {
  const enabled = field("agenda-note-link-enabled")?.checked;
  const box = field("agenda-note-link-box");
  const summary = field("agenda-note-link-summary");
  if (box) box.hidden = !enabled;
  if (summary) summary.textContent = enabled ? agendaLinkedText(agendaLinkSelection) : "Nenhum processo ou licenca selecionado.";
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
  const id = Number(field("agenda-note-id").value);
  const existing = agendaEvents.find((event) => event.id === id);
  const payload = {
    id: Number.isNaN(id) ? nextAgendaEventId++ : id,
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
                ${eventItem.linkedTarget ? `<span>Vinculo: ${eventItem.linkedTarget.label}</span>` : ""}
                <span class="pill ${eventItem.status === "danger" ? "red" : eventItem.status === "warning" ? "yellow" : "green"}">${eventItem.status === "danger" ? "Critico" : eventItem.status === "warning" ? "Atencao" : "Normal"}</span>
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
                <span>${item.type === "license" ? "Licenca" : "Processo"}</span>
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
    : `<article><strong>Nenhum registro</strong><span>Nao ha itens para o filtro selecionado.</span><div></div></article>`;
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
    : `<div class="agenda-empty">Nao ha proximos compromissos.</div>`;
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
  const id = Number(button.dataset.agendaNoteId);
  const eventItem = agendaEvents.find((item) => item.id === id);
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
      const index = agendaEvents.findIndex((item) => item.id === id);
      if (index >= 0) agendaEvents.splice(index, 1);
      renderAgenda();
      renderAgendaNotes();
    });
  }
});
renderAgendaNotes();

const users = [
  {
    id: 0,
    name: "Marina Carminatti",
    email: "marina@grupocarminatti.com",
    phone: "(11) 98888-1200",
    cpf: "123.456.789-10",
    roleTitle: "Coordenadora administrativa",
    company: "Grupo Carminatti",
    branch: "Todas",
    profile: "Administrador do Grupo",
    status: "Ativo",
    password: "123456",
    permissions: ["admin", "dashboard", "modules", "environmental", "agenda", "users", "registries", "adminEnvironmental"],
  },
  {
    id: 1,
    name: "Rafael Almeida",
    email: "rafael@grupocarminatti.com",
    phone: "(11) 97777-4400",
    cpf: "222.333.444-55",
    roleTitle: "Gestor ambiental",
    company: "Carminatti Participacoes S.A.",
    branch: "Unidade Paulinia",
    profile: "Gestor Ambiental",
    status: "Ativo",
    password: "123456",
    permissions: ["dashboard", "modules", "environmental", "agenda"],
  },
  {
    id: 2,
    name: "Clara Martins",
    email: "clara@grupocarminatti.com",
    phone: "(11) 96666-3300",
    cpf: "333.444.555-66",
    roleTitle: "Analista de documentos",
    company: "Carminatti Agroindustrial Ltda",
    branch: "Fazenda Santa Clara",
    profile: "Consulta",
    status: "Convite enviado",
    password: "123456",
    permissions: ["dashboard", "modules", "environmental"],
  },
];

const MASTER_USER = {
  id: "master",
  name: "Admin",
  email: "Admin",
  profile: "Administrador Maximo",
  status: "Ativo",
  permissions: ["admin", "dashboard", "modules", "environmental", "agenda", "users", "registries", "adminEnvironmental"],
  isMaster: true,
};

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
  return users.find((user) => user.id === selectedUserId) || users[0];
}

function defaultPermissionsForProfile(profile) {
  if (profile === "Administrador Geral" || profile === "Administrador do Grupo") {
    return ["admin", "dashboard", "modules", "environmental", "agenda", "users", "registries", "adminEnvironmental"];
  }
  if (profile === "Gestor Ambiental" || profile === "Operador Ambiental") {
    return ["dashboard", "modules", "environmental", "agenda"];
  }
  return ["dashboard", "modules", "environmental"];
}

function userPermissions(user) {
  return user?.permissions?.length ? user.permissions : defaultPermissionsForProfile(user?.profile);
}

function canAccess(permissionKey) {
  if (!permissionKey || permissionKey === "home") return true;
  if (!currentUser) return false;
  return userPermissions(currentUser).includes(permissionKey);
}

function viewPermission(viewName) {
  if (viewName === "admin" || viewName === "usuarios" || viewName === "cadastros") return "admin";
  if (viewName === "dashboard") return "dashboard";
  if (viewName === "modulos") return "modules";
  if (viewName === "licencas") return "environmental";
  if (viewName === "agenda" || viewName === "agenda-notes") return "agenda";
  return "home";
}

function firstAccessibleView() {
  if (canAccess("dashboard")) return "dashboard";
  if (canAccess("environmental")) return "licencas";
  if (canAccess("agenda")) return "agenda";
  if (canAccess("admin")) return "admin";
  return "home";
}

function applyAccessControl() {
  document.querySelectorAll("[data-permission-view]").forEach((element) => {
    element.hidden = !canAccess(element.dataset.permissionView);
  });
  document.querySelectorAll('[data-admin-target="usuarios-admin"]').forEach((element) => {
    element.hidden = !canAccess("users");
  });
  document.querySelectorAll('[data-admin-target="socios-admin"], [data-admin-target="empresas-filiais"], [data-admin-target="imoveis-admin"], [data-admin-target="empreendimentos-admin"]').forEach((element) => {
    element.hidden = !canAccess("registries");
  });
  document.querySelectorAll('[data-admin-target="tipos-licencas"], [data-admin-target="documentos-ambientais"], [data-admin-target="modelos-checklist"]').forEach((element) => {
    element.hidden = !canAccess("adminEnvironmental");
  });
  document.querySelectorAll('[data-admin-target="email-sistema"], [data-admin-target="envios-admin"]').forEach((element) => {
    element.hidden = !canAccess("admin");
  });
  const label = field("current-user-label");
  if (label) label.textContent = currentUser ? `${currentUser.name} - ${currentUser.profile}` : "Usuario";
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
  if (normalized === "admin" && password === "CA123*") return MASTER_USER;
  const user = users.find((item) => [item.email, item.name].some((value) => String(value || "").trim().toLowerCase() === normalized));
  if (!user || user.password !== password) return null;
  if (["Bloqueado", "Inativo"].includes(user.status)) return { blocked: true, user };
  return user;
}

function loginUser(user) {
  currentUser = user;
  document.querySelector("#login-screen")?.setAttribute("hidden", "");
  field("app-shell")?.removeAttribute("hidden");
  applyAccessControl();
  openView("home");
}

function logoutUser() {
  currentUser = null;
  field("app-shell")?.setAttribute("hidden", "");
  document.querySelector("#login-screen")?.removeAttribute("hidden");
  field("login-password").value = "";
  field("login-error").hidden = true;
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
}

function confirmDelete(message, onConfirm) {
  const text = document.querySelector("#generic-delete-text");
  if (text) text.textContent = message;
  genericDeleteCallback = onConfirm;
  openModal("generic-delete-modal");
}

function fillUserForm(user) {
  if (!user) return;
  selectedUserId = user.id;
  field("user-id").value = user.id;
  field("user-name").value = user.name;
  field("user-email").value = user.email;
  field("user-phone").value = user.phone;
  field("user-cpf").value = user.cpf;
  field("user-role-title").value = user.roleTitle;
  field("user-company").value = user.company;
  field("user-branch").value = user.branch;
  field("user-profile").value = user.profile;
  field("user-status").value = user.status;
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
        <article class="user-row ${user.id === selectedUserId ? "selected" : ""}" data-user-id="${user.id}">
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
            <button type="button" data-user-action="permissions" data-user-id="${user.id}">Permissoes</button>
            <button type="button" data-user-action="reset" data-user-id="${user.id}">Redefinir senha</button>
            <button type="button" data-user-action="block" data-user-id="${user.id}">Bloquear</button>
            <button type="button" data-user-action="delete" data-user-id="${user.id}">Excluir</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function saveCurrentUser() {
  const id = Number(field("user-id").value);
  const existing = users.find((user) => user.id === id);
  const payload = {
    id: Number.isNaN(id) ? Date.now() : id,
    name: field("user-name").value,
    email: field("user-email").value,
    phone: field("user-phone").value,
    cpf: field("user-cpf").value,
    roleTitle: field("user-role-title").value,
    company: field("user-company").value,
    branch: field("user-branch").value,
    profile: field("user-profile").value,
    status: field("user-status").value,
    password: existing?.password || "123456",
    permissions: existing?.permissions || defaultPermissionsForProfile(field("user-profile").value),
  };

  if (existing) {
    Object.assign(existing, payload);
    selectedUserId = existing.id;
    addUserLog("Usuario atualizado", `${existing.name} teve cadastro e nivel de acesso revisados.`);
  } else {
    users.push(payload);
    selectedUserId = payload.id;
    addUserLog("Usuario criado", `${payload.name} foi incluido no ambiente do Grupo Carminatti.`);
  }

  renderUsers();
  fillUserForm(selectedUser());
  closeModal("user-modal");
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
  field("user-company").value = "Grupo Carminatti";
  field("user-branch").value = "Todas";
  field("user-profile").value = "Consulta";
  field("user-status").value = "Convite enviado";
  if (permissionUser) permissionUser.textContent = "Novo usuario";
  renderUsers();
  document.querySelector("#user-modal-title").textContent = "Novo usuario";
  openModal("user-modal");
  addUserLog("Novo usuario", "Formulario limpo para cadastrar um novo acesso.");
}

function updateUserStatus(id, status, titleText) {
  const user = users.find((item) => item.id === id);
  if (!user) return;
  user.status = status;
  selectedUserId = id;
  fillUserForm(user);
  renderUsers();
  addUserLog(titleText, `${user.name} agora esta com status: ${status}.`);
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
  if (confirmText) confirmText.textContent = `Deseja Realmente Alterar a Senha do Usuario ${user.name}?`;
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
    loginError("Usuario ou senha invalidos.");
    return;
  }
  if (result.blocked) {
    loginError(`O usuario ${result.user.name} esta ${result.user.status.toLowerCase()}.`);
    return;
  }
  loginUser(result);
});
document.querySelector("#logout-button")?.addEventListener("click", logoutUser);
document.querySelector("#permissions-save")?.addEventListener("click", () => {
  const user = selectedUser();
  user.permissions = readPermissionChecks();
  closeModal("permissions-modal");
  addUserLog("Permissoes salvas", `Permissoes exclusivas atualizadas para ${user.name}.`);
  if (currentUser && currentUser.id === user.id) applyAccessControl();
});
document.querySelector("#confirm-password-reset")?.addEventListener("click", () => {
  const user = users.find((item) => item.id === passwordResetUserId);
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
document.querySelector("#generic-delete-confirm")?.addEventListener("click", () => {
  if (typeof genericDeleteCallback === "function") genericDeleteCallback();
  genericDeleteCallback = null;
  closeModal("generic-delete-modal");
});
userList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-user-action]");
  if (!button) return;
  const id = Number(button.dataset.userId);
  const user = users.find((item) => item.id === id);
  if (!user) return;

  if (button.dataset.userAction === "edit") {
    fillUserForm(user);
    renderUsers();
    document.querySelector("#user-modal-title").textContent = "Editar usuario";
    openModal("user-modal");
    addUserLog("Edicao carregada", `${user.name} foi carregado no formulario.`);
  }

  if (button.dataset.userAction === "permissions") {
    fillUserForm(user);
    setPermissionChecks(user);
    renderUsers();
    openModal("permissions-modal");
    addUserLog("Permissoes abertas", `Matriz de permissoes exibida para ${user.name}.`);
  }

  if (button.dataset.userAction === "reset") {
    selectedUserId = id;
    fillUserForm(user);
    renderUsers();
    openPasswordConfirmation(user);
  }

  if (button.dataset.userAction === "block") {
    updateUserStatus(id, "Bloqueado", "Usuario bloqueado");
  }

  if (button.dataset.userAction === "delete") {
    confirmDelete(`Deseja realmente excluir o usuario ${user.name}?`, () => {
      const index = users.findIndex((item) => item.id === id);
      if (index >= 0) users.splice(index, 1);
      selectedUserId = users[0]?.id ?? 0;
      renderUsers();
      if (users.length) fillUserForm(selectedUser());
    });
  }
});

if (userList) {
  renderUsers();
  fillUserForm(selectedUser());
}

const systemEmailConfig = {
  name: "DocGestor by Carminatti",
  address: "avisos@docgestor.com.br",
  domain: "docgestor.com.br",
  provider: "SMTP",
  host: "",
  port: "587",
  user: "",
  status: "Aguardando validacao",
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
  } catch (error) {
    console.warn("Nao foi possivel carregar a configuracao de e-mail.", error);
  }
}

function persistSystemEmailConfig() {
  const safeConfig = {
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
    alert("Preencha nome do remetente, e-mail remetente, dominio autorizado e provedor.");
    return;
  }
  if (!systemEmailHasChanges(payload)) {
    alert("Nenhuma alteracao encontrada na configuracao de e-mail.");
    return;
  }
  const confirmed = window.confirm(`Deseja alterar o e-mail de envio do sistema para ${payload.name} <${payload.address}>?`);
  if (!confirmed) return;
  Object.assign(systemEmailConfig, payload);
  systemEmailConfig.status = "Aguardando validacao";
  persistSystemEmailConfig();
  renderSystemEmailConfig();
  alert("Configuracao de e-mail alterada no sistema. Verifique o dominio antes de liberar envios reais.");
}

function openSystemEmailTestModal() {
  const input = field("system-email-test-to");
  if (input && !input.value) input.value = "jonatass.goncalvess@gmail.com";
  openModal("system-email-test-modal");
}

async function testSystemEmailConfig() {
  const recipient = field("system-email-test-to")?.value?.trim();
  if (!recipient) {
    alert("Informe o e-mail destinatario.");
    return;
  }
  try {
    const response = await fetch("/api/enviar-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipient,
        fromName: systemEmailConfig.name,
        fromEmail: systemEmailConfig.address,
        subject: "Teste DocGestor",
        html: "<p>Funcionou! Este e-mail foi enviado pela Vercel + Resend.</p>",
      }),
    });

    const result = await response.json();
    console.log(result);
    systemEmailConfig.lastTest = new Date().toLocaleString("pt-BR");
    persistSystemEmailConfig();
    if (result.success) closeModal("system-email-test-modal");
    alert(result.success ? "E-mail enviado!" : `Erro ao enviar e-mail: ${result.error || "verifique a configuracao do provedor"}`);
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
field("system-email-test")?.addEventListener("click", openSystemEmailTestModal);
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

const sendRecipients = [
  {
    id: 0,
    name: "Consultoria Ambiental",
    email: "consultoria@ambiental.com",
    module: "environmental",
    relation: "Consultor",
    status: "Ativo",
    readConfirmation: true,
    sent: 8,
    read: 6,
  },
  {
    id: 1,
    name: "Diretoria Carminatti",
    email: "diretoria@grupocarminatti.com",
    module: "environmental",
    relation: "Socio",
    status: "Ativo",
    readConfirmation: true,
    sent: 8,
    read: 8,
  },
];

let selectedSendRecipientId = 0;

function sendModuleLabel(moduleKey) {
  return {
    environmental: "03.1 Licencas Ambientais",
  }[moduleKey] || moduleKey;
}

function selectedSendRecipient() {
  return sendRecipients.find((recipient) => recipient.id === selectedSendRecipientId) || sendRecipients[0];
}

function fillSendRecipientForm(recipient) {
  if (!recipient) return;
  selectedSendRecipientId = recipient.id;
  field("send-recipient-id").value = recipient.id;
  field("send-recipient-name").value = recipient.name;
  field("send-recipient-email").value = recipient.email;
  field("send-recipient-module").value = recipient.module;
  field("send-recipient-relation").value = recipient.relation;
  field("send-recipient-status").value = recipient.status;
  field("send-recipient-read-confirmation").checked = Boolean(recipient.readConfirmation);
}

function renderSendRecipients() {
  const list = field("send-recipient-list");
  const count = field("send-recipient-count");
  if (!list || !count) return;
  count.textContent = `${sendRecipients.length} itens`;
  list.innerHTML = sendRecipients
    .map(
      (recipient) => `
        <article>
          <div>
            <strong>${recipient.name}</strong>
            <span>${recipient.email}</span>
          </div>
          <div>
            <strong>${sendModuleLabel(recipient.module)}</strong>
            <span>${recipient.relation} - ${recipient.status}</span>
            <span>Confirmacao de leitura: ${recipient.readConfirmation ? "Exigida" : "Nao exigida"}</span>
          </div>
          <div>
            <button type="button" data-send-recipient-action="edit" data-send-recipient-id="${recipient.id}">Editar</button>
            <button type="button" data-send-recipient-action="test" data-send-recipient-id="${recipient.id}">Enviar teste</button>
            <button type="button" data-send-recipient-action="delete" data-send-recipient-id="${recipient.id}">Excluir</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function newSendRecipient() {
  const recipient = {
    id: Date.now(),
    name: "",
    email: "",
    module: "environmental",
    relation: "Administrativo",
    status: "Ativo",
    readConfirmation: true,
    sent: 0,
    read: 0,
  };
  fillSendRecipientForm(recipient);
  field("send-recipient-modal-title").textContent = "Novo e-mail";
  openModal("send-recipient-modal");
}

function saveSendRecipient() {
  const id = Number(field("send-recipient-id").value);
  const existing = sendRecipients.find((recipient) => recipient.id === id);
  const payload = {
    id: Number.isNaN(id) ? Date.now() : id,
    name: field("send-recipient-name").value,
    email: field("send-recipient-email").value,
    module: field("send-recipient-module").value,
    relation: field("send-recipient-relation").value,
    status: field("send-recipient-status").value,
    readConfirmation: field("send-recipient-read-confirmation").checked,
    sent: existing?.sent || 0,
    read: existing?.read || 0,
  };
  if (existing) Object.assign(existing, payload);
  else sendRecipients.push(payload);
  selectedSendRecipientId = payload.id;
  renderSendRecipients();
  closeModal("send-recipient-modal");
}

field("send-recipient-new")?.addEventListener("click", newSendRecipient);
field("send-recipient-save")?.addEventListener("click", saveSendRecipient);
field("send-recipient-list")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-send-recipient-action]");
  if (!button) return;
  const id = Number(button.dataset.sendRecipientId);
  const recipient = sendRecipients.find((item) => item.id === id);
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
    alert(`E-mail teste registrado para ${recipient.email}. ${recipient.readConfirmation ? "Aguardando confirmacao de leitura." : "Confirmacao de leitura nao exigida."}`);
  }
  if (button.dataset.sendRecipientAction === "delete") {
    confirmDelete(`Deseja realmente excluir o e-mail ${recipient.email} dos envios?`, () => {
      const index = sendRecipients.findIndex((item) => item.id === id);
      if (index >= 0) sendRecipients.splice(index, 1);
      renderSendRecipients();
    });
  }
});

renderSendRecipients();

const partners = [
  {
    id: 0,
    name: "Henrique Carminatti",
    document: "123.456.789-10",
    role: "Socio administrador",
    contact: "henrique@grupocarminatti.com",
    phone: "(11) 98888-1000",
    status: "Ativo",
  },
  {
    id: 1,
    name: "Marina Carminatti",
    document: "098.765.432-11",
    role: "Procurador",
    contact: "marina@grupocarminatti.com",
    phone: "(11) 98888-1200",
    status: "Ativo",
  },
];

let selectedPartnerId = 0;
const partnerList = document.querySelector("#partner-list");
const partnerCount = document.querySelector("#partner-count");

function selectedPartner() {
  return partners.find((partner) => partner.id === selectedPartnerId) || partners[0];
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
  field("partner-role").value = "Socio";
  field("partner-contact").value = "";
  field("partner-phone").value = "";
  field("partner-status").value = "Ativo";
  document.querySelector("#partner-modal-title").textContent = "Novo socio";
  openModal("partner-modal");
}

function savePartner() {
  const id = Number(field("partner-id").value);
  const existing = partners.find((partner) => partner.id === id);
  const payload = {
    id: Number.isNaN(id) ? Date.now() : id,
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
}

document.querySelector("#partner-new")?.addEventListener("click", newPartner);
document.querySelector("#partner-save")?.addEventListener("click", savePartner);

partnerList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-partner-action]");
  if (!button) return;
  const id = Number(button.dataset.partnerId);
  const partner = partners.find((item) => item.id === id);
  if (!partner) return;

  if (button.dataset.partnerAction === "edit") {
    fillPartnerForm(partner);
    document.querySelector("#partner-modal-title").textContent = "Editar socio";
    openModal("partner-modal");
  }

  if (button.dataset.partnerAction === "delete") {
    confirmDelete(`Deseja realmente excluir o socio ${partner.name}?`, () => {
      const index = partners.findIndex((item) => item.id === id);
      if (index >= 0) partners.splice(index, 1);
      selectedPartnerId = partners[0]?.id ?? 0;
      renderPartners();
      if (partners.length) fillPartnerForm(selectedPartner());
    });
  }
});

if (partnerList) {
  renderPartners();
  fillPartnerForm(selectedPartner());
}

const companies = [
  {
    id: 0,
    kind: "matrix",
    name: "Carminatti Participacoes S.A.",
    cnpj: "08.120.981/0001-44",
    tradeName: "Grupo Carminatti",
    status: "Ativa",
    partners: ["Henrique Carminatti", "Marina Carminatti"],
    parentId: null,
    showBranches: true,
  },
  {
    id: 1,
    kind: "branch",
    name: "Unidade Paulinia",
    cnpj: "08.120.981/0002-25",
    tradeName: "Carminatti Paulinia",
    status: "Ativa",
    partners: ["Henrique Carminatti"],
    parentId: 0,
  },
  {
    id: 2,
    kind: "branch",
    name: "Fazenda Santa Clara",
    cnpj: "08.120.981/0003-06",
    tradeName: "Carminatti Santa Clara",
    status: "Ativa",
    partners: ["Marina Carminatti"],
    parentId: 0,
  },
  {
    id: 3,
    kind: "matrix",
    name: "Carminatti Agroindustrial Ltda",
    cnpj: "12.441.220/0001-80",
    tradeName: "Carminatti Agro",
    status: "Ativa",
    partners: ["Marina Carminatti"],
    parentId: null,
    showBranches: false,
  },
];

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

function setCompanyPartners(partners) {
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
        .filter((company) => company.kind === "branch" && company.parentId === matrix.id)
        .sort((a, b) => a.cnpj.localeCompare(b.cnpj));
      const branchRows = matrix.showBranches
        ? branches
            .map(
              (branch) => `
                <div class="branch-row">
                  <div><strong>${branch.name}</strong><span>Filial - ${branch.cnpj}</span></div>
                  <span>${branch.tradeName}</span>
                  <span>Socios: ${branch.partners.join(", ")}</span>
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
            <span>Socios: ${matrix.partners.join(", ")}</span>
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

function saveCompany() {
  const id = Number(field("company-id").value);
  const kind = field("company-kind").value;
  const existing = companies.find((company) => company.id === id);
  const payload = {
    id: Number.isNaN(id) ? Date.now() : id,
    kind,
    name: field("company-name").value,
    cnpj: field("company-cnpj").value,
    tradeName: field("company-trade-name").value,
    status: field("company-status").value,
    partners: selectedCompanyPartners(),
    parentId: kind === "branch" ? Number(field("company-parent").value) : null,
  };

  if (kind === "matrix") payload.showBranches = existing?.showBranches ?? true;

  if (existing) {
    Object.assign(existing, payload);
  } else {
    companies.push(payload);
  }

  renderCompanies();
  closeModal("company-modal");
}

document.querySelector("#company-new")?.addEventListener("click", newCompany);
document.querySelector("#company-save")?.addEventListener("click", saveCompany);
companyKind?.addEventListener("change", updateCompanyKindFields);
companyTree?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-company-action]");
  if (!button) return;
  const id = Number(button.dataset.companyId);
  const company = companies.find((item) => item.id === id);
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
          if (companies[index].id === id || companies[index].parentId === id) companies.splice(index, 1);
        }
      } else {
        const index = companies.findIndex((item) => item.id === id);
        if (index >= 0) companies.splice(index, 1);
      }
      renderCompanies();
      populateEnterpriseSelects();
    });
  }
});

if (companyTree) {
  populateCompanyParents();
  renderCompanies();
}

const properties = [
  {
    id: 0,
    ownerType: "pj",
    owner: "Carminatti Participacoes S.A.",
    type: "urban",
    registration: "45.882",
    reference: "Proximo ao acesso principal",
    lot: "Lote 08",
    block: "Quadra 12",
    glebe: "",
    urbanArea: 1200,
    ruralArea: 0,
    legalReserve: 0,
    appArea: 0,
    ruralUse: "",
    hasConstruction: true,
    constructionArea: 450,
    status: "Ativo",
  },
  {
    id: 1,
    ownerType: "pf",
    owner: "Henrique Carminatti",
    type: "rural",
    registration: "18.204",
    reference: "Entrada pela estrada municipal, km 7",
    lot: "Lote Rural 02",
    block: "",
    glebe: "Gleba A",
    urbanArea: 0,
    ruralArea: 50000,
    legalReserve: 10000,
    appArea: 2500,
    ruralUse: "Lavoura",
    hasConstruction: false,
    constructionArea: 0,
    status: "Ativo",
  },
];

let selectedPropertyId = 0;
let pendingPropertyDeleteId = null;
const propertyList = document.querySelector("#property-list");
const propertyCount = document.querySelector("#property-count");
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
  const value = Number(source.value || 0);
  if (direction === "m2-to-ha") target.value = value ? (value / 10000).toFixed(4) : "";
  if (direction === "ha-to-m2") target.value = value ? (value * 10000).toFixed(0) : "";
  updateReserveCalculation();
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

function renderProperties() {
  if (!propertyList) return;
  propertyCount.textContent = `${properties.length} itens`;
  propertyList.innerHTML = properties
    .map((property) => {
      const typeLabel = property.type === "urban" ? `Urbano - ${property.block}` : `Rural - ${property.glebe}`;
      const areaLabel =
        property.type === "urban"
          ? `${property.hasConstruction ? `Construcao ${property.constructionArea} m2` : "Sem construcao informada"}`
          : `${property.ruralArea} m2 total | RL ${property.legalReserve} m2 | APP ${property.appArea} m2`;
      return `
        <article>
          <strong>Matricula ${property.registration}</strong>
          <span>${typeLabel} - ${areaLabel} - proprietario: ${property.owner} - referencia: ${property.reference || "Nao informada"}</span>
          <div>
            <button type="button" data-property-action="edit" data-property-id="${property.id}">Editar</button>
            <button type="button" data-property-action="delete" data-property-id="${property.id}">Excluir</button>
          </div>
        </article>
      `;
    })
    .join("");
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
  field("property-lot").value = property.lot;
  field("property-block").value = property.block;
  field("property-glebe").value = property.glebe;
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
  field("property-lot").value = "";
  field("property-block").value = "";
  field("property-glebe").value = "";
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
  document.querySelector("#property-modal-title").textContent = "Novo Imovel";
  updatePropertyFields();
  openModal("property-modal");
}

function saveProperty() {
  const id = Number(field("property-id").value);
  const existing = properties.find((property) => property.id === id);
  const type = field("property-type").value;
  const payload = {
    id: Number.isNaN(id) ? Date.now() : id,
    ownerType: field("property-owner-type").value,
    owner: field("property-owner").value,
    type,
    registration: field("property-registration").value,
    reference: field("property-reference").value,
    lot: field("property-lot").value,
    block: type === "urban" ? field("property-block").value : "",
    glebe: type === "rural" ? field("property-glebe").value : "",
    urbanArea: 0,
    ruralArea: type === "rural" ? Number(field("property-rural-area").value || 0) : 0,
    legalReserve: type === "rural" ? Number(field("property-legal-reserve").value || 0) : 0,
    appArea: type === "rural" ? Number(field("property-app-area").value || 0) : 0,
    ruralUse: field("property-rural-use").value,
    hasConstruction: field("property-has-construction").checked,
    constructionArea: field("property-has-construction").checked ? Number(field("property-construction-area").value || 0) : 0,
    status: "Ativo",
  };

  if (existing) Object.assign(existing, payload);
  else properties.push(payload);

  renderProperties();
  closeModal("property-modal");
}

document.querySelector("#property-new")?.addEventListener("click", newProperty);
document.querySelector("#property-save")?.addEventListener("click", saveProperty);
document.querySelector("#property-delete-confirm")?.addEventListener("click", () => {
  const index = properties.findIndex((property) => property.id === pendingPropertyDeleteId);
  if (index >= 0) properties.splice(index, 1);
  pendingPropertyDeleteId = null;
  renderProperties();
  closeModal("property-delete-modal");
});
propertyOwnerType?.addEventListener("change", () => populatePropertyOwners());
propertyType?.addEventListener("change", updatePropertyFields);
propertyRuralUse?.addEventListener("change", updatePropertyFields);
propertyHasConstruction?.addEventListener("change", updatePropertyFields);
["property-rural-area", "property-legal-reserve", "property-app-area"].forEach((id) => {
  document.querySelector(`#${id}`)?.addEventListener("input", updateReserveCalculation);
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
  const id = Number(button.dataset.propertyId);
  const property = properties.find((item) => item.id === id);
  if (!property) return;

  if (button.dataset.propertyAction === "edit") {
    fillPropertyForm(property);
    document.querySelector("#property-modal-title").textContent = "Editar Imovel";
    openModal("property-modal");
  }

  if (button.dataset.propertyAction === "delete") {
    pendingPropertyDeleteId = property.id;
    const text = document.querySelector("#property-delete-text");
    if (text) text.textContent = `Deseja realmente excluir o imovel de matricula ${property.registration}?`;
    openModal("property-delete-modal");
  }
});

if (propertyList) {
  populatePropertyOwners();
  renderProperties();
}

const enterprises = [
  {
    id: 0,
    name: "Empreendimento Industrial Carminatti",
    company: "Carminatti Participacoes S.A.",
    property: "Matricula 45.882",
    type: "Industrial",
    status: "Em implantacao",
    responsible: "Marina Carminatti",
    reference: "Ampliacao da unidade produtiva",
  },
  {
    id: 1,
    name: "Captacao Fazenda Carminatti",
    company: "Carminatti Agroindustrial Ltda",
    property: "Matricula 18.204",
    type: "Rural",
    status: "Planejado",
    responsible: "Henrique Carminatti",
    reference: "Area rural proxima ao curso d'agua",
  },
];

let selectedEnterpriseId = 0;
let pendingEnterpriseDeleteId = null;
const enterpriseList = document.querySelector("#enterprise-list");
const enterpriseCount = document.querySelector("#enterprise-count");
const enterpriseCompany = document.querySelector("#enterprise-company");
const enterpriseProperty = document.querySelector("#enterprise-property");

function populateEnterpriseProperties(selectedProperty = "") {
  if (!enterpriseProperty || !enterpriseCompany) return;
  const selectedCompany = enterpriseCompany.value;
  const propertyNames = properties
    .filter((property) => property.owner === selectedCompany)
    .map((property) => `Matricula ${property.registration}`);
  enterpriseProperty.innerHTML = propertyNames.length
    ? propertyNames.map((name) => `<option>${name}</option>`).join("")
    : `<option>Nenhum imovel cadastrado para esta empresa</option>`;
  if (selectedProperty && propertyNames.includes(selectedProperty)) enterpriseProperty.value = selectedProperty;
}

function populateEnterpriseSelects(selectedCompany = "", selectedProperty = "") {
  if (enterpriseCompany) {
    const companyNames = companies.map((company) => company.name);
    enterpriseCompany.innerHTML = companyNames.map((name) => `<option>${name}</option>`).join("");
    if (selectedCompany && companyNames.includes(selectedCompany)) enterpriseCompany.value = selectedCompany;
  }

  populateEnterpriseProperties(selectedProperty);
}

function renderEnterprises() {
  if (!enterpriseList) return;
  enterpriseCount.textContent = `${enterprises.length} itens`;
  enterpriseList.innerHTML = enterprises
    .map(
      (enterprise) => `
        <article>
          <strong>${enterprise.name}</strong>
          <span>${enterprise.company} - ${enterprise.property} - ${enterprise.type} - ${enterprise.status} - responsavel: ${enterprise.responsible}</span>
          <div>
            <button type="button" data-enterprise-action="edit" data-enterprise-id="${enterprise.id}">Editar</button>
            <button type="button" data-enterprise-action="delete" data-enterprise-id="${enterprise.id}">Excluir</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function fillEnterpriseForm(enterprise) {
  if (!enterprise) return;
  selectedEnterpriseId = enterprise.id;
  field("enterprise-id").value = enterprise.id;
  populateEnterpriseSelects(enterprise.company, enterprise.property);
  field("enterprise-name").value = enterprise.name;
  field("enterprise-type").value = enterprise.type;
  field("enterprise-status").value = enterprise.status;
  field("enterprise-responsible").value = enterprise.responsible;
  field("enterprise-reference").value = enterprise.reference;
}

function newEnterprise() {
  const id = Date.now();
  selectedEnterpriseId = id;
  field("enterprise-id").value = id;
  populateEnterpriseSelects();
  field("enterprise-name").value = "";
  field("enterprise-type").value = "Industrial";
  field("enterprise-status").value = "Planejado";
  field("enterprise-responsible").value = "";
  field("enterprise-reference").value = "";
  document.querySelector("#enterprise-modal-title").textContent = "Novo Empreendimento";
  openModal("enterprise-modal");
}

function saveEnterprise() {
  const id = Number(field("enterprise-id").value);
  const existing = enterprises.find((enterprise) => enterprise.id === id);
  const payload = {
    id: Number.isNaN(id) ? Date.now() : id,
    name: field("enterprise-name").value,
    company: field("enterprise-company").value,
    property: field("enterprise-property").value,
    type: field("enterprise-type").value,
    status: field("enterprise-status").value,
    responsible: field("enterprise-responsible").value,
    reference: field("enterprise-reference").value,
  };

  if (existing) Object.assign(existing, payload);
  else enterprises.push(payload);

  renderEnterprises();
  closeModal("enterprise-modal");
}

document.querySelector("#enterprise-new")?.addEventListener("click", newEnterprise);
document.querySelector("#enterprise-save")?.addEventListener("click", saveEnterprise);
enterpriseCompany?.addEventListener("change", () => populateEnterpriseProperties());
document.querySelector("#enterprise-delete-confirm")?.addEventListener("click", () => {
  const index = enterprises.findIndex((enterprise) => enterprise.id === pendingEnterpriseDeleteId);
  if (index >= 0) enterprises.splice(index, 1);
  pendingEnterpriseDeleteId = null;
  renderEnterprises();
  closeModal("enterprise-delete-modal");
});
enterpriseList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-enterprise-action]");
  if (!button) return;
  const id = Number(button.dataset.enterpriseId);
  const enterprise = enterprises.find((item) => item.id === id);
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

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.textContent.trim() !== "Excluir") return;
  if (
    button.dataset.userAction ||
    button.dataset.partnerAction ||
    button.dataset.companyAction ||
    button.dataset.propertyAction ||
    button.dataset.enterpriseAction ||
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

const environmentalLicenseTypes = [
  { id: 0, name: "Licenca de Operacao", code: "LO", validity: "4 anos", renewal: "180 dias antes", phases: ["Trifasica"] },
  { id: 1, name: "LAS", code: "LAS", validity: "5 anos", renewal: "120 dias antes", phases: ["Monofasica"] },
  { id: 2, name: "Outorga", code: "OUT", validity: "Indeterminada", renewal: "90 dias antes", phases: ["Monofasica", "Bifasica"] },
];

const environmentalDocuments = [
  { id: 0, name: "CNPJ", expiration: "Nao", required: "Sim", licenses: ["Licenca de Operacao", "LAS", "Outorga"] },
  { id: 1, name: "Matricula do imovel", expiration: "Nao", required: "Sim", licenses: ["Licenca de Operacao", "LAS", "Outorga"] },
  { id: 2, name: "ART/RRT", expiration: "Nao", required: "Sim", licenses: ["Licenca de Operacao", "Outorga"] },
  { id: 3, name: "Comprovante de taxa", expiration: "Nao", required: "Sim", licenses: ["Licenca de Operacao", "LAS"] },
];

const checklistModelsAdmin = [
  { id: 0, name: "Checklist - Licenca de Operacao", license: "Licenca de Operacao", documents: ["CNPJ", "Matricula do imovel", "ART/RRT", "Comprovante de taxa"] },
  { id: 1, name: "Checklist - LAS", license: "LAS", documents: ["CNPJ", "Matricula do imovel", "Comprovante de taxa"] },
];

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
      <span>${item.code} - ${item.phases.join(", ")} - validade ${item.validity} - renovar ${item.renewal}</span>
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
      <span>Licencas: ${item.licenses.join(", ")} - vencimento: ${item.expiration} - obrigatorio: ${item.required}</span>
      <div>
        <button type="button" data-document-action="edit" data-document-id="${item.id}">Editar</button>
        <button type="button" data-document-action="delete" data-document-id="${item.id}">Excluir</button>
      </div>
    </article>
  `).join("");
}

function renderDocumentLicenseChecks(selectedLicenses = []) {
  const wrapper = document.querySelector("#document-license-checks");
  if (!wrapper) return;
  wrapper.innerHTML = `<span>Licencas vinculadas</span>${environmentalLicenseTypes
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
  wrapper.innerHTML = `<span>Documentos vinculados a licenca selecionada</span>${
    documents.length
      ? documents
          .map(
            (documentItem) => `
              <label><input type="checkbox" name="checklist-document" value="${documentItem.name}" ${selected.includes(documentItem.name) ? "checked" : ""} /> ${documentItem.name}</label>
            `,
          )
          .join("")
      : "<small>Nenhum documento vinculado a esta licenca.</small>"
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
  field("license-type-validity").value = "4 anos";
  field("license-type-renewal").value = "";
  setCheckedValues('input[name="license-phase"]', []);
  document.querySelector("#license-type-modal-title").textContent = "Novo Tipo de Licenca";
  openModal("license-type-modal");
});

document.querySelector("#license-type-save")?.addEventListener("click", () => {
  const id = Number(field("license-type-id").value);
  const existing = environmentalLicenseTypes.find((item) => item.id === id);
  const payload = {
    id,
    name: field("license-type-name").value,
    code: field("license-type-code").value,
    validity: field("license-type-validity").value,
    renewal: field("license-type-renewal").value,
    phases: checkedValues('input[name="license-phase"]'),
  };
  if (existing) Object.assign(existing, payload);
  else environmentalLicenseTypes.push(payload);
  renderEnvironmentalLicenseTypes();
  populateChecklistModelSelects();
  closeModal("license-type-modal");
});

licenseTypeList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-license-type-action]");
  if (!button) return;
  const id = Number(button.dataset.licenseTypeId);
  const item = environmentalLicenseTypes.find((entry) => entry.id === id);
  if (!item) return;
  if (button.dataset.licenseTypeAction === "edit") {
    field("license-type-id").value = item.id;
    field("license-type-name").value = item.name;
    field("license-type-code").value = item.code;
    field("license-type-validity").value = item.validity;
    field("license-type-renewal").value = item.renewal;
    setCheckedValues('input[name="license-phase"]', item.phases);
    document.querySelector("#license-type-modal-title").textContent = "Editar Tipo de Licenca";
    openModal("license-type-modal");
  }
  if (button.dataset.licenseTypeAction === "delete") {
    confirmDelete(`Deseja realmente excluir o tipo de licenca ${item.name}?`, () => {
      const index = environmentalLicenseTypes.findIndex((entry) => entry.id === id);
      if (index >= 0) environmentalLicenseTypes.splice(index, 1);
      renderEnvironmentalLicenseTypes();
      populateChecklistModelSelects();
    });
  }
});

document.querySelector("#environmental-document-new")?.addEventListener("click", () => {
  field("environmental-document-id").value = Date.now();
  field("environmental-document-name").value = "";
  field("environmental-document-expiration").value = "Nao";
  field("environmental-document-required").value = "Sim";
  renderDocumentLicenseChecks();
  document.querySelector("#environmental-document-modal-title").textContent = "Novo Documento";
  openModal("environmental-document-modal");
});

document.querySelector("#environmental-document-save")?.addEventListener("click", () => {
  const id = Number(field("environmental-document-id").value);
  const existing = environmentalDocuments.find((item) => item.id === id);
  const payload = {
    id,
    name: field("environmental-document-name").value,
    expiration: field("environmental-document-expiration").value,
    required: field("environmental-document-required").value,
    licenses: checkedValues('input[name="document-license"]'),
  };
  if (existing) Object.assign(existing, payload);
  else environmentalDocuments.push(payload);
  renderEnvironmentalDocuments();
  populateChecklistModelSelects();
  closeModal("environmental-document-modal");
});

environmentalDocumentList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-document-action]");
  if (!button) return;
  const id = Number(button.dataset.documentId);
  const item = environmentalDocuments.find((entry) => entry.id === id);
  if (!item) return;
  if (button.dataset.documentAction === "edit") {
    field("environmental-document-id").value = item.id;
    field("environmental-document-name").value = item.name;
    field("environmental-document-expiration").value = item.expiration;
    field("environmental-document-required").value = item.required;
    renderDocumentLicenseChecks(item.licenses);
    document.querySelector("#environmental-document-modal-title").textContent = "Editar Documento";
    openModal("environmental-document-modal");
  }
  if (button.dataset.documentAction === "delete") {
    confirmDelete(`Deseja realmente excluir o documento ${item.name}?`, () => {
      const index = environmentalDocuments.findIndex((entry) => entry.id === id);
      if (index >= 0) environmentalDocuments.splice(index, 1);
      renderEnvironmentalDocuments();
      populateChecklistModelSelects();
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

document.querySelector("#checklist-model-save")?.addEventListener("click", () => {
  const id = Number(field("checklist-model-id").value);
  const existing = checklistModelsAdmin.find((item) => item.id === id);
  const payload = {
    id,
    name: field("checklist-model-name").value,
    license: field("checklist-model-license").value,
    documents: checkedValues('input[name="checklist-document"]'),
  };
  if (existing) Object.assign(existing, payload);
  else checklistModelsAdmin.push(payload);
  renderChecklistModelsAdmin();
  closeModal("checklist-model-modal");
});

checklistModelList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-checklist-model-action]");
  if (!button) return;
  const id = Number(button.dataset.checklistModelId);
  const item = checklistModelsAdmin.find((entry) => entry.id === id);
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
      const index = checklistModelsAdmin.findIndex((entry) => entry.id === id);
      if (index >= 0) checklistModelsAdmin.splice(index, 1);
      renderChecklistModelsAdmin();
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

const checklistModels = {
  "Licenca de Operacao": [
    ["CNPJ", "Tipo de documento: Admin", true],
    ["Contrato social", "Tipo de documento: Admin", true],
    ["Matricula do imovel", "Imovel: Admin", true],
    ["Planta/layout operacional", "Checklist: Licenca de Operacao", true],
    ["ART/RRT do estudo ambiental", "Tipo de documento: Admin", false],
    ["Comprovante de taxa", "Tipo de documento: Admin", false],
    ["Memorial descritivo", "Checklist: Licenca de Operacao", false],
    ["Protocolo de renovacao", "Gerado no processo ambiental", false],
  ],
  LAS: [
    ["CNPJ", "Tipo de documento: Admin", true],
    ["Matricula do imovel", "Imovel: Admin", true],
    ["Croqui de localizacao", "Tipo de documento: Admin", false],
    ["Memorial simplificado", "Checklist: LAS", false],
    ["Declaracao de atividade", "Tipo de documento: Admin", false],
    ["Comprovante de taxa", "Tipo de documento: Admin", false],
  ],
  Outorga: [
    ["CNPJ", "Tipo de documento: Admin", true],
    ["Matricula do imovel", "Imovel: Admin", true],
    ["Coordenadas do ponto de captacao", "Imovel: Admin", false],
    ["Estudo de disponibilidade hidrica", "Checklist: Outorga", false],
    ["ART/RRT do responsavel tecnico", "Tipo de documento: Admin", false],
  ],
};

const licenseTypeSelect = document.querySelector("#license-type-select");
const generatedChecklist = document.querySelector("#generated-checklist");
const environmentalProcesses = [
  {
    id: 0,
    internalNumber: "001/2026",
    licensingFormat: "trifasico",
    licensingFormatLabel: "Trifasico",
    number: "LO 4821/2022",
    title: "Unidade Paulinia",
    company: "Carminatti Participacoes S.A.",
    type: "Licenca de Operacao",
    agency: "CETESB",
    status: "open",
    statusLabel: "Aberta",
    risk: "Risco critico",
    due: "Vence em 15 dias",
    responsible: "Marina Carminatti",
    progress: 63,
    documents: "9 de 14 anexados",
  },
  {
    id: 1,
    internalNumber: "002/2026",
    licensingFormat: "monofasico",
    licensingFormatLabel: "Monofasico",
    number: "LAS 117/2024",
    title: "Unidade Limeira",
    company: "Carminatti Participacoes S.A.",
    type: "LAS",
    agency: "Secretaria Municipal de Meio Ambiente",
    status: "pending",
    statusLabel: "Pendente",
    risk: "Aguardando documentos",
    due: "Renovar",
    responsible: "Rafael Almeida",
    progress: 42,
    documents: "4 de 9 anexados",
  },
  {
    id: 2,
    internalNumber: "003/2026",
    licensingFormat: "bifasico",
    licensingFormatLabel: "Bifasico",
    number: "LI 090/2025",
    title: "Fazenda Santa Clara",
    company: "Carminatti Agroindustrial Ltda",
    type: "Licenca de Instalacao",
    agency: "CETESB",
    status: "pending",
    statusLabel: "Pendente",
    risk: "Em analise",
    due: "Resposta do orgao ambiental",
    responsible: "Henrique Carminatti",
    progress: 78,
    documents: "12 de 14 anexados",
  },
  {
    id: 3,
    internalNumber: "004/2026",
    licensingFormat: "trifasico",
    licensingFormatLabel: "Trifasico",
    number: "LO 031/2020",
    title: "Unidade Paulinia - Galpao 2",
    company: "Carminatti Participacoes S.A.",
    type: "Licenca de Operacao",
    agency: "CETESB",
    status: "expired",
    statusLabel: "Vencida",
    risk: "Vencida",
    due: "Venceu em 12/03/2026",
    responsible: "Marina Carminatti",
    progress: 88,
    documents: "Renovacao em atraso",
  },
  {
    id: 4,
    internalNumber: "005/2026",
    licensingFormat: "monofasico",
    licensingFormatLabel: "Monofasico",
    number: "OUT 044/2023",
    title: "Captacao Fazenda Carminatti",
    company: "Carminatti Agroindustrial Ltda",
    type: "Outorga",
    agency: "DAEE",
    status: "done",
    statusLabel: "Concluida",
    risk: "Processo concluido",
    due: "Sem pendencias",
    responsible: "Henrique Carminatti",
    progress: 100,
    documents: "8 de 8 anexados",
    activeLicense: {
      id: "sample-005-license",
      processId: 4,
      processNumber: "005/2026",
      stageNumber: 3,
      type: "Outorga",
      number: "OUT 044/2023",
      expiryDate: "2027-06-30",
      company: "Carminatti Agroindustrial Ltda",
      title: "Captacao Fazenda Carminatti",
      responsible: "Henrique Carminatti",
      status: "Ativa",
    },
  },
];

let currentLicenseStatus = "general";
let activeStageProcessId = null;
let activeStageNumber = null;

const licenseStatusMeta = {
  general: {
    title: "03.1 Licencas Ambientais",
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
    subtitle: "Processos com exigencias, documentos ou retorno de orgao ambiental pendente.",
    pill: "yellow",
  },
  done: {
    title: "03.1.4 Concluidas",
    subtitle: "Processos finalizados, deferidos ou encerrados.",
    pill: "green",
  },
  expired: {
    title: "03.1.3 Vencidas",
    subtitle: "Processos com licenca vencida ou prazo critico ultrapassado.",
    pill: "red",
  },
  licenses: {
    title: "03.1.5 Licencas",
    subtitle: "Relacao das licencas ambientais vinculadas aos processos cadastrados.",
    pill: "green",
  },
};

function renderChecklist(type) {
  if (!generatedChecklist) return;
  const items = checklistModels[type] || checklistModels["Licenca de Operacao"];
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
  return process.risk.toLowerCase().includes("critico") ? "red" : "green";
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
    .map((process) => ({ ...process.activeLicense, process }))
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

function findActiveLicense(processId, stageNumber = null) {
  return activeLicenses().find((license) => {
    const sameProcess = String(license.processId) === String(processId);
    const sameStage = stageNumber === null || String(license.stageNumber) === String(stageNumber);
    return sameProcess && sameStage;
  });
}

function isOperationLicense(license) {
  return String(license?.type || "").toLowerCase().includes("operacao");
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
  if (format === "bifasico") return index === 0 ? "Primeira licenca" : "Ultima licenca";
  if (format === "trifasico") return ["Primeira licenca", "Licenca 2", "Licenca final"][index] || `Licenca ${index + 1}`;
  return "Licenca ambiental";
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
  return ensureProcessStages(process).find((stage) => stage.name.toLowerCase().includes("juntada de documentos"))?.number || 1;
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

function documentsForCurrentProcessStage(process) {
  const currentStage = currentProcessStage(process);
  return process.stageDocuments?.[currentStage?.number] || [];
}

function isDocumentStage(stage) {
  return stage?.name?.toLowerCase().includes("juntada de documentos");
}

function isProtocolStage(stage) {
  return stage?.name?.toLowerCase().includes("protocolo");
}

function isLicenseStage(stage) {
  return stage?.name?.toLowerCase().includes("licenca");
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
  if (isProtocolStage(stage) && !canCompleteStage(process, stage)) return "Informe o numero e a data do protocolo ambiental.";
  if (isLicenseStage(stage) && !canCompleteStage(process, stage)) return "Informe o numero da licenca e a data de vencimento.";
  return stageGateMessage(process, stage);
}

function canOpenProcessStage(process, stageNumber) {
  const stages = ensureProcessStages(process);
  if (stageNumber <= 1) return true;
  const previousStage = stages.find((stage) => stage.number === stageNumber - 1);
  return previousStage?.status === "Concluida";
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
      ["Juntada de documentos", "Organizar documentos e checklist inicial."],
      ["Protocolo", "Registrar protocolo no orgao ambiental."],
      ["Licenca ambiental", "Informar numero, emissao, vencimento e condicionantes."],
    ],
  },
  bifasico: {
    label: "Bifasico",
    stages: [
      ["Juntada de documentos 1", "Preparar documentos da primeira fase."],
      ["Protocolo 1", "Protocolar a primeira etapa no orgao ambiental."],
      ["Primeira licenca", "Cadastrar a primeira licenca emitida."],
      ["Juntada de documentos 2", "Preparar documentos complementares."],
      ["Protocolo 2", "Protocolar a etapa final."],
      ["Ultima licenca", "Cadastrar a licenca final e seus vencimentos."],
    ],
  },
  trifasico: {
    label: "Trifasico",
    stages: [
      ["Juntada de documentos 1", "Preparar documentos da primeira fase."],
      ["Protocolo 1", "Protocolar a primeira fase."],
      ["Primeira licenca", "Cadastrar primeira licenca emitida."],
      ["Juntada de documentos 2", "Preparar documentos da segunda fase."],
      ["Protocolo 2", "Protocolar a segunda fase."],
      ["Licenca 2", "Cadastrar segunda licenca emitida."],
      ["Juntada de documentos 3", "Preparar documentos da fase final."],
      ["Protocolo 3", "Protocolar a fase final."],
      ["Licenca final", "Cadastrar licenca final, vencimentos e condicionantes."],
    ],
  },
};

function processStagesForFormat(format) {
  const config = licensingFormatStages[format] || licensingFormatStages.monofasico;
  return config.stages.map(([name, description], index) => ({
    number: index + 1,
    name,
    description,
    status: index === 0 ? "Em andamento" : "Nao iniciada",
  }));
}

function processStatusLabel(status) {
  return {
    open: "Aberta",
    pending: "Pendente",
    expired: "Vencida",
    done: "Concluida",
  }[status] || "Aberta";
}

function ensureProcessStages(process) {
  if (!process.stages?.length) {
    const stages = processStagesForFormat(process.licensingFormat);
    const completedCount = Math.min(stages.length, Math.floor(((process.progress || 0) / 100) * stages.length));
    stages.forEach((stage, index) => {
      if (index < completedCount) stage.status = "Concluida";
      if (index === completedCount && completedCount < stages.length) stage.status = "Em andamento";
      if (index > completedCount) stage.status = "Nao iniciada";
    });
    if ((process.progress || 0) >= 100) {
      stages.forEach((stage) => {
        stage.status = "Concluida";
      });
    }
    process.stages = stages;
  }
  return process.stages;
}

function currentProcessStage(process) {
  const stages = ensureProcessStages(process);
  return stages.find((stage) => stage.status === "Em andamento") || stages.find((stage) => stage.status !== "Concluida") || stages[stages.length - 1];
}

function updateProcessProgress(process) {
  const stages = ensureProcessStages(process);
  const completed = stages.filter((stage) => stage.status === "Concluida").length;
  process.progress = Math.round((completed / stages.length) * 100);
  if (completed === stages.length) {
    process.status = "done";
    process.statusLabel = processStatusLabel("done");
    process.risk = "Processo concluido";
    process.due = "Sem pendencias";
  }
  return process.progress;
}

function setProcessCurrentStage(process, stageNumber) {
  const stages = ensureProcessStages(process);
  stages.forEach((stage) => {
    if (stage.number < stageNumber) stage.status = "Concluida";
    if (stage.number === stageNumber) stage.status = "Em andamento";
    if (stage.number > stageNumber) stage.status = "Nao iniciada";
  });
  if (process.status === "done") {
    process.status = "open";
    process.statusLabel = processStatusLabel("open");
    process.risk = "Reaberto";
    process.due = "Acompanhamento retomado";
  }
  updateProcessProgress(process);
}

function completeProcessStage(process, stageNumber) {
  const stages = ensureProcessStages(process);
  const stage = stages.find((item) => item.number === stageNumber);
  if (!stage) return;
  if (!canCompleteStage(process, stage)) return;
  registerStageData(process, stage);
  stage.status = "Concluida";
  const nextStage = stages.find((item) => item.number > stageNumber);
  if (nextStage) {
    setProcessCurrentStage(process, nextStage.number);
  } else {
    stages.forEach((item) => {
      item.status = "Concluida";
    });
    updateProcessProgress(process);
  }
}

function processStageClass(stage) {
  if (stage.status === "Concluida") return "done";
  if (stage.status === "Em andamento") return "current";
  if (stage.status === "Pendente") return "blocked";
  return "";
}

function stageStatusPill(stage) {
  if (stage.status === "Concluida") return "green";
  if (stage.status === "Em andamento") return "yellow";
  if (stage.status === "Pendente") return "red";
  return "muted";
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
            <span>Etapa ${stage.number}</span>
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
  const companySelect = field("environmental-process-company");
  const branchSelect = field("environmental-process-branch");
  const propertySelect = field("environmental-process-property");
  const responsibleSelect = field("environmental-process-responsible");

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
    propertySelect.innerHTML = properties.map((property) => `<option value="Matricula ${property.registration}">Matricula ${property.registration} - ${property.reference || propertyOwnerLabel(property)}</option>`).join("");
  }
  if (responsibleSelect) {
    responsibleSelect.innerHTML = partners.map((partner) => `<option value="${partner.name}">${partner.name}</option>`).join("");
  }
  updateEnvironmentalProcessLicenseOptions();
  updateEnvironmentalProcessChecklistPreview();
  updateEnvironmentalProcessStagesPreview();
}

function updateEnvironmentalProcessLicenseOptions() {
  const wrapper = field("environmental-process-license-fields");
  if (!wrapper) return;
  const format = field("environmental-process-format")?.value || "monofasico";
  const linkedLicenses = licenseTypesForFormat(format);
  const count = licenseSelectionCountForFormat(format);
  const options = linkedLicenses.length
    ? linkedLicenses.map((type) => `<option value="${type.name}">${type.name}</option>`).join("")
    : `<option value="">Nenhum tipo de licenca vinculado</option>`;
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
  field("environmental-process-objective").value = "";
  field("environmental-process-notes").value = "";
  updateEnvironmentalProcessStagesPreview();
  openModal("environmental-process-modal");
}

function saveEnvironmentalProcess() {
  const internalNumber = field("environmental-process-number").value || nextEnvironmentalProcessNumber();
  const status = field("environmental-process-status").value;
  const licensingFormat = field("environmental-process-format").value;
  const formatConfig = licensingFormatStages[licensingFormat] || licensingFormatStages.monofasico;
  const selectedLicenses = selectedEnvironmentalProcessLicenses();
  const type = selectedLicenses.join(" / ") || "Tipo de licenca nao definido";
  const company = field("environmental-process-company").value;
  const branch = field("environmental-process-branch").value;
  const responsible = field("environmental-process-responsible").value;
  const objective = field("environmental-process-objective").value;
  const priority = field("environmental-process-priority").value;
  const process = {
    id: Date.now(),
    internalNumber,
    licensingFormat,
    licensingFormatLabel: formatConfig.label,
    stages: processStagesForFormat(licensingFormat),
    number: internalNumber,
    title: branch || company,
    company,
    type,
    licenseTypes: selectedLicenses,
    agency: "Nao especificado",
    status,
    statusLabel: processStatusLabel(status),
    risk: priority === "Critica" ? "Risco critico" : priority === "Alta" ? "Prioridade alta" : "Aberto",
    due: field("environmental-process-forecast").value ? `Protocolo previsto para ${field("environmental-process-forecast").value}` : "Sem protocolo definido",
    responsible,
    progress: 0,
    documents: objective || "Preparacao inicial",
    property: field("environmental-process-property").value,
    notes: field("environmental-process-notes").value,
    stageDocuments: {},
  };
  environmentalProcesses.push(process);
  if (field("environmental-process-forecast").value) {
    addAgendaEvent({
      date: field("environmental-process-forecast").value,
      time: "09:00",
      title: `Previsao de protocolo - ${internalNumber}`,
      type: "Prazo do processo",
      status: "warning",
      description: `${process.title} - ${process.type}`,
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
                <small>${documentItem.notes ? documentItem.notes : "Sem observacoes"}</small>
              </div>
              <label>
                <input type="checkbox" data-process-document-prepared="${index}" ${documentItem.prepared ? "checked" : ""} />
                Elaborado
              </label>
              <button type="button" data-process-document-note="${index}">Observacoes</button>
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
  const gateText = stageRequiredMessage(process, stage);
  if (gate) gate.hidden = !gateText;
  if (gateMessage) gateMessage.textContent = gateText || "Etapa liberada para avancar.";
  if (completeButton) {
    completeButton.disabled = Boolean(gateText);
    completeButton.textContent = gateText ? "Etapa bloqueada" : "Concluir etapa";
  }
  const previousButton = field("environmental-process-previous-stage");
  if (previousButton) previousButton.disabled = stage.number <= 1;
  const documentStage = isDocumentStage(stage);
  if (documentsPanel) documentsPanel.hidden = !documentStage;
  if (genericStage) genericStage.hidden = documentStage;
  if (protocolFields) protocolFields.hidden = true;
  if (licenseFields) licenseFields.hidden = true;
  if (documentStage) {
    renderEnvironmentalProcessDocuments(process);
  } else {
    const protocolStage = isProtocolStage(stage);
    const licenseStage = isLicenseStage(stage);
    const record = stageRecord(process, stage.number);
    field("environmental-process-generic-label").textContent = protocolStage ? "Protocolo ambiental" : "Licenca ambiental";
    field("environmental-process-generic-title").textContent = stage.name;
    field("environmental-process-generic-help").textContent = protocolStage
      ? "Registre o protocolo, data e comprovantes desta fase antes de concluir a etapa."
      : "Registre numero da licenca, emissao, validade e condicionantes antes de concluir a etapa.";
    if (protocolStage && protocolFields) {
      protocolFields.hidden = false;
      field("environmental-stage-protocol-number").value = record.protocolNumber || "";
      field("environmental-stage-protocol-date").value = record.protocolDate || "";
    }
    if (licenseStage && licenseFields) {
      licenseFields.hidden = false;
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
  saveCurrentStageForm(process, stage);
  const gateText = stageRequiredMessage(process, stage);
  const gate = field("environmental-process-stage-gate");
  const gateMessage = field("environmental-process-stage-gate-message");
  const completeButton = field("environmental-process-complete-stage");
  if (gate) gate.hidden = !gateText;
  if (gateMessage) gateMessage.textContent = gateText || "Etapa liberada para avancar.";
  if (completeButton) {
    completeButton.disabled = Boolean(gateText);
    completeButton.textContent = gateText ? "Etapa bloqueada" : "Concluir etapa";
  }
}

function saveCurrentStageForm(process, stage) {
  const record = stageRecord(process, stage.number);
  if (isProtocolStage(stage)) {
    record.protocolNumber = field("environmental-stage-protocol-number")?.value || "";
    record.protocolDate = field("environmental-stage-protocol-date")?.value || "";
  }
  if (isLicenseStage(stage)) {
    record.licenseType = licenseForLicenseStage(process, stage.number);
    record.licenseNumber = field("environmental-stage-license-number")?.value || "";
    record.expiryDate = field("environmental-stage-license-expiry")?.value || "";
  }
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
      processNumber: process.internalNumber,
      stageNumber: stage.number,
      type: record.licenseType || licenseForLicenseStage(process, stage.number),
      number: record.licenseNumber,
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
    addAgendaEvent({
      date: license.expiryDate,
      time: "09:00",
      title: `Vencimento ${license.number}`,
      type: "Vencimento de licenca",
      status: "danger",
      description: `${license.type} - ${process.title}`,
    });
  }
}

function renderProcessDetail(process) {
  ensureProcessStages(process);
  updateProcessProgress(process);
  const currentStage = currentProcessStage(process);
  field("environmental-process-detail-id").value = process.id;
  field("environmental-process-detail-title").textContent = `${process.internalNumber || process.number} - ${process.title}`;
  field("environmental-process-detail-subtitle").textContent = process.type;
  field("environmental-process-detail-format").textContent = process.licensingFormatLabel || "Formato nao definido";
  field("environmental-process-detail-current-stage").textContent = currentStage?.name || "Concluido";
  field("environmental-process-detail-progress").textContent = `${process.progress || 0}%`;
  field("environmental-process-detail-status").value = process.status;
  field("environmental-process-detail-company").textContent = `Empresa: ${process.company}`;
  field("environmental-process-detail-property").textContent = `Imovel: ${process.property || "Nao informado"}`;
  field("environmental-process-detail-responsible").textContent = `Responsavel: ${process.responsible}`;
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
  if (stage.status === "Nao iniciada") {
    stage.status = "Em andamento";
  }
  renderProcessDetail(process);
  renderCurrentStageScreen(process, stage);
  openModal("environmental-stage-modal");
}

function saveEnvironmentalProcessDetail() {
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
      stage.status = "Concluida";
    });
  }
  if (process.status === "pending") {
    process.risk = "Pendente";
    process.due = "Aguardando regularizacao da etapa atual";
  }
  if (process.status === "expired") {
    process.risk = "Vencida";
    process.due = "Prazo vencido";
  }
  if (process.status === "open" && process.progress < 100) {
    process.risk = process.risk === "Processo concluido" ? "Aberto" : process.risk;
  }
  updateProcessProgress(process);
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
        <small>Substitui a licenca anterior do mesmo processo</small>
        <small>Responsavel: ${license.responsible}</small>
      </div>
      <div>
        <span>Vencimento</span>
        <strong>${formatAgendaDate(license.expiryDate)}</strong>
        <small>Status: ${license.status}</small>
      </div>
      <div>
        <span class="pill green">${license.status}</span>
        <button type="button" class="ghost small" data-license-pdf="${license.processId}" data-stage-number="${license.stageNumber}">Baixar dossie PDF</button>
        <button type="button" class="ghost small" data-license-action="renew" data-process-id="${license.processId}" data-stage-number="${license.stageNumber}">Renovacao</button>
        ${isOperationLicense(license) ? `<button type="button" class="ghost small" data-license-action="expand" data-process-id="${license.processId}">Ampliacao</button>` : ""}
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
        <small>${process.number && process.number !== process.internalNumber ? process.number : "Sem numero oficial"}</small>
      </div>
      <div>
        <strong>${process.type}</strong>
        <span>${process.company}</span>
        <small>${process.licensingFormatLabel || "Formato nao definido"} - etapa atual: ${currentStage?.name || "Acompanhamento"}</small>
        <small>Responsavel: ${process.responsible}</small>
      </div>
      <div>
        <span>${process.documents}</span>
        <progress value="${process.progress}" max="100"></progress>
        <small>${process.progress}% concluido</small>
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
  if (subtitleTarget) subtitleTarget.textContent = status === "general" ? "Relatorio geral com processos abertos, pendentes, vencidos e licencas ativas." : meta.subtitle;
  if (newProcessButton) newProcessButton.hidden = status !== "general";
  document.querySelectorAll('[data-pdf-report="environmentalModule"]').forEach((button) => {
    button.textContent = status === "general" ? "Baixar relatorio geral" : "Baixar relatorio";
  });
  if (countTarget) {
    const generalCount = reportGroups.open.length + reportGroups.pending.length + reportGroups.expired.length + reportGroups.licenses.length;
    countTarget.textContent =
      status === "general"
        ? `${generalCount} registro${generalCount === 1 ? "" : "s"}`
        : status === "licenses"
          ? `${items.length} licenca${items.length === 1 ? "" : "s"}`
          : `${items.length} processo${items.length === 1 ? "" : "s"}`;
    countTarget.className = `pill ${meta.pill}`;
  }
  if (status === "general") {
    list.innerHTML = `
      ${renderEnvironmentalReportSection("03.1.1 Abertas", "Processos ambientais em andamento, sem licenca final gerada.", reportGroups.open, renderEnvironmentalProcessCard, "Nao ha processos abertos.")}
      ${renderEnvironmentalReportSection("03.1.2 Pendentes", "Processos com exigencias, documentos ou retorno pendente.", reportGroups.pending, renderEnvironmentalProcessCard, "Nao ha processos pendentes.")}
      ${renderEnvironmentalReportSection("03.1.3 Vencidas", "Processos com prazo critico ultrapassado ou licenca vencida.", reportGroups.expired, renderEnvironmentalProcessCard, "Nao ha processos vencidos.")}
      ${renderEnvironmentalReportSection("03.1.5 Licencas", "Licencas ambientais geradas pelos processos finalizados ou por etapas concluidas.", reportGroups.licenses, renderEnvironmentalLicenseCard, "Nao ha licencas cadastradas.")}
    `;
    return;
  }
  list.innerHTML = items.length
    ? items
        .map((item) => (status === "licenses" ? renderEnvironmentalLicenseCard(item) : renderEnvironmentalProcessCard(item)))
        .join("")
    : `<article class="status-process-card"><strong>Nenhum registro</strong><span>Nao ha ${status === "licenses" ? "licencas" : "processos"} nesta categoria.</span></article>`;
}

function openLicenseStatus(status = "open") {
  if (!canAccess("environmental")) return;
  openView("licencas");
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

document.querySelector("#license-status-list")?.addEventListener("click", (event) => {
  const deleteProcess = event.target.closest("[data-delete-process]");
  if (deleteProcess) {
    const process = environmentalProcesses.find((item) => String(item.id) === String(deleteProcess.dataset.deleteProcess));
    if (!process) return;
    const confirmed = window.confirm(`Deseja realmente excluir o processo ${process.internalNumber || process.number}?`);
    if (!confirmed) return;
    const index = environmentalProcesses.findIndex((item) => String(item.id) === String(process.id));
    if (index >= 0) environmentalProcesses.splice(index, 1);
    renderLicenseStatus(currentLicenseStatus);
    updateNextProcessNumber();
    return;
  }

  const deleteLicense = event.target.closest("[data-delete-license]");
  if (deleteLicense) {
    const license = findActiveLicense(deleteLicense.dataset.deleteLicense, deleteLicense.dataset.stageNumber);
    if (!license) return;
    const confirmed = window.confirm(`Deseja realmente excluir a licenca ${license.number}?`);
    if (!confirmed) return;
    const process = environmentalProcesses.find((item) => String(item.id) === String(license.processId));
    if (process) {
      if (String(process.activeLicense?.stageNumber) === String(license.stageNumber)) {
        delete process.activeLicense;
      }
      process.licenseHistory = (process.licenseHistory || []).filter((item) => String(item.stageNumber) !== String(license.stageNumber));
      process.number = process.internalNumber || process.number;
      process.due = process.status === "done" ? "Sem pendencias" : "Licenca removida do cadastro";
    }
    renderLicenseStatus(currentLicenseStatus);
    return;
  }

  const processPdf = event.target.closest("[data-process-pdf]");
  if (processPdf) {
    const process = environmentalProcesses.find((item) => String(item.id) === String(processPdf.dataset.processPdf));
    if (process) openPdfReport(buildEnvironmentalProcessDossier(process));
    return;
  }

  const licensePdf = event.target.closest("[data-license-pdf]");
  if (licensePdf) {
    const license = findActiveLicense(licensePdf.dataset.licensePdf, licensePdf.dataset.stageNumber);
    if (license) openPdfReport(buildEnvironmentalLicenseDossier(license));
    return;
  }

  const licenseAction = event.target.closest("[data-license-action]");
  if (licenseAction) {
    const process = environmentalProcesses.find((item) => String(item.id) === String(licenseAction.dataset.processId));
    if (!process) return;
    if (licenseAction.dataset.licenseAction === "expand") {
      setProcessCurrentStage(process, 1);
      process.status = "open";
      process.statusLabel = processStatusLabel("open");
      process.risk = "Ampliacao";
      process.due = "Processo reaberto para ampliacao";
      openEnvironmentalProcessDetail(process.id);
      return;
    }
    if (licenseAction.dataset.licenseAction === "renew") {
      const licenseStageNumber = Number(licenseAction.dataset.stageNumber);
      const documentStage = [...ensureProcessStages(process)].reverse().find((stage) => isDocumentStage(stage) && stage.number < licenseStageNumber);
      setProcessCurrentStage(process, documentStage?.number || licenseStageNumber);
      process.status = "open";
      process.statusLabel = processStatusLabel("open");
      process.risk = "Renovacao";
      process.due = "Renovacao da licenca em andamento";
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

field("environmental-process-complete-stage")?.addEventListener("click", () => {
  const process = environmentalProcesses.find((item) => String(item.id) === String(field("environmental-stage-process-id").value));
  if (!process) return;
  const stageNumber = Number(field("environmental-stage-number").value) || currentProcessStage(process).number;
  const stage = ensureProcessStages(process).find((item) => item.number === stageNumber) || currentProcessStage(process);
  saveCurrentStageForm(process, stage);
  const gateText = stageRequiredMessage(process, stage);
  if (gateText) {
    renderCurrentStageScreen(process, stage);
    return;
  }
  completeProcessStage(process, stage.number);
  renderProcessDetail(process);
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
    if (stage.number >= stageNumber) stage.status = "Nao iniciada";
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
    saveCurrentStageForm(process, stage);
    renderProcessDetail(process);
  }
  closeModal("environmental-stage-modal");
});

["environmental-stage-protocol-number", "environmental-stage-protocol-date", "environmental-stage-license-number", "environmental-stage-license-expiry"].forEach((id) => {
  field(id)?.addEventListener("input", refreshActiveStageGate);
  field(id)?.addEventListener("change", refreshActiveStageGate);
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
  generatedBy: "Usuario DocGestor by Carminatti",
  organization: "Grupo Carminatti",
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
              <strong>${escapePdfText(value || "Nao informado")}</strong>
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
                <tr>${row.map((cell) => `<td>${escapePdfText(cell || "Nao informado")}</td>`).join("")}</tr>
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
  return `
    <section class="pdf-section ${section.className || ""}">
      <h2>${escapePdfText(section.title)}</h2>
      ${section.bodyHtml}
    </section>
  `;
}

function pdfDocumentHtml(report) {
  const orientation = report.orientation || "portrait";
  const pages = paginatePdfSections(report.sections, orientation);
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
            min-height: ${orientation === "landscape" ? "210mm" : "297mm"};
            margin: 0 auto 10mm;
            overflow: visible;
            padding: ${PDF_STANDARD.margin};
            width: ${orientation === "landscape" ? "297mm" : "210mm"};
            break-after: page;
            page-break-after: always;
          }
          .pdf-page:last-child {
            break-after: auto;
            page-break-after: auto;
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
            grid-template-columns: 1fr auto;
            gap: 12px;
            padding-top: 4mm;
          }
          @media print {
            body { background: #fff; }
            .pdf-page { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${pages
          .map(
            (pageSections, index) => `
              <main class="pdf-page ${index === 0 ? "pdf-page-first" : "pdf-page-continuation"}">
                ${
                  index === 0
                    ? `
                      <header class="pdf-header">
                        <div class="pdf-brand">
                          <span class="pdf-wordmark">
                            <strong><span class="pdf-doc">Doc</span><span class="pdf-gestor">Gestor</span></strong>
                            <small><span class="pdf-by">by</span> <span class="pdf-carminatti">Carminatti</span></small>
                          </span>
                        </div>
                        <div class="pdf-meta">
                          <strong>${escapePdfText(report.module || "Relatorio")}</strong>
                          <span>Formato ${PDF_STANDARD.page} - ${orientation === "landscape" ? "Paisagem" : "Retrato"}</span>
                          <span>Gerado em ${escapePdfText(generatedAt)}</span>
                        </div>
                      </header>
                      <section class="pdf-title">
                        <h1>${escapePdfText(report.title)}</h1>
                        <p>${escapePdfText(report.subtitle || "Documento gerado automaticamente pelo DocGestor by Carminatti.")}</p>
                      </section>
                    `
                    : ""
                }
                <div class="pdf-body">
                  ${pageSections.map(renderPdfSection).join("")}
                </div>
                <footer class="pdf-footer">
                  <span>Documento gerado automaticamente pelo DocGestor by Carminatti. Conferir dados antes de protocolo externo.</span>
                  <span>Pagina ${index + 1} de ${pages.length}</span>
                </footer>
              </main>
            `,
          )
          .join("")}
        <script>
          window.addEventListener("load", () => {
            setTimeout(() => window.print(), 250);
          });
        </script>
      </body>
    </html>
  `;
}

function openPdfReport(report) {
  const pdfWindow = window.open("", "_blank");
  if (!pdfWindow) {
    alert("O navegador bloqueou a janela do PDF. Autorize pop-ups para baixar o relatorio.");
    return;
  }
  pdfWindow.document.open();
  pdfWindow.document.write(pdfDocumentHtml(report));
  pdfWindow.document.close();
}

function companyNameById(id) {
  return companies.find((company) => company.id === id)?.name || "Nao informado";
}

function partnerNameById(id) {
  return partners.find((partner) => partner.id === id)?.name || "Nao informado";
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
    title: "Relatorio de Socios e Responsaveis Legais",
    module: "01.2.1 Socios",
    subtitle: "Listagem administrativa usada para alimentar empresas, imoveis, empreendimentos e licencas.",
    sections: [
      pdfTableSection(
        "Socios cadastrados",
        ["Nome", "Documento", "Funcao", "Contato", "Telefone", "Status"],
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
      .filter((company) => company.kind === "branch" && company.parentId === matrix.id)
      .filter((company) => !branchIds.length || branchIds.includes(String(company.id)))
      .sort((a, b) => a.cnpj.localeCompare(b.cnpj))
      .forEach((branch) => {
        rows.push([branch.cnpj, branch.name, `Filial de ${matrix.cnpj}`, branch.tradeName, branch.partners.join(", "), branch.status]);
      });
  });

  return {
    title: "Relatorio de Empresas e Filiais",
    module: "01.2.2 Empresas e Filiais",
    subtitle: filters.summary || "Matrizes e filiais ordenadas por CNPJ, com vinculo de socios.",
    orientation: "landscape",
    sections: [pdfTableSection("Empresas cadastradas", ["CNPJ", "Razao social / filial", "Tipo", "Nome fantasia", "Socios", "Status"], rows, { rowEstimate: 32 })],
  };
}

function buildPropertiesRelationReport(filteredProperties, filters = {}) {
  return {
    title: "Relacao de Imoveis",
    module: "01.2.3 Imoveis",
    subtitle: filters.summary || "Ficha consolidada dos imoveis cadastrados.",
    sections: filteredProperties.map((property) => {
      const isRural = property.type === "rural";
      const reserveRequired = propertyReserveRequired(property);
      const reserveOk = propertyReserveOk(property);
      return pdfFieldsSection(`Matricula ${property.registration}`, [
        ["Proprietario", propertyOwnerLabel(property)],
        ["Tipo de proprietario", property.ownerType === "pf" ? "Pessoa fisica" : "Pessoa juridica"],
        ["Tipo de imovel", isRural ? "Rural" : "Urbano"],
        ["Referencia", property.reference],
        ["Lote", property.lot],
        [isRural ? "Gleba" : "Quadra", isRural ? property.glebe : property.block],
        ["Area total", isRural ? `${formatAreaM2(property.ruralArea)} / ${formatAreaHa(property.ruralArea)}` : formatAreaM2(property.urbanArea)],
        ["Reserva legal", isRural ? `${formatAreaM2(property.legalReserve)} / ${formatAreaHa(property.legalReserve)}` : "Nao aplicavel"],
        ["APP", isRural ? `${formatAreaM2(property.appArea)} / ${formatAreaHa(property.appArea)}` : "Nao aplicavel"],
        ["Reserva exigida", isRural ? `${formatAreaM2(reserveRequired)} / ${formatAreaHa(reserveRequired)}` : "Nao aplicavel"],
        ["Conformidade ambiental", reserveOk ? "Reserva legal em conformidade" : "Reserva legal abaixo de 20%"],
        ["Construcao", property.hasConstruction ? `${property.constructionArea || 0} m2` : "Nao informada"],
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
      `Matricula ${property.registration}`,
      propertyOwnerLabel(property),
      property.reference || "Nao informada",
      `${formatAreaM2(property.ruralArea)} / ${formatAreaHa(property.ruralArea)}`,
      `${formatAreaM2(property.legalReserve)} / ${formatAreaHa(property.legalReserve)}`,
      `${formatAreaM2(property.appArea)} / ${formatAreaHa(property.appArea)}`,
      `${formatAreaM2(requiredByProperty)} / ${formatAreaHa(requiredByProperty)}`,
      propertyReserveOk(property) ? "Conforme" : "Abaixo de 20%",
    ];
  });

  return {
    title: "Relatorio Ambiental de Imoveis",
    module: "01.2.3 Imoveis",
    subtitle: filters.summary || "Analise consolidada de area rural, reserva legal e APP.",
    orientation: "landscape",
    sections: [
      pdfTableSection(
        "Imoveis rurais analisados",
        ["Imovel", "Proprietario", "Referencia", "Area total", "Reserva legal", "APP", "Reserva exigida", "Situacao"],
        rows.length ? rows : [["Nenhum imovel rural encontrado", "", "", "", "", "", "", ""]],
        { rowEstimate: 42, headerEstimate: 82 },
      ),
      pdfFieldsSection("Totalizador ambiental", [
        ["Quantidade de imoveis", ruralProperties.length],
        ["Area total somada", `${formatAreaM2(totals.area)} / ${formatAreaHa(totals.area)}`],
        ["Reserva legal somada", `${formatAreaM2(totals.reserve)} / ${formatAreaHa(totals.reserve)}`],
        ["APP somada", `${formatAreaM2(totals.app)} / ${formatAreaHa(totals.app)}`],
        ["Reserva legal exigida 20%", `${formatAreaM2(required)} / ${formatAreaHa(required)}`],
        ["Resultado consolidado", isOk ? "Conforme a exigencia minima de 20%" : "Reserva legal consolidada abaixo de 20%"],
      ], { estimate: 160 }),
      pdfSection(
        "Criterio tecnico aplicado",
        `<p class="pdf-note">A APP foi demonstrada separadamente para indicar existencia de area ambiental protegida. Ela esta contida na reserva legal e nao foi somada novamente ao calculo consolidado.</p>`,
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
    title: "Relatorio de Empreendimentos",
    module: "01.2.4 Empreendimento",
    subtitle: "Empreendimentos vinculados a empresas e imoveis.",
    sections: [
      pdfTableSection(
        "Empreendimentos cadastrados",
        ["Nome", "Empresa", "Imovel", "Tipo", "Status", "Responsavel", "Referencia"],
        enterprises.map((enterprise) => [enterprise.name, enterprise.company, enterprise.property, enterprise.type, enterprise.status, enterprise.responsible, enterprise.reference]),
        { rowEstimate: 38 },
      ),
    ],
    orientation: "landscape",
  };
}

function buildLicenseTypesReport() {
  return {
    title: "Relatorio de Tipos de Licencas Ambientais",
    module: "01.3.1 Tipos de Licencas",
    subtitle: "Classificacao e validade padrao dos tipos de licenca.",
    sections: [
      pdfTableSection(
        "Tipos cadastrados",
        ["Nome", "Sigla", "Classificacao", "Validade", "Renovacao"],
        environmentalLicenseTypes.map((item) => [item.name, item.code, item.phases.join(", "), item.validity, item.renewal]),
      ),
    ],
  };
}

function buildEnvironmentalDocumentsReport() {
  return {
    title: "Relatorio de Documentos Ambientais",
    module: "01.3.2 Documentos",
    subtitle: "Documentos vinculados aos tipos de licenca ambiental.",
    orientation: "landscape",
    sections: [
      pdfTableSection(
        "Documentos cadastrados",
        ["Documento", "Licencas vinculadas", "Exige vencimento", "Obrigatorio"],
        environmentalDocuments.map((item) => [item.name, item.licenses.join(", "), item.expiration, item.required]),
        { rowEstimate: 38 },
      ),
    ],
  };
}

function buildChecklistModelsReport() {
  return {
    title: "Relatorio de Modelos de Check-list",
    module: "01.3.3 Modelos de Check-list",
    subtitle: "Modelos que alimentam a criacao de novas licencas ambientais.",
    orientation: "landscape",
    sections: [
      pdfTableSection(
        "Modelos cadastrados",
        ["Modelo", "Tipo de licenca", "Documentos selecionados"],
        checklistModelsAdmin.map((item) => [item.name, item.license, item.documents.join(", ")]),
        { rowEstimate: 42 },
      ),
    ],
  };
}

function formatPdfDate(value) {
  return value ? formatAgendaDate(value) : "Nao informado";
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
    formatPdfDate(license.expiryDate),
    license.status,
  ]);
  const processColumns = ["Processo", "Empreendimento", "Tipo de licenca", "Etapa atual", "Progresso", "Prazo / situacao"];

  return {
    title: "Relatorio do Modulo Ambiental",
    module: "03.1 Modulo operacional",
    subtitle: "Processos ambientais em aberto, pendentes, vencidos e licencas ativas.",
    orientation: "landscape",
    sections: [
      pdfFieldsSection("Resumo operacional", [
        ["Processos relacionados", openRows.length + pendingRows.length + expiredRows.length],
        ["Licencas ativas", activeLicenses().length],
        ["Abertas", openRows.length],
        ["Pendentes", pendingRows.length],
        ["Vencidas", expiredRows.length],
      ], { estimate: 170 }),
      pdfTableSection("Abertas", processColumns, fallbackPdfRows(openRows, processColumns), { rowEstimate: 38 }),
      pdfTableSection("Pendentes", processColumns, fallbackPdfRows(pendingRows, processColumns), { rowEstimate: 38 }),
      pdfTableSection("Vencidas", processColumns, fallbackPdfRows(expiredRows, processColumns), { rowEstimate: 38 }),
      pdfTableSection("Licencas", ["Licenca", "Tipo", "Processo", "Empresa", "Vencimento", "Status"], fallbackPdfRows(licenseRows, ["Licenca", "Tipo", "Processo", "Empresa", "Vencimento", "Status"]), { rowEstimate: 36 }),
    ],
  };
}

function buildEnvironmentalStatusReport(status = currentLicenseStatus) {
  environmentalProcesses.forEach((process) => {
    ensureProcessStages(process);
    updateProcessProgress(process);
  });
  const meta = licenseStatusMeta[status] || licenseStatusMeta.general;
  const processColumns = ["Processo", "Empreendimento", "Tipo de licenca", "Etapa atual", "Progresso", "Prazo / situacao"];

  if (status === "licenses") {
    const licenseRows = activeLicenses().map((license) => [
      license.number,
      license.type,
      license.processNumber,
      license.company,
      formatPdfDate(license.expiryDate),
      license.status,
    ]);
    return {
      title: "Relatorio de Licencas",
      module: "03.1.5 Licencas",
      subtitle: "Licencas ambientais ativas geradas pelos processos ambientais.",
      orientation: "landscape",
      sections: [
        pdfFieldsSection("Resumo", [
          ["Licencas listadas", licenseRows.length],
          ["Modulo", "03.1.5 Licencas"],
        ], { estimate: 120 }),
        pdfTableSection("Licencas", ["Licenca", "Tipo", "Processo", "Empresa", "Vencimento", "Status"], fallbackPdfRows(licenseRows, ["Licenca", "Tipo", "Processo", "Empresa", "Vencimento", "Status"]), { rowEstimate: 36 }),
      ],
    };
  }

  const processRows = environmentalProcessReportRows(status);
  return {
    title: `Relatorio - ${meta.title}`,
    module: meta.title,
    subtitle: meta.subtitle,
    orientation: "landscape",
    sections: [
      pdfFieldsSection("Resumo", [
        ["Processos listados", processRows.length],
        ["Modulo", meta.title],
      ], { estimate: 120 }),
      pdfTableSection(meta.title.replace(/^03\.1\.\d+\s+/, ""), processColumns, fallbackPdfRows(processRows, processColumns), { rowEstimate: 38 }),
    ],
  };
}

function buildEnvironmentalContextReport() {
  return currentLicenseStatus === "general" ? buildEnvironmentalModuleReport() : buildEnvironmentalStatusReport(currentLicenseStatus);
}

function buildEnvironmentalProcessDossier(process) {
  ensureProcessStages(process);
  updateProcessProgress(process);
  const currentStage = currentProcessStage(process);
  const stageRows = ensureProcessStages(process).map((stage) => {
    const record = process.stageRecords?.[stage.number] || {};
    const documentCount = process.stageDocuments?.[stage.number]?.length || 0;
    const preparedCount = (process.stageDocuments?.[stage.number] || []).filter((item) => item.prepared).length;
    const detail = isProtocolStage(stage)
      ? `${record.protocolNumber || "Sem protocolo"} - ${formatPdfDate(record.protocolDate)}`
      : isLicenseStage(stage)
        ? `${record.licenseNumber || "Sem licenca"} - venc. ${formatPdfDate(record.expiryDate)}`
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
      documentItem.notes || "Sem observacoes",
    ]),
  );
  const licenseRows = (process.licenseHistory || []).map((license) => [
    license.number,
    license.type,
    `Etapa ${license.stageNumber}`,
    formatPdfDate(license.expiryDate),
    license.status,
  ]);

  return {
    title: `Dossie do Processo ${process.internalNumber || process.number}`,
    module: "03.1 Licencas Ambientais",
    subtitle: process.title,
    orientation: "portrait",
    sections: [
      pdfFieldsSection("Dados principais", [
        ["Processo interno", process.internalNumber || process.number],
        ["Numero oficial / licenca atual", process.number || "Nao informado"],
        ["Formato", process.licensingFormatLabel || "Nao definido"],
        ["Tipo de licenca", process.type],
        ["Empresa", process.company],
        ["Imovel", process.property || "Nao informado"],
        ["Responsavel", process.responsible],
        ["Status", process.statusLabel || processStatusLabel(process.status)],
        ["Etapa atual", currentStage?.name || "Concluido"],
        ["Progresso", `${process.progress || 0}%`],
        ["Prazo / situacao", process.due],
        ["Observacoes", process.notes || "Sem observacoes"],
      ], { estimate: 260 }),
      pdfTableSection("Etapas do processo", ["Etapa", "Nome", "Status", "Detalhe"], stageRows, { rowEstimate: 38 }),
      pdfTableSection("Documentos do processo", ["Etapa", "Documento", "Situacao", "Observacoes"], fallbackPdfRows(documentRows, ["Etapa", "Documento", "Situacao", "Observacoes"]), { rowEstimate: 38 }),
      pdfTableSection("Licencas geradas no processo", ["Licenca", "Tipo", "Etapa", "Vencimento", "Status"], fallbackPdfRows(licenseRows, ["Licenca", "Tipo", "Etapa", "Vencimento", "Status"]), { rowEstimate: 34 }),
    ],
  };
}

function buildEnvironmentalLicenseDossier(license) {
  const process = license.process || environmentalProcesses.find((item) => String(item.id) === String(license.processId));
  const stage = process ? ensureProcessStages(process).find((item) => item.number === Number(license.stageNumber)) : null;
  const record = process?.stageRecords?.[license.stageNumber] || {};
  const previousLicenses = (process?.licenseHistory || []).filter((item) => item.stageNumber <= license.stageNumber);

  return {
    title: `Dossie da Licenca ${license.number}`,
    module: "03.1.5 Licencas",
    subtitle: `${license.type} - ${license.company}`,
    orientation: "portrait",
    sections: [
      pdfFieldsSection("Licenca ambiental", [
        ["Numero da licenca", license.number],
        ["Tipo", license.type],
        ["Status", license.status],
        ["Vencimento", formatPdfDate(license.expiryDate)],
        ["Processo interno", license.processNumber],
        ["Empreendimento", license.title],
        ["Empresa", license.company],
        ["Responsavel", license.responsible],
        ["Etapa de origem", stage ? `${stage.number} - ${stage.name}` : `Etapa ${license.stageNumber}`],
        ["Registro da etapa", record.licenseNumber || license.number],
      ], { estimate: 230 }),
      pdfFieldsSection("Processo vinculado", [
        ["Formato", process?.licensingFormatLabel || "Nao informado"],
        ["Tipos previstos", process?.type || license.type],
        ["Imovel", process?.property || "Nao informado"],
        ["Progresso", process ? `${process.progress || 0}%` : "Nao informado"],
        ["Situacao", process?.statusLabel || processStatusLabel(process?.status)],
        ["Prazo / situacao", process?.due || "Nao informado"],
      ], { estimate: 180 }),
      pdfTableSection("Historico de licencas do processo", ["Licenca", "Tipo", "Etapa", "Vencimento", "Status"], fallbackPdfRows(
        previousLicenses.map((item) => [item.number, item.type, `Etapa ${item.stageNumber}`, formatPdfDate(item.expiryDate), item.status]),
        ["Licenca", "Tipo", "Etapa", "Vencimento", "Status"],
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
  if (!totalCount) return "Nenhum disponivel";
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
  const branchText = summarizeSelection(pdfFilterState.companyBranchIds.length, availableBranches.length, "todas as filiais disponiveis", "filial(is)");
  return `PDF com ${matrixText} e ${branchText}`;
}

function updateCompanyPdfSummaries() {
  const matrixSummary = field("company-pdf-matrix-summary");
  const branchSummary = field("company-pdf-branch-summary");
  const preview = field("company-pdf-preview");
  if (matrixSummary) matrixSummary.textContent = summarizeSelection(pdfFilterState.companyMatrixIds.length, matrixCompanies().length, "Todas as matrizes", "matriz(es)");
  if (branchSummary) branchSummary.textContent = summarizeSelection(pdfFilterState.companyBranchIds.length, companyPdfBranches(pdfFilterState.companyMatrixIds).length, "Todas as filiais disponiveis", "filial(is)");
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
  const type = filters.reportType === "environmental" ? "Ambiental" : "Relacao de Imoveis";
  const scope = filters.selectionMode === "selected" ? "imoveis selecionados" : "imoveis filtrados";
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
  if (ownerSummary) ownerSummary.textContent = summarizeSelection(pdfFilterState.propertyOwners.length, propertyOwnersForPdf().length, "Todos os proprietarios", "proprietario(s)");
  if (propertySummary) propertySummary.textContent = summarizeSelection(pdfFilterState.propertyIds.length, availableProperties.length, "Todos os imoveis filtrados", "imovel(is)");
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
        ? "No relatorio ambiental, o sistema totaliza area, reserva legal e APP, validando a exigencia de 20%."
        : "Na relacao de imoveis, o PDF monta fichas cadastrais completas dos imoveis filtrados.";
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
        const matrix = companies.find((company) => company.id === branch.parentId);
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
      title: "Selecionar proprietarios",
      context: "01.2.3 Imoveis",
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
      title: "Selecionar imoveis",
      context: "01.2.3 Imoveis",
      options: available.map((property) => ({
        value: String(property.id),
        label: `Matricula ${property.registration} - ${propertyOwnerLabel(property)}`,
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
        : "<small>Nenhuma opcao disponivel para o filtro atual.</small>"
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
    addPdfButton(actionWrap, "Baixar relatorio", "environmentalModule");
    environmentalHead.appendChild(actionWrap);
  }
}

installPdfButtons();
