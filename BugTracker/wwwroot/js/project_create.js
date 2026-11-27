const API_BASE_URL = "";

const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";

const projectForm = document.getElementById("project-form");
const projectNameInput = document.getElementById("project-name");

const repositoryField = document.getElementById("repository-field");
const repositoryInput = document.getElementById("repository");
const repositoryError = document.getElementById("repository-error");

const selectedDevelopers = document.getElementById("selected-developers");

const saveButton = document.getElementById("save-project");
const publishButton = document.getElementById("publish-project");

const projectMessage = document.getElementById("project-message");
const profileName = document.getElementById("profile-name");
const logoutButton = document.getElementById("logout-button");

let token = localStorage.getItem(TOKEN_KEY);
let currentUserId = null;

let isBusy = false;
let repositoryTouched = false;


let pendingStorageKey = null;
let pending = null;

function readJwtPayload(jwt) {
  try {
    const parts = jwt.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "=",
    );

    const bytes = Uint8Array.from(
      atob(padded),
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
  const userId = Number(payload?.sub);

  if (
    !Number.isSafeInteger(userId) ||
    userId <= 0 ||
    payload?.role !== "Developer"
  ) {
    return false;
  }

  currentUserId = userId;
  pendingStorageKey = `bugtracker_pending_project_${userId}`;

  return true;
}

function showMessage(text) {
  projectMessage.textContent = text;
}

function isValidRepository(value) {
  try {
    const url = new URL(value.trim());

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "github.com" || url.hostname === "gitlab.com")
    );
  } catch {
    return false;
  }
}

function isFormValid() {
  const name = projectNameInput.value.trim();

  return (
    name.length > 0 &&
    name.length <= 100 &&
    isValidRepository(repositoryInput.value)
  );
}

function updateFormState() {
  const repositoryHasError =
    repositoryTouched &&
    !isValidRepository(repositoryInput.value);

  repositoryField.classList.toggle(
    "input-field--error",
    repositoryHasError,
  );

  repositoryError.hidden = !repositoryHasError;

  const locked = Boolean(pending);

  projectNameInput.disabled = isBusy || locked;
  repositoryInput.disabled = isBusy || locked;

  const canSubmit =
    !isBusy &&
    Boolean(token) &&
    (locked || isFormValid());

  saveButton.disabled = !canSubmit;
  publishButton.disabled = !canSubmit;

  if (pending?.projectId) {
    saveButton.textContent = "Открыть черновик";
    publishButton.textContent = "Повторить публикацию";
  } else if (pending) {
    saveButton.textContent = "Повторить сохранение";
    publishButton.textContent = "Повторить и опубликовать";
  } else {
    saveButton.textContent = "Сохранить проект";
    publishButton.textContent = "Опубликовать проект";
  }
}

function renderAuthor() {
  profileName.textContent = `Пользователь #${currentUserId}`;

  selectedDevelopers.replaceChildren();

  const item = document.createElement("div");
  item.className = "selected-developer";

  const avatar = document.createElement("div");
  avatar.className = "selected-developer__avatar";
  avatar.textContent = "?";

  const info = document.createElement("div");
  info.className = "selected-developer__info";

  const name = document.createElement("strong");
  name.textContent = `Разработчик #${currentUserId}`;

  const role = document.createElement("span");
  role.textContent = "Автор проекта";

  info.append(name, role);
  item.append(avatar, info);
  selectedDevelopers.append(item);
}

function savePending() {
  sessionStorage.setItem(
    pendingStorageKey,
    JSON.stringify(pending),
  );
}

function clearPending() {
  sessionStorage.removeItem(pendingStorageKey);
  pending = null;
}

