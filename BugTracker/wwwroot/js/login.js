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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailValid() {
  return EMAIL_PATTERN.test(emailInput.value.trim());
}

function updateSubmitState() {
  const isFilled =
    isEmailValid() && passwordInput.value !== "" && hiddenInput.value !== "";

  submitButton.disabled = !isFilled;
}

function updateEmailError() {
  const hasError = emailInput.value.trim() !== "" && !isEmailValid();

  emailField.classList.toggle("input-field--error", hasError);
  emailError.hidden = !hasError;
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
    updateSubmitState();
  });
});

emailInput.addEventListener("input", function () {
  if (!emailError.hidden) {
    updateEmailError();
  }
  updateSubmitState();
});

emailInput.addEventListener("blur", updateEmailError);

passwordInput.addEventListener("input", updateSubmitState);

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

form.addEventListener("submit", function (event) {
  event.preventDefault();
});
