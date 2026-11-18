const form = document.querySelector(".admin-login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailField = document.getElementById("email-field");
const emailError = document.getElementById("email-error");
const submitButton = form.querySelector('button[type="submit"]');

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isEmailValid() {
  return EMAIL_PATTERN.test(emailInput.value.trim());
}

function updateSubmitState() {
  submitButton.disabled = !(isEmailValid() && passwordInput.value !== "");
}

function updateEmailError() {
  const hasError = emailInput.value.trim() !== "" && !isEmailValid();

  emailField.classList.toggle("input-field--error", hasError);
  emailError.hidden = !hasError;
}

emailInput.addEventListener("input", function () {
  if (!emailError.hidden) {
    updateEmailError();
  }
  updateSubmitState();
});

emailInput.addEventListener("blur", updateEmailError);

passwordInput.addEventListener("input", updateSubmitState);

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (submitButton.disabled) {
    return;
  }
});
