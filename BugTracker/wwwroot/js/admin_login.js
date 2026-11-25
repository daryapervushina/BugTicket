const form = document.querySelector(".admin-login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailField = document.getElementById("email-field");
const emailError = document.getElementById("email-error");
const submitButton = form.querySelector('button[type="submit"]');

const API_BASE_URL = "";
const LOGIN_URL = API_BASE_URL + "/api/auth/login";
const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";
const EMAIL_KEY = "bugtracker_email";
const ADMIN_ROLE = "Admin";
const ADMIN_TESTERS_PAGE = "admin-testers.html";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const INVALID_CREDENTIALS_TEXT = "Неверный email или пароль";
const BLOCKED_TEXT = "Доступ с этой ролью заблокирован";
const ROLE_FORBIDDEN_TEXT = "У вас нет доступа с ролью администратора";
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
  const isFilled = isEmailValid() && passwordInput.value !== "";
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

async function loginAdmin() {
  return fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailInput.value.trim(),
      password: passwordInput.value,
      role: ADMIN_ROLE,
    }),
  });
}

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

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (isSubmitting || submitButton.disabled) {
    return;
  }

  isSubmitting = true;
  hideFormError();
  updateSubmitState();

  try {
    const response = await loginAdmin();

    if (response.ok) {
      const data = await response.json();

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(ROLE_KEY, data.role);
      localStorage.setItem(EMAIL_KEY, emailInput.value.trim());
      window.location.href = ADMIN_TESTERS_PAGE;
      return;
    }

    await showResponseError(response);
  } catch (error) {
    showFormError(SERVER_ERROR_TEXT);
  }

  isSubmitting = false;
  updateSubmitState();
});
