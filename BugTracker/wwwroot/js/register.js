const form = document.querySelector(".register-form");
const lastNameInput = document.getElementById("last-name");
const firstNameInput = document.getElementById("first-name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailField = document.getElementById("email-field");
const passwordField = document.getElementById("password-field");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const submitButton = form.querySelector('button[type="submit"]');

const API_BASE_URL = "";
const REGISTER_URL = API_BASE_URL + "/api/auth/register";
const LOGIN_URL = API_BASE_URL + "/api/auth/login";
const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";
const DEVELOPER_ROLE = "Developer";
const DEV_PROJECTS_PAGE = "dev_projects.html";
const LOGIN_PAGE = "login.html";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-zА-Яа-яЁё])(?=.*\d).{8,}$/;
const EMAIL_INVALID_TEXT = "Введите корректный email";
const EMAIL_TAKEN_TEXT = "Пользователь с таким email уже существует";
const BAD_DATA_TEXT = "Проверьте введённые данные";
const SERVER_ERROR_TEXT = "Не удалось зарегистрироваться. Попробуйте позже";

const formError = document.createElement("p");
formError.className = "input-field__error";
formError.hidden = true;
submitButton.before(formError);

let isSubmitting = false;

function isEmailValid() {
  return EMAIL_PATTERN.test(emailInput.value.trim());
}

function isPasswordValid() {
  return PASSWORD_PATTERN.test(passwordInput.value);
}

function isFormValid() {
  return (
    lastNameInput.value.trim() !== "" &&
    firstNameInput.value.trim() !== "" &&
    isEmailValid() &&
    isPasswordValid() &&
    emailError.hidden
  );
}

function updateSubmitState() {
  submitButton.disabled = isSubmitting || !isFormValid();
}

function setFieldError(field, errorElement, hasError) {
  field.classList.toggle("input-field--error", hasError);
  errorElement.hidden = !hasError;
}

function showFormError(text) {
  formError.textContent = text;
  formError.hidden = false;
}

function hideFormError() {
  formError.hidden = true;
}

function updateEmailFormatError() {
  const hasError = emailInput.value.trim() !== "" && !isEmailValid();

  emailError.textContent = EMAIL_INVALID_TEXT;
  setFieldError(emailField, emailError, hasError);
}

function updatePasswordError() {
  const hasError = passwordInput.value !== "" && !isPasswordValid();

  setFieldError(passwordField, passwordError, hasError);
}

function showEmailTaken() {
  emailError.textContent = EMAIL_TAKEN_TEXT;
  setFieldError(emailField, emailError, true);
  updateSubmitState();
}

async function registerUser() {
  return fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
    }),
  });
}

async function signInAfterRegister() {
  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value,
        role: DEVELOPER_ROLE,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ROLE_KEY, data.role);
    return true;
  } catch (error) {
    return false;
  }
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

passwordInput.addEventListener("input", function () {
  hideFormError();
  updatePasswordError();
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
    const response = await registerUser();

    if (response.ok) {
      const signedIn = await signInAfterRegister();

      window.location.href = signedIn ? DEV_PROJECTS_PAGE : LOGIN_PAGE;
      return;
    }

    if (response.status === 409) {
      showEmailTaken();
    } else if (response.status === 400 || response.status === 422) {
      showFormError(BAD_DATA_TEXT);
    } else {
      showFormError(SERVER_ERROR_TEXT);
    }
  } catch (error) {
    showFormError(SERVER_ERROR_TEXT);
  }

  isSubmitting = false;
  updateSubmitState();
});
