const form = document.querySelector(".change-form");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const newPasswordField = document.getElementById("new-password-field");
const confirmPasswordField = document.getElementById("confirm-password-field");
const newPasswordError = document.getElementById("new-password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");
const submitButton = form.querySelector('button[type="submit"]');

const API_BASE_URL = "";
const CHANGE_PASSWORD_URL = API_BASE_URL + "/api/auth/change-password";
const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";
const MUST_CHANGE_KEY = "bugtracker_must_change_password";
const LOGIN_PAGE = "login.html";
const TESTER_HOME_PAGE = "tester_projects.html";

const PASSWORD_PATTERN = /^(?=.*[A-Za-zА-Яа-яЁё])(?=.*\d).{8,}$/;
const PASSWORD_INVALID_TEXT = "Минимум 8 символов, буква и цифра";
const PASSWORDS_MISMATCH_TEXT = "Пароли не совпадают";
const SAME_AS_TEMPORARY_TEXT = "Новый пароль должен отличаться от временного";
const BLOCKED_TEXT = "Доступ с ролью тестировщика заблокирован";
const BAD_DATA_TEXT = "Проверьте введённые данные";
const SERVER_ERROR_TEXT = "Не удалось сменить пароль. Попробуйте позже";

const formError = document.createElement("p");
formError.className = "input-field__error";
formError.hidden = true;
submitButton.before(formError);

let isSubmitting = false;

function redirectToLogin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(MUST_CHANGE_KEY);
  window.location.href = LOGIN_PAGE;
}

if (!localStorage.getItem(TOKEN_KEY)) {
  window.location.href = LOGIN_PAGE;
}

function isNewPasswordValid() {
  return PASSWORD_PATTERN.test(newPasswordInput.value);
}

function isConfirmMatching() {
  return (
    confirmPasswordInput.value !== "" &&
    confirmPasswordInput.value === newPasswordInput.value
  );
}

function isFormValid() {
  return (
    isNewPasswordValid() &&
    isConfirmMatching() &&
    newPasswordError.hidden &&
    confirmPasswordError.hidden
  );
}

function updateSubmitState() {
  submitButton.disabled = isSubmitting || !isFormValid();
}

function setFieldError(field, errorElement, hasError, text) {
  if (text) {
    errorElement.textContent = text;
  }
  field.classList.toggle("input-field--error", hasError);
  errorElement.hidden = !hasError;
}

function updateNewPasswordError() {
  const hasError = newPasswordInput.value !== "" && !isNewPasswordValid();

  setFieldError(
    newPasswordField,
    newPasswordError,
    hasError,
    PASSWORD_INVALID_TEXT,
  );
}

function updateConfirmError() {
  const hasError =
    confirmPasswordInput.value !== "" &&
    confirmPasswordInput.value !== newPasswordInput.value;

  setFieldError(
    confirmPasswordField,
    confirmPasswordError,
    hasError,
    PASSWORDS_MISMATCH_TEXT,
  );
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
  if (response.status === 401 || response.status === 409) {
    redirectToLogin();
    return;
  }

  if (response.status === 403) {
    const detail = await readProblemDetail(response);

    if (detail.toLowerCase().includes("blocked")) {
      showFormError(BLOCKED_TEXT);
    } else {
      redirectToLogin();
    }
    return;
  }

  if (response.status === 422) {
    setFieldError(
      newPasswordField,
      newPasswordError,
      true,
      SAME_AS_TEMPORARY_TEXT,
    );
    return;
  }

  if (response.status === 400) {
    showFormError(BAD_DATA_TEXT);
    return;
  }

  showFormError(SERVER_ERROR_TEXT);
}

async function changePassword() {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  return fetch(CHANGE_PASSWORD_URL, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      newPassword: newPasswordInput.value,
      confirmPassword: confirmPasswordInput.value,
    }),
  });
}

newPasswordInput.addEventListener("input", function () {
  hideFormError();
  updateNewPasswordError();
  if (confirmPasswordInput.value !== "") {
    updateConfirmError();
  }
  updateSubmitState();
});

confirmPasswordInput.addEventListener("input", function () {
  hideFormError();
  updateConfirmError();
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
    const response = await changePassword();

    if (response.ok) {
      const data = await response.json();

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(ROLE_KEY, data.role);
      localStorage.removeItem(MUST_CHANGE_KEY);
      window.location.href = TESTER_HOME_PAGE;
      return;
    }

    await showResponseError(response);
  } catch (error) {
    showFormError(SERVER_ERROR_TEXT);
  }

  isSubmitting = false;
  updateSubmitState();
});
