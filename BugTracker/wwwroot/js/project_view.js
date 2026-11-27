const API_BASE_URL = "";

const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";

const projectForm = document.getElementById("project-form");

const projectNameInput = document.getElementById("project-name");
const repositoryInput = document.getElementById("repository");
const repositoryLink = document.getElementById("repository-link");

const projectTitle = document.getElementById("project-title");
const breadcrumbProjectName = document.getElementById(
  "breadcrumb-project-name",
);

const projectDate = document.getElementById("project-date");
const projectStatus = document.getElementById("project-status");
const projectMessage = document.getElementById("project-message");

const saveButton = document.getElementById("save-project");
const publishButton = document.getElementById("publish-project");

const profileName = document.getElementById("profile-name");
const profileRole = document.getElementById("profile-role");
const changeRoleLink = document.getElementById("change-role");
const logoutButton = document.getElementById("logout-button");

const developerList = document.getElementById("developer-list");
const ticketsBody = document.getElementById("tickets-body");

const ticketSearch = document.getElementById("ticket-search");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const onlyMine = document.getElementById("only-mine");
const hideClosed = document.getElementById("hide-closed");

const bugStatusLabels = {
  NotFixed: "Не исправлен",
  InProgress: "В разработке",
  Fixed: "Исправлен",
};

const reviewStatusLabels = {
  NotFixed: "Не исправлен",
  Fixed: "Исправлен",
};

const priorityLabels = {
  High: "Высокий",
  Medium: "Средний",
  Low: "Низкий",
};

let token = localStorage.getItem(TOKEN_KEY);
let currentUserId = null;
let currentRole = null;

let project = null;
let tickets = [];
let isBusy = false;

const projectId = getProjectId();


function getProjectId() {
  const value = new URLSearchParams(window.location.search).get("id");

  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function readJwtPayload(jwt) {
  try {
    const parts = jwt.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "=",
    );

    const bytes = Uint8Array.from(
      atob(paddedBase64),
      (character) => character.charCodeAt(0),
    );

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function initializeIdentity() {
  if (!token) {
    return false;
  }

  const payload = readJwtPayload(token);

  if (!payload) {
    return false;
  }

  const userId = Number(payload.sub);
  const role = payload.role;

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    !["Developer", "Tester"].includes(role)
  ) {
    return false;
  }

  currentUserId = userId;
  currentRole = role;

  return true;
}

function renderProfile() {
  profileName.textContent = `Пользователь #${currentUserId}`;

  profileRole.textContent =
    currentRole === "Developer"
      ? "Роль: Разработчик"
      : "Роль: Тестировщик";
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);

  token = null;
  currentUserId = null;
  currentRole = null;
}

function redirectToLogin() {
  clearSession();
  window.location.href = "login.html";
}

function showMessage(message) {
  projectMessage.textContent = message;
}

function clearMessage() {
  projectMessage.textContent = "";
}

async function readError(response) {
  if (response.status === 401) {
    return "Сессия недействительна или истекла. Войдите повторно.";
  }

  try {
    const data = await response.json();

    if (data.errors && typeof data.errors === "object") {
      const messages = Object.values(data.errors).flat();

      const firstMessage = messages.find(
        (message) => typeof message === "string",
      );

      if (firstMessage) {
        return firstMessage;
      }
    }

    if (typeof data.detail === "string" && data.detail) {
      return data.detail;
    }

    if (typeof data.title === "string" && data.title) {
      return data.title;
    }
  } catch {
  }

  if (response.status === 403) {
    return "У вас нет доступа к этому действию.";
  }

  if (response.status === 404) {
    return "Запрошенные данные не найдены.";
  }

  if (response.status === 409) {
    return "Данные изменились. Обновите страницу и повторите действие.";
  }

  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});

  headers.set("Authorization", `Bearer ${token}`);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = new Error(await readError(response));
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function handleRequestError(error) {
  if (error.status === 401) {
    showMessage(
      "Сессия недействительна или истекла. Войдите повторно.",
    );


    clearSession();
    updateControls();
    changeRoleLink.hidden = true;
    return;
  }

  showMessage(
    error.message || "Не удалось выполнить запрос.",
  );
}