function restorePending() {
  try {
    const saved = sessionStorage.getItem(pendingStorageKey);

    if (!saved) {
      return;
    }

    const data = JSON.parse(saved);

    if (
      typeof data.key !== "string" ||
      typeof data.body?.name !== "string" ||
      typeof data.body?.repositoryUrl !== "string"
    ) {
      return;
    }

    pending = data;

    projectNameInput.value = pending.body.name;
    repositoryInput.value = pending.body.repositoryUrl;

    showMessage(
      "Найден незавершённый запрос. Повторите сохранение или публикацию.",
    );
  } catch {
    showMessage(
      "Не удалось восстановить незавершённый запрос.",
    );
  }
}

async function readError(response) {
  if (response.status === 401) {
    return "Сессия истекла или недействительна. Войдите повторно.";
  }

  if (response.status === 403) {
    return "У вас нет доступа к этому действию.";
  }

  try {
    const data = await response.json();

    if (data.errors && typeof data.errors === "object") {
      const messages = Object.values(data.errors).flat();
      const first = messages.find(
        (message) => typeof message === "string",
      );

      if (first) {
        return first;
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

function handleError(error) {
  if (error.status === 401) {
    token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);

    showMessage(
      "Сессия истекла. Войдите снова; затем вернитесь к созданию проекта в этой вкладке.",
    );

    return;
  }

  showMessage(
    error.message || "Не удалось выполнить запрос.",
  );
}

async function createProject() {
  if (!pending) {
    pending = {
      key: crypto.randomUUID(),
      body: {
        name: projectNameInput.value.trim(),
        repositoryUrl: repositoryInput.value.trim(),

        developerIds: [],
      },
      projectId: null,
    };

    savePending();
  }

  if (pending.projectId) {
    return pending.projectId;
  }

  const result = await apiRequest("/api/projects", {
    method: "POST",
    headers: {
      "Idempotency-Key": pending.key,
    },
    body: JSON.stringify(pending.body),
  });

  if (!Number.isSafeInteger(result.id) || result.id <= 0) {
    throw new Error(
      "Сервер вернул ответ без корректного ID проекта. Повторите запрос.",
    );
  }

  pending.projectId = result.id;
  savePending();

  return result.id;
}

async function publishProject(projectId) {
  try {
    await apiRequest(`/api/projects/${projectId}/publish`, {
      method: "POST",
    });
  } catch (error) {

    if (error.status === 409) {
      const project = await apiRequest(
        `/api/projects/${projectId}`,
      );

      if (project.publishedAt) {
        return;
      }
    }

    throw error;
  }
}

async function submitProject(shouldPublish) {
  if (isBusy || !token) {
    return;
  }

  repositoryTouched = true;

  if (!pending && !isFormValid()) {
    updateFormState();

    showMessage(
      "Введите название и корректную ссылку на GitHub или GitLab.",
    );

    return;
  }

  isBusy = true;
  updateFormState();

  showMessage("Создание проекта…");

  try {
    const projectId = await createProject();

    if (shouldPublish) {
      showMessage("Публикация проекта…");
      await publishProject(projectId);
    }

    clearPending();

    window.location.href =
      `project_view.html?id=${encodeURIComponent(projectId)}`;
  } catch (error) {
    handleError(error);

    if (pending && token) {
      projectMessage.textContent +=
        " Повторите действие: повторный запрос использует тот же ключ.";
    }
  } finally {
    isBusy = false;
    updateFormState();
  }
}

projectNameInput.addEventListener("input", updateFormState);

repositoryInput.addEventListener("input", () => {
  repositoryTouched = true;
  updateFormState();
});

repositoryInput.addEventListener("blur", () => {
  repositoryTouched = true;
  updateFormState();
});

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitProject(false);
});

publishButton.addEventListener("click", () => {
  submitProject(true);
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);

  window.location.href = "login.html";
});

if (!token) {
  window.location.href = "login.html";
} else if (!initializeIdentity()) {
  showMessage(
    "Создавать проекты может только разработчик. Войдите с ролью разработчика.",
  );

  saveButton.disabled = true;
  publishButton.disabled = true;
} else {
  renderAuthor();
  restorePending();
  updateFormState();
}