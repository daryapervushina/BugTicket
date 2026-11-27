(function () {
  const overlay = document.getElementById("block-overlay");
  const userName = document.getElementById("block-user-name");
  const confirmButton = document.getElementById("confirm-block-btn");
  const modalActions = overlay.querySelector(".modal__actions");

  const API_BASE_URL = "";
  const TESTERS_URL = API_BASE_URL + "/api/admin/testers";
  const TOKEN_KEY = "bugtracker_token";
  const ROLE_KEY = "bugtracker_role";
  const LOGIN_PAGE = "admin_login.html";
  const BLOCKED_STATUS = "blocked";
  const ACTIVE_STATUS = "active";

  const NOT_FOUND_TEXT = "Тестировщик не найден. Список обновлён";
  const BAD_DATA_TEXT = "Проверьте введённые данные";
  const SERVER_ERROR_TEXT = "Не удалось выполнить действие. Попробуйте позже";

  const formError = document.createElement("p");
  formError.className = "input-field__error";
  formError.hidden = true;
  modalActions.before(formError);

  let isSubmitting = false;

  function showFormError(text) {
    formError.textContent = text;
    formError.hidden = false;
  }

  function hideFormError() {
    formError.hidden = true;
  }

  function redirectToLogin() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    window.location.href = LOGIN_PAGE;
  }

  function notifyUpdated(data) {
    document.dispatchEvent(new CustomEvent("tester:updated", { detail: data }));
  }

  async function updateTesterStatus(id, status) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return fetch(TESTERS_URL + "/" + id, {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify({ status: status }),
    });
  }

  function openBlockModal(trigger) {
    const row = trigger.closest("tr");
    const nameElement = row ? row.querySelector(".tester-user__name") : null;

    if (!nameElement) {
      return;
    }

    userName.textContent = nameElement.textContent;
    confirmButton.dataset.testerId = trigger.dataset.testerId;
    hideFormError();
    overlay.classList.add("is-open");
  }

  function closeBlockModal() {
    if (isSubmitting) {
      return;
    }

    overlay.classList.remove("is-open");
    hideFormError();
  }

  async function confirmBlock() {
    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    confirmButton.disabled = true;
    hideFormError();

    try {
      const response = await updateTesterStatus(
        confirmButton.dataset.testerId,
        BLOCKED_STATUS,
      );

      if (response.ok) {
        const data = await response.json();

        isSubmitting = false;
        confirmButton.disabled = false;
        closeBlockModal();
        notifyUpdated(data);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        return;
      }

      if (response.status === 404) {
        showFormError(NOT_FOUND_TEXT);
        notifyUpdated(null);
      } else if (response.status === 400 || response.status === 422) {
        showFormError(BAD_DATA_TEXT);
      } else {
        showFormError(SERVER_ERROR_TEXT);
      }
    } catch (error) {
      showFormError(SERVER_ERROR_TEXT);
    }

    isSubmitting = false;
    confirmButton.disabled = false;
  }

  async function unblockTester(trigger) {
    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    trigger.disabled = true;

    try {
      const response = await updateTesterStatus(
        trigger.dataset.testerId,
        ACTIVE_STATUS,
      );

      if (response.ok) {
        const data = await response.json();

        isSubmitting = false;
        notifyUpdated(data);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        return;
      }

      if (response.status === 404) {
        isSubmitting = false;
        notifyUpdated(null);
        return;
      }
    } catch (error) {
      isSubmitting = false;
      trigger.disabled = false;
      return;
    }

    isSubmitting = false;
    trigger.disabled = false;
  }

  document.addEventListener("click", function (event) {
    const blockTrigger = event.target.closest("[data-block-tester]");

    if (blockTrigger) {
      openBlockModal(blockTrigger);
      return;
    }

    const unblockTrigger = event.target.closest("[data-unblock-tester]");

    if (unblockTrigger) {
      unblockTester(unblockTrigger);
    }
  });

  document.querySelectorAll("[data-close-block]").forEach(function (button) {
    button.addEventListener("click", closeBlockModal);
  });

  confirmButton.addEventListener("click", confirmBlock);

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closeBlockModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeBlockModal();
    }
  });
})();
