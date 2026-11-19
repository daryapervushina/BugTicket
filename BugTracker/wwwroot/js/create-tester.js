const form = document.querySelector(".modal__form");
const overlay = document.querySelector(".modal-overlay");
const openButton = document.getElementById("open-modal-btn");

const lastNameInput = document.getElementById("last-name");
const firstNameInput = document.getElementById("first-name");
const emailInput = document.getElementById("email");
const emailField = document.getElementById("email-field");
const emailError = document.getElementById("email-error");
const submitButton = form.querySelector('button[type="submit"]');

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isEmailValid() {
  return EMAIL_PATTERN.test(emailInput.value.trim());
}

function isFormValid() {
  return (
    lastNameInput.value.trim() !== "" &&
    firstNameInput.value.trim() !== "" &&
    isEmailValid()
  );
}

function updateSubmitState() {
  submitButton.disabled = !isFormValid();
}

function updateEmailError() {
  const hasError = emailInput.value.trim() !== "" && !isEmailValid();

  emailField.classList.toggle("input-field--error", hasError);
  emailError.hidden = !hasError;
}

lastNameInput.addEventListener("input", updateSubmitState);
firstNameInput.addEventListener("input", updateSubmitState);

emailInput.addEventListener("input", function () {
  if (!emailError.hidden) {
    updateEmailError();
  }
  updateSubmitState();
});

emailInput.addEventListener("blur", updateEmailError);

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!isFormValid()) {
    return;
  }
});

function openModal() {
  overlay.classList.add("is-open");
}

function closeModal() {
  overlay.classList.remove("is-open");
}

openButton.addEventListener("click", openModal);

document.querySelectorAll("[data-close]").forEach(function (button) {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});

overlay.addEventListener("click", function (event) {
  if (event.target === overlay) {
    closeModal();
  }
});