logoutButton.addEventListener("click", redirectToLogin);

changeRoleLink.addEventListener("click", async (event) => {
  event.preventDefault();

  if (isBusy || !token || !currentRole) {
    return;
  }

  const targetRole =
    currentRole === "Developer"
      ? "Tester"
      : "Developer";

  isBusy = true;
  updateControls();
  showMessage("Смена роли…");

  try {
    const response = await apiRequest("/api/auth/switch-role", {
      method: "POST",
      body: JSON.stringify({
        role: targetRole,
      }),
    });

    if (!response.token || !response.role) {
      throw new Error("Сервер вернул некорректный ответ.");
    }

    // После смены роли необходимо использовать новый токен.
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(ROLE_KEY, response.role);

    token = response.token;

    if (!initializeIdentity()) {
      clearSession();
      throw new Error(
        "Не удалось прочитать новую сессию. Войдите повторно.",
      );
    }

    renderProfile();

    const refreshedProject = await apiRequest(
      `/api/projects/${projectId}`,
    );

    project = refreshedProject;
    tickets = Array.isArray(refreshedProject.tickets)
      ? refreshedProject.tickets
      : [];

    renderProject();
    showMessage("Роль изменена.");
  } catch (error) {
    if (error.status === 403 && token) {

      const payload = readJwtPayload(token);

      if (payload && payload.role === targetRole) {
        project = null;
        tickets = [];

        projectTitle.textContent = "Проект недоступен";
        breadcrumbProjectName.textContent = "Проект";
        projectDate.textContent = "";
        projectStatus.textContent = "";

        projectNameInput.value = "";
        repositoryInput.value = "";
        repositoryLink.hidden = true;

        developerList.replaceChildren();
        ticketsBody.replaceChildren();

        showMessage(
          "Роль изменена, но у новой роли нет доступа к этому проекту.",
        );
        return;
      }
    }

    handleRequestError(error);
  } finally {
    isBusy = false;
    updateControls();
  }
});


function formatDate(value, includeTime = false) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("ru-RU", options).format(date);
}

function canEditProject() {
  if (!token || !project || currentRole !== "Developer") {
    return false;
  }

  if (project.authorId === currentUserId) {
    return true;
  }

  return (
    Boolean(project.publishedAt) &&
    Array.isArray(project.developerIds) &&
    project.developerIds.includes(currentUserId)
  );
}

function canPublishProject() {
  return Boolean(
    token &&
      project &&
      currentRole === "Developer" &&
      project.authorId === currentUserId &&
      !project.publishedAt,
  );
}

function updateControls() {
  const canEdit = canEditProject();

  projectNameInput.disabled = isBusy || !canEdit;
  saveButton.disabled = isBusy || !canEdit;
  publishButton.disabled = isBusy || !canPublishProject();

  if (project && project.publishedAt) {
    publishButton.textContent = "✓ Опубликован";
  } else {
    publishButton.textContent = "Опубликовать";
  }
}

function renderProject() {
  document.title = `${project.name} — BugTracker`;

  projectTitle.textContent = project.name;
  breadcrumbProjectName.textContent = project.name;

  projectNameInput.value = project.name;
  repositoryInput.value = project.repositoryUrl;

  try {
    const url = new URL(project.repositoryUrl);

    if (url.protocol === "http:" || url.protocol === "https:") {
      repositoryLink.href = url.href;
      repositoryLink.hidden = false;
    } else {
      repositoryLink.removeAttribute("href");
      repositoryLink.hidden = true;
    }
  } catch {
    repositoryLink.removeAttribute("href");
    repositoryLink.hidden = true;
  }

  if (project.publishedAt) {
    projectDate.textContent =
      `Опубликован ${formatDate(project.publishedAt)}`;

    projectStatus.textContent = "Опубликован";
    projectStatus.className = "chip chip--info";
  } else {
    projectDate.textContent =
      `Создан ${formatDate(project.createdAt)}`;

    projectStatus.textContent = "Черновик";
    projectStatus.className = "chip chip--neutral";
  }

  renderDevelopers();
  renderTickets();
  updateControls();
}

