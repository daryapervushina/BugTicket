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

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-zА-Яа-яЁё])(?=.*\d).{8,}$/;
const EMAIL_INVALID_TEXT = "Введите корректный email";
const EMAIL_TAKEN_TEXT = "Пользователь с таким email уже существует";

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
  submitButton.disabled = !isFormValid();
}

function setFieldError(field, errorElement, hasError) {
  field.classList.toggle("input-field--error", hasError);
  errorElement.hidden = !hasError;
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

lastNameInput.addEventListener("input", updateSubmitState);
firstNameInput.addEventListener("input", updateSubmitState);

emailInput.addEventListener("input", function () {
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
  updatePasswordError();
  updateSubmitState();
});

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!isFormValid()) {
    return;
  }
});
