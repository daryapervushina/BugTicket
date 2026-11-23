const customSelect = document.querySelector(".custom-select");
const trigger = customSelect.querySelector(".custom-select__trigger");
const options = customSelect.querySelectorAll(".custom-select__option");
const textSpan = customSelect.querySelector(".custom-select__text");
const hiddenInput = document.getElementById("role-input");
const form = document.querySelector(".auth-form");
const emailInput = document.getElementById("email");
const emailField = document.getElementById("email-field");
const emailError = document.getElementById("email-error");
const passwordInput = document.getElementById("password");
const submitButton = form.querySelector('button[type="submit"]');

const API_BASE_URL = "";
const LOGIN_URL = API_BASE_URL + "/api/auth/login";
const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";
const DEVELOPER_ROLE = "Developer";
const DEV_PROJECTS_PAGE = "dev_projects.html";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const INVALID_CREDENTIALS_TEXT = "Неверный email или пароль";
const BLOCKED_TEXT = "Доступ с этой ролью заблокирован";
const ROLE_FORBIDDEN_TEXT = "У вас нет доступа с выбранной ролью";
const BAD_DATA_TEXT = "Проверьте введённые данные";
const SERVER_ERROR_TEXT = "Не удалось войти. Попробуйте позже";

const formError = document.createElement("p");
formError.className = "input-field__error";
formError.hidden = true;
submitButton.before(formError);

let isSubmitting = false;

function isEmailValid() {
  return EMAIL_PATTERN.test(emailInput.value.trim());
}

function updateSubmitState() {
  const isFilled =
    isEmailValid() && passwordInput.value !== "" && hiddenInput.value !== "";

  submitButton.disabled = isSubmitting || !isFilled;
}

function updateEmailError() {
  const hasError = emailInput.value.trim() !== "" && !isEmailValid();

  emailField.classList.toggle("input-field--error", hasError);
  emailError.hidden = !hasError;
}

function showFormError(text) {
  formError.textContent = text;
  formError.hidden = false;
}

function hideFormError() {
  formError.hidden = true;
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
    showFormError(INVALID_CREDENTIALS_TEXT);
    return;
  }

  if (response.status === 403) {
    const detail = await readProblemDetail(response);
    const isBlocked = detail.toLowerCase().includes("blocked");

    showFormError(isBlocked ? BLOCKED_TEXT : ROLE_FORBIDDEN_TEXT);
    return;
  }

  if (response.status === 400 || response.status === 422) {
    showFormError(BAD_DATA_TEXT);
    return;
  }

  showFormError(SERVER_ERROR_TEXT);
}

async function loginUser() {
  return fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailInput.value.trim(),
      password: passwordInput.value,
      role: hiddenInput.value,
    }),
  });
}

trigger.addEventListener("click", function () {
  customSelect.classList.toggle("is-open");
});

options.forEach(function (option) {
  option.addEventListener("click", function () {
    textSpan.textContent = this.textContent;
    textSpan.classList.add("has-value");
    hiddenInput.value = this.getAttribute("data-value");
    customSelect.classList.remove("is-open");
    hideFormError();
    updateSubmitState();
  });
});

emailInput.addEventListener("input", function () {
  hideFormError();
  if (!emailError.hidden) {
    updateEmailError();
  }
  updateSubmitState();
});

emailInput.addEventListener("blur", updateEmailError);

passwordInput.addEventListener("input", function () {
  hideFormError();
  updateSubmitState();
});

document.addEventListener("click", function (event) {
  if (!customSelect.contains(event.target)) {
    customSelect.classList.remove("is-open");
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    customSelect.classList.remove("is-open");
  }
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (isSubmitting || submitButton.disabled) {
    return;
  }

  isSubmitting = true;
  hideFormError();
  updateSubmitState();

  try {
    const response = await loginUser();

    if (response.ok) {
      const data = await response.json();

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(ROLE_KEY, data.role);

      if (data.role === DEVELOPER_ROLE) {
        window.location.href = DEV_PROJECTS_PAGE;
        return;
      }
    } else {
      await showResponseError(response);
    }
  } catch (error) {
    showFormError(SERVER_ERROR_TEXT);
  }

  isSubmitting = false;
  updateSubmitState();
});
