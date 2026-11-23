(function () {
  const overlay = document.getElementById("create-overlay");
  const form = overlay.querySelector(".modal__form");
  const modalActions = form.querySelector(".modal__actions");
  const openButton = document.getElementById("open-modal-btn");

  const lastNameInput = document.getElementById("last-name");
  const firstNameInput = document.getElementById("first-name");
  const emailInput = document.getElementById("email");
  const emailField = document.getElementById("email-field");
  const emailError = document.getElementById("email-error");
  const submitButton = form.querySelector('button[type="submit"]');

  const API_BASE_URL = "";
  const CREATE_TESTER_URL = API_BASE_URL + "/api/admin/testers";
  const TOKEN_KEY = "bugtracker_token";
  const ROLE_KEY = "bugtracker_role";
  const LOGIN_PAGE = "login.html";

  const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const EMAIL_INVALID_TEXT = "Введите корректный email";
  const TESTER_EXISTS_TEXT = "Тестировщик с таким email уже существует";
  const OTHER_ACCOUNT_TEXT = "Этот email принадлежит другому аккаунту";
  const ACCOUNT_CHANGED_TEXT =
    "Данные аккаунта изменились. Обновите список тестировщиков";
  const FORBIDDEN_TEXT = "Недостаточно прав для создания тестировщика";
  const BAD_DATA_TEXT = "Проверьте введённые данные";
  const SERVER_ERROR_TEXT = "Не удалось создать тестировщика. Попробуйте позже";

  const formError = document.createElement("p");
  formError.className = "input-field__error";
  formError.hidden = true;
  modalActions.before(formError);

  let isSubmitting = false;

  function isEmailValid() {
    return EMAIL_PATTERN.test(emailInput.value.trim());
  }

  function isFormValid() {
    return (
      lastNameInput.value.trim() !== "" &&
      firstNameInput.value.trim() !== "" &&
      isEmailValid() &&
      emailError.hidden
    );
  }

  function updateSubmitState() {
    submitButton.disabled = isSubmitting || !isFormValid();
  }

  function setEmailError(hasError, text) {
    if (text) {
      emailError.textContent = text;
    }
    emailField.classList.toggle("input-field--error", hasError);
    emailError.hidden = !hasError;
  }

  function updateEmailFormatError() {
    const hasError = emailInput.value.trim() !== "" && !isEmailValid();
    setEmailError(hasError, EMAIL_INVALID_TEXT);
  }

  function showFormError(text) {
    formError.textContent = text;
    formError.hidden = false;
  }

  function hideFormError() {
    formError.hidden = true;
  }

  function resetForm() {
    form.reset();
    setEmailError(false, EMAIL_INVALID_TEXT);
    hideFormError();
    updateSubmitState();
  }

  function openModal() {
    resetForm();
    overlay.classList.add("is-open");
    lastNameInput.focus();
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }
    overlay.classList.remove("is-open");
    resetForm();
  }

  async function readProblemDetail(response) {
    try {
      const data = await response.json();
      return typeof data.detail === "string" ? data.detail : "";
    } catch (error) {
      return "";
    }
  }

  async function showResponseError(response) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ROLE_KEY);
      window.location.href = LOGIN_PAGE;
      return;
    }

    if (response.status === 403) {
      showFormError(FORBIDDEN_TEXT);
      return;
    }

    if (response.status === 409) {
      const detail = (await readProblemDetail(response)).toLowerCase();

      if (detail.includes("already exists")) {
        setEmailError(true, TESTER_EXISTS_TEXT);
      } else if (detail.includes("another account")) {
        setEmailError(true, OTHER_ACCOUNT_TEXT);
      } else if (detail.includes("changed")) {
        showFormError(ACCOUNT_CHANGED_TEXT);
      } else {
        showFormError(TESTER_EXISTS_TEXT);
      }
      return;
    }

    if (response.status === 400 || response.status === 422) {
      showFormError(BAD_DATA_TEXT);
      return;
    }

    showFormError(SERVER_ERROR_TEXT);
  }

  async function createTester() {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return fetch(CREATE_TESTER_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
      }),
    });
  }

  lastNameInput.addEventListener("input", function () {
    hideFormError();
    updateSubmitState();
  });

  firstNameInput.addEventListener("input", function () {
    hideFormError();
    updateSubmitState();
  });

  emailInput.addEventListener("input", function () {
    hideFormError();
    if (!emailError.hidden) {
      updateEmailFormatError();
    }
    updateSubmitState();
  });

  emailInput.addEventListener("blur", function () {
    updateEmailFormatError();
    updateSubmitState();
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (isSubmitting || !isFormValid()) {
      return;
    }

    isSubmitting = true;
    hideFormError();
    updateSubmitState();

    try {
      const response = await createTester();

      if (response.ok) {
        const data = await response.json();

        isSubmitting = false;
        closeModal();
        document.dispatchEvent(
          new CustomEvent("tester:created", { detail: data }),
        );
        return;
      }

      await showResponseError(response);
    } catch (error) {
      showFormError(SERVER_ERROR_TEXT);
    }

    isSubmitting = false;
    updateSubmitState();
  });

  openButton.addEventListener("click", openModal);

  overlay.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeModal();
    }
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closeModal();
    }
  });
})();
