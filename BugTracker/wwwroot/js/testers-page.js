(function () {
  const tbody = document.getElementById("testers-tbody");
  const searchInput = document.getElementById("testers-search");
  const statusSelect = document.getElementById("testers-status-filter");
  const statusBox = document.getElementById("status-select");
  const statusTrigger = statusBox.querySelector(".custom-select__trigger");
  const statusText = statusBox.querySelector(".custom-select__text");
  const statusOptions = statusBox.querySelectorAll(".custom-select__option");
  const sidebarEmail = document.querySelector(
    ".sidebar__profile .profile-info span",
  );
  const logoutButton = document.querySelector(".logout-button");

  const API_BASE_URL = "";
  const TESTERS_URL = API_BASE_URL + "/api/admin/testers";
  const TOKEN_KEY = "bugtracker_token";
  const ROLE_KEY = "bugtracker_role";
  const EMAIL_KEY = "bugtracker_email";
  const LOGIN_PAGE = "admin_login.html";

  const SEARCH_DELAY_MS = 300;
  const LOADING_TEXT = "Загрузка...";
  const EMPTY_TEXT = "Тестировщики не найдены";
  const LOAD_ERROR_TEXT = "Не удалось загрузить список тестировщиков";
  const NETWORK_ERROR_TEXT = "Ошибка сети. Проверьте подключение к серверу.";
  const ACTIVE_STATUS_TEXT = "Активен";
  const BLOCKED_STATUS_TEXT = "Заблокирован";
  const RESET_PASSWORD_TEXT = "Сбросить пароль";
  const BLOCK_TEXT = "Заблокировать";
  const UNBLOCK_TEXT = "Разблокировать";

  let searchTimer = null;

  function getInitials(firstName, lastName) {
    const first = (firstName || "").trim().charAt(0);
    const last = (lastName || "").trim().charAt(0);
    return (first + last).toUpperCase() || "?";
  }

  function renderMessageRow(text) {
    tbody.innerHTML = "";

    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.className = "tester-table__empty";
    td.textContent = text;

    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function createTesterRow(tester) {
    const tr = document.createElement("tr");
    const isBlocked = tester.status === "blocked";

    const userTd = document.createElement("td");
    const userBox = document.createElement("div");
    userBox.className = "tester-user";

    const avatar = document.createElement("div");
    avatar.className = "avatar avatar--sm";
    avatar.textContent = getInitials(tester.firstName, tester.lastName);

    const nameWrap = document.createElement("div");
    const nameSpan = document.createElement("span");
    nameSpan.className = "tester-user__name";
    nameSpan.textContent = [tester.firstName, tester.lastName]
      .filter(Boolean)
      .join(" ");
    nameWrap.appendChild(nameSpan);

    userBox.append(avatar, nameWrap);
    userTd.appendChild(userBox);

    const emailTd = document.createElement("td");
    emailTd.textContent = tester.email || "";

    const statusTd = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = isBlocked ? "chip chip--neutral" : "chip chip--success";
    chip.textContent = isBlocked ? BLOCKED_STATUS_TEXT : ACTIVE_STATUS_TEXT;
    statusTd.appendChild(chip);

    const actionsTd = document.createElement("td");
    const actionsBox = document.createElement("div");
    actionsBox.className = "tester-actions";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "button button--text";
    resetBtn.dataset.resetPassword = "";
    resetBtn.dataset.testerId = String(tester.id);
    resetBtn.textContent = RESET_PASSWORD_TEXT;

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "button button--text";
    toggleBtn.dataset.testerId = String(tester.id);

    if (isBlocked) {
      toggleBtn.dataset.unblockTester = "";
      toggleBtn.textContent = UNBLOCK_TEXT;
    } else {
      toggleBtn.dataset.blockTester = "";
      toggleBtn.textContent = BLOCK_TEXT;
    }

    actionsBox.append(resetBtn, toggleBtn);
    actionsTd.appendChild(actionsBox);

    tr.append(userTd, emailTd, statusTd, actionsTd);
    return tr;
  }

  function renderTesters(list) {
    if (!list.length) {
      renderMessageRow(EMPTY_TEXT);
      return;
    }

    tbody.innerHTML = "";

    const fragment = document.createDocumentFragment();
    list.forEach(function (tester) {
      fragment.appendChild(createTesterRow(tester));
    });
    tbody.appendChild(fragment);
  }

  function buildTestersUrl() {
    const params = new URLSearchParams();
    const q = searchInput ? searchInput.value.trim() : "";
    const status = statusSelect ? statusSelect.value : "";

    if (q) {
      params.set("q", q);
    }

    if (status === "active" || status === "blocked") {
      params.set("status", status);
    }

    const queryString = params.toString();
    return queryString ? TESTERS_URL + "?" + queryString : TESTERS_URL;
  }

  async function readProblemDetail(response) {
    try {
      const data = await response.json();
      return typeof data.detail === "string" ? data.detail : "";
    } catch (error) {
      return "";
    }
  }

  async function fetchTesters(token) {
    return fetch(buildTestersUrl(), {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
  }

  async function loadTesters() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      window.location.href = LOGIN_PAGE;
      return;
    }

    renderMessageRow(LOADING_TEXT);

    try {
      const response = await fetchTesters(token);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = LOGIN_PAGE;
        return;
      }

      if (!response.ok) {
        const detail = await readProblemDetail(response);
        renderMessageRow(detail || LOAD_ERROR_TEXT);
        return;
      }

      const data = await response.json();
      renderTesters(Array.isArray(data) ? data : []);
    } catch (error) {
      renderMessageRow(NETWORK_ERROR_TEXT);
    }
  }

  if (sidebarEmail) {
    const savedEmail = localStorage.getItem(EMAIL_KEY);
    if (savedEmail) {
      sidebarEmail.textContent = savedEmail;
    }
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(EMAIL_KEY);
      window.location.href = LOGIN_PAGE;
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadTesters, SEARCH_DELAY_MS);
    });
  }

  statusTrigger.addEventListener("click", function () {
    statusBox.classList.toggle("is-open");
  });

  statusOptions.forEach(function (option) {
    option.addEventListener("click", function () {
      statusText.textContent = this.textContent.trim();
      statusSelect.value = this.getAttribute("data-value");
      statusBox.classList.remove("is-open");
      loadTesters();
    });
  });

  document.addEventListener("click", function (event) {
    if (!statusBox.contains(event.target)) {
      statusBox.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      statusBox.classList.remove("is-open");
    }
  });

  document.addEventListener("tester:created", loadTesters);
  document.addEventListener("tester:updated", loadTesters);

  loadTesters();
})();