function renderDevelopers() {
  developerList.replaceChildren();

  const developerIds = Array.isArray(project.developerIds)
    ? project.developerIds
    : [];

  if (developerIds.length === 0) {
    developerList.textContent = "Нет участников";
    return;
  }

  developerIds.forEach((id) => {
    const chip = document.createElement("span");
    chip.className = "developer-chip";

    chip.textContent =
      id === project.authorId
        ? `Разработчик #${id} · автор`
        : `Разработчик #${id}`;

    developerList.append(chip);
  });
}

async function loadProject() {
  isBusy = true;
  updateControls();
  showMessage("Загрузка проекта…");

  try {
    const data = await apiRequest(`/api/projects/${projectId}`);

    project = data;

    tickets = Array.isArray(data.tickets)
      ? data.tickets
      : [];

    renderProject();
    clearMessage();
  } catch (error) {
    projectTitle.textContent = "Не удалось загрузить проект";
    breadcrumbProjectName.textContent = "Проект";

    handleRequestError(error);
  } finally {
    isBusy = false;
    updateControls();
  }
}

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isBusy || !canEditProject()) {
    return;
  }

  const name = projectNameInput.value.trim();

  if (!name) {
    showMessage("Введите название проекта.");
    projectNameInput.focus();
    return;
  }

  if (name.length > 100) {
    showMessage(
      "Название проекта не должно превышать 100 символов.",
    );

    projectNameInput.focus();
    return;
  }

  isBusy = true;
  updateControls();
  showMessage("Сохранение…");

  try {
    const updatedProject = await apiRequest(
      `/api/projects/${projectId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name,
        }),
      },
    );

    project = {
      ...project,
      ...updatedProject,
    };

    renderProject();
    showMessage("Проект сохранён.");
  } catch (error) {
    handleRequestError(error);
  } finally {
    isBusy = false;
    updateControls();
  }
});

publishButton.addEventListener("click", async () => {
  if (isBusy || !canPublishProject()) {
    return;
  }

  if (projectNameInput.value.trim() !== project.name) {
    showMessage(
      "Сначала сохраните изменённое название проекта.",
    );
    return;
  }

  isBusy = true;
  updateControls();
  showMessage("Публикация…");

  try {
    const publishedProject = await apiRequest(
      `/api/projects/${projectId}/publish`,
      {
        method: "POST",
      },
    );

    project = {
      ...project,
      ...publishedProject,
    };

    renderProject();

    try {
      const refreshedProject = await apiRequest(
        `/api/projects/${projectId}`,
      );

      project = refreshedProject;

      tickets = Array.isArray(refreshedProject.tickets)
        ? refreshedProject.tickets
        : [];

      renderProject();
      showMessage("Проект опубликован.");
    } catch (error) {
      if (error.status === 401) {
        handleRequestError(error);
      } else {
        showMessage(
          "Проект опубликован, но обновить тикеты не удалось. Обновите страницу.",
        );
      }
    }
  } catch (error) {
    handleRequestError(error);
  } finally {
    isBusy = false;
    updateControls();
  }
});


function chipClass(value) {
  const classes = {
    Исправлен: "chip--success",
    "В разработке": "chip--warning",
    "Не исправлен": "chip--danger",
    Высокий: "chip--danger",
    Средний: "chip--warning",
    Низкий: "chip--neutral",
  };

  return classes[value] || "chip--neutral";
}

function verificationChipClass(value) {
  return value === "Исправлен"
    ? "chip--success-outline"
    : "chip--outline";
}

function createChip(text, className) {
  const chip = document.createElement("span");

  chip.className = `chip ${className}`;
  chip.textContent = text;

  return chip;
}

function addTextCell(row, text, className = "") {
  const cell = document.createElement("td");

  cell.textContent = text;

  if (className) {
    cell.className = className;
  }

  row.append(cell);
}

function addChipCell(row, text, className) {
  const cell = document.createElement("td");

  cell.append(createChip(text, className));
  row.append(cell);
}

function renderTickets() {
  const search = ticketSearch.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedPriority = priorityFilter.value;

  const filteredTickets = tickets.filter((ticket) => {
    const bugStatus =
      bugStatusLabels[ticket.bugStatus] ||
      ticket.bugStatus ||
      "—";

    const priority =
      priorityLabels[ticket.priority] || "—";

    const title = ticket.title || "";

    const matchesSearch =
      title.toLowerCase().includes(search) ||
      String(ticket.id).includes(search);

    const matchesStatus =
      selectedStatus === "all" ||
      bugStatus === selectedStatus;

    const matchesPriority =
      selectedPriority === "all" ||
      priority === selectedPriority;

    const matchesMine =
      !onlyMine.checked ||
      ticket.assignee?.id === currentUserId;


    const matchesClosed =
      !hideClosed.checked ||
      ticket.reviewStatus !== "Fixed";

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesMine &&
      matchesClosed
    );
  });

  ticketsBody.replaceChildren();

  if (filteredTickets.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;

    if (!project?.publishedAt) {
      cell.textContent =
        "Тикеты доступны после публикации проекта.";
    } else if (tickets.length === 0) {
      cell.textContent = "В проекте пока нет тикетов.";
    } else {
      cell.textContent =
        "По заданным фильтрам тикеты не найдены.";
    }

    row.append(cell);
    ticketsBody.append(row);
    return;
  }

  filteredTickets.forEach((ticket) => {
    const row = document.createElement("tr");

    const bugStatus =
      bugStatusLabels[ticket.bugStatus] ||
      ticket.bugStatus ||
      "—";

    const reviewStatus =
      reviewStatusLabels[ticket.reviewStatus] ||
      ticket.reviewStatus ||
      "—";

    const priority =
      priorityLabels[ticket.priority] || "—";

    const assignee = ticket.assignee
      ? [
          ticket.assignee.firstName,
          ticket.assignee.lastName,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

    const deadline = formatDate(ticket.deadline, true);

    const deadlineTime = ticket.deadline
      ? new Date(ticket.deadline).getTime()
      : NaN;

    const isOverdue =
      Number.isFinite(deadlineTime) &&
      deadlineTime < Date.now() &&
      ticket.reviewStatus !== "Fixed";

    addTextCell(
      row,
      `#${ticket.id}`,
      "data-table__number",
    );


    addTextCell(
      row,
      ticket.title || "Без названия",
    );

    addChipCell(
      row,
      bugStatus,
      chipClass(bugStatus),
    );

    addChipCell(
      row,
      reviewStatus,
      verificationChipClass(reviewStatus),
    );

    addChipCell(
      row,
      priority,
      chipClass(priority),
    );

    addTextCell(
      row,
      assignee || "Не назначен",
      assignee ? "" : "data-table__muted",
    );

    addTextCell(
      row,
      deadline,
      isOverdue ? "data-table__overdue" : "",
    );

    ticketsBody.append(row);
  });
}

ticketSearch.addEventListener("input", renderTickets);
statusFilter.addEventListener("change", renderTickets);
priorityFilter.addEventListener("change", renderTickets);
onlyMine.addEventListener("change", renderTickets);
hideClosed.addEventListener("change", renderTickets);


if (!token) {
  window.location.href = "login.html";
} else if (!initializeIdentity()) {
  clearSession();

  projectTitle.textContent =
    "Не удалось определить пользователя";

  showMessage("Войдите в аккаунт повторно.");

  changeRoleLink.hidden = true;
} else {
  renderProfile();

  if (!projectId) {
    projectTitle.textContent = "Проект не выбран";

    showMessage(
      "В адресе страницы нет корректного ID проекта. Откройте проект из списка.",
    );
  } else {
    loadProject();
  }
}