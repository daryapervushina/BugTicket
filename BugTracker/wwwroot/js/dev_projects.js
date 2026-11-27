const API_BASE_URL = "";

const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";

const projectsList = document.getElementById("projects-list");
const emptyState = document.getElementById("empty-state");
const projectsMessage = document.getElementById("projects-message");

const createButton = document.getElementById("create-project");
const createEmptyButton = document.getElementById("create-project-empty");

const profileName = document.getElementById("profile-name");
const profileRole = document.getElementById("profile-role");

const logoutButton = document.getElementById("logout-button");
const changeRoleLink = document.getElementById("change-role");

const navProjectsLabel = document.getElementById("nav-projects-label");
const topbarTitle = document.getElementById("topbar-title");
const pageTitle = document.getElementById("page-title");
const pageDescription = document.getElementById("page-description");

const emptyTitle = document.getElementById("empty-title");
const emptyDescription = document.getElementById("empty-description");

let token = localStorage.getItem(TOKEN_KEY);
let currentUserId = null;
let currentRole = null;

let isBusy = false;

let loadVersion = 0;

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

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);

  token = null;
  currentUserId = null;
  currentRole = null;

  loadVersion += 1;
}

function redirectToLogin() {
  clearSession();
  window.location.href = "login.html";
}

function renderIdentity() {
  profileName.textContent = `Пользователь #${currentUserId}`;

  const isDeveloper = currentRole === "Developer";

  profileRole.textContent = isDeveloper
    ? "Роль: Разработчик"
    : "Роль: Тестировщик";

  const title = isDeveloper
    ? "Мои проекты"
    : "Проекты";

  document.title = `${title} — BugTracker`;
  navProjectsLabel.textContent = title;
  topbarTitle.textContent = title;
  pageTitle.textContent = title;

  pageDescription.textContent = isDeveloper
    ? "Проекты, которые вы создали или в которые вас добавили"
    : "Опубликованные проекты, доступные для тестирования";

  emptyTitle.textContent = isDeveloper
    ? "У вас пока нет проектов"
    : "Пока нет опубликованных проектов";

  emptyDescription.textContent = isDeveloper
  ? "Создайте проект или попросите добавить вас в существующий."
  : "Когда проект опубликуют, он появится здесь.";

  createButton.hidden = !isDeveloper;
  createEmptyButton.hidden = !isDeveloper;

  updateControls();
}

function updateControls() {
  const canCreate =
    Boolean(token) &&
    currentRole === "Developer" &&
    !isBusy;

  createButton.disabled = !canCreate;
  createEmptyButton.disabled = !canCreate;

  changeRoleLink.setAttribute(
    "aria-disabled",
    String(isBusy || !token),
  );
}

function showMessage(message) {
  projectsMessage.textContent = message;
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
    clearSession();

    projectsList.replaceChildren();
    projectsList.hidden = true;
    emptyState.hidden = true;
    changeRoleLink.hidden = true;

    updateControls();

    showMessage(
      "Сессия недействительна или истекла. Нажмите «Выйти» и войдите повторно.",
    );

    return;
  }

  showMessage(
    error.message || "Не удалось выполнить запрос.",
  );
}


function renderProjects(projects) {
  projectsList.replaceChildren();

  const isEmpty = projects.length === 0;

  projectsList.hidden = isEmpty;
  emptyState.hidden = !isEmpty;

  pageDescription.hidden = isEmpty;

  createButton.hidden =
    isEmpty || currentRole !== "Developer";

  if (isEmpty) {
    return;
  }

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = document.createElement("h2");
    title.textContent = project.name;

    const repository = document.createElement("a");
    repository.className = "project-card__repository";

    repository.href =
      `project_view.html?id=${encodeURIComponent(project.id)}`;

    repository.textContent = project.repositoryUrl;

    const footer = document.createElement("div");
    footer.className = "project-card__footer";

    const ticketInfo = document.createElement("div");

    const ticketLabel = document.createElement("span");
    ticketLabel.className = "ticket-label";
    ticketLabel.textContent = "Открытых тикетов";

    const ticketCount = document.createElement("strong");
    ticketCount.className = "ticket-count";

    if (Number.isInteger(project.openTicketsCount)) {
      ticketCount.textContent = String(project.openTicketsCount);

      if (project.openTicketsCount === 0) {
        ticketCount.classList.add("ticket-count--empty");
      }
    } else {
      ticketCount.textContent = "—";
      ticketCount.title = "Не удалось загрузить количество тикетов";
    }

    ticketInfo.append(ticketLabel, ticketCount);

    const status = document.createElement("span");

    if (project.publishedAt) {
      status.className = "chip chip--info";
      status.textContent = "Опубликован";
    } else {
      status.className = "chip chip--neutral";
      status.textContent = "Черновик";
    }

    footer.append(ticketInfo, status);
    card.append(title, repository, footer);
    projectsList.append(card);
  });
}

async function loadDeveloperTicketCount(project) {
  if (!project.publishedAt) {
    return {
      ...project,
      openTicketsCount: 0,
    };
  }

  try {
    const details = await apiRequest(
      `/api/projects/${encodeURIComponent(project.id)}`,
    );

    if (!Array.isArray(details.tickets)) {
      return {
        ...project,
        openTicketsCount: null,
      };
    }

    const openTicketsCount = details.tickets.filter(
      (ticket) => ticket.reviewStatus !== "Fixed",
    ).length;

    return {
      ...project,
      openTicketsCount,
    };
  } catch (error) {
    if (error.status === 401) {
      throw error;
    }

    return {
      ...project,
      openTicketsCount: null,
    };
  }
}

async function loadProjects() {
  const version = ++loadVersion;
  const roleAtStart = currentRole;

  isBusy = true;
  updateControls();

  projectsList.replaceChildren();
  projectsList.hidden = true;
  emptyState.hidden = true;

  showMessage("Загрузка проектов…");

  try {
    const data = await apiRequest("/api/projects");

    if (!Array.isArray(data)) {
      throw new Error("Сервер вернул некорректный список проектов.");
    }

    let projects = data;

    if (roleAtStart === "Developer") {
      projects = await Promise.all(
        data.map(loadDeveloperTicketCount),
      );
    }

    if (version !== loadVersion) {
      return;
    }

    renderProjects(projects);
    showMessage("");
  } catch (error) {
    if (version !== loadVersion) {
      return;
    }

    handleRequestError(error);
  } finally {
    if (version === loadVersion) {
      isBusy = false;
      updateControls();
    }
  }
}


function createProject() {
  if (
    isBusy ||
    !token ||
    currentRole !== "Developer"
  ) {
    return;
  }

  window.location.href = "project_create.html";
}

createButton.addEventListener("click", createProject);
createEmptyButton.addEventListener("click", createProject);

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

    token = response.token;

    if (!initializeIdentity() || currentRole !== response.role) {
      clearSession();
      throw new Error(
        "Не удалось прочитать новую сессию. Войдите повторно.",
      );
    }

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(ROLE_KEY, response.role);

    renderIdentity();

    await loadProjects();
  } catch (error) {
    if (!token) {
      changeRoleLink.hidden = true;
    }

    handleRequestError(error);
  } finally {
    isBusy = false;
    updateControls();
  }
});

if (!token) {
  window.location.href = "login.html";
} else if (!initializeIdentity()) {
  clearSession();

  changeRoleLink.hidden = true;
  updateControls();

  showMessage(
    "Не удалось определить пользователя. Нажмите «Выйти» и войдите повторно.",
  );
} else {
  renderIdentity();
  loadProjects();
}