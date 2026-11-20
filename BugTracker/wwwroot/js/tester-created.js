(function () {
  const createForm = document.querySelector(".modal__form");
  const createOverlay = document.getElementById("create-overlay");
  const createdOverlay = document.getElementById("created-overlay");
  const createSubmitButton = createForm.querySelector('button[type="submit"]');
  const lastNameField = document.getElementById("last-name");
  const firstNameField = document.getElementById("first-name");
  const emailField = document.getElementById("email");
  const createdUser = document.getElementById("created-user");
  const createdPassword = document.getElementById("created-password");
  const copyButton = document.getElementById("copy-password-btn");

  const DEMO_PASSWORD = "Kx7p-R2mQ-a9Lt";
  const COPY_TEXT = "Скопировать";
  const COPIED_TEXT = "Скопировано";

  let copyTimer = null;

  function resetCopyButton() {
    clearTimeout(copyTimer);
    copyButton.textContent = COPY_TEXT;
  }

  function resetCreateForm() {
    createForm.reset();
    createForm.querySelectorAll("input").forEach(function (input) {
      input.dispatchEvent(new Event("input"));
    });
  }

  function showCreatedModal(user) {
    createdUser.textContent =
      user.firstName + " " + user.lastName + " · " + user.email;
    createdPassword.textContent = user.password;
    createOverlay.classList.remove("is-open");
    createdOverlay.classList.add("is-open");
  }

  function closeCreatedModal() {
    createdOverlay.classList.remove("is-open");
    createdPassword.textContent = "";
    resetCopyButton();
    resetCreateForm();
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();

      const isCopied = document.execCommand("copy");
      document.body.removeChild(area);

      if (isCopied) {
        resolve();
      } else {
        reject();
      }
    });
  }

  createForm.addEventListener("submit", function () {
    if (createSubmitButton.disabled) {
      return;
    }

    showCreatedModal({
      firstName: firstNameField.value.trim(),
      lastName: lastNameField.value.trim(),
      email: emailField.value.trim(),
      password: DEMO_PASSWORD,
    });
  });

  copyButton.addEventListener("click", function () {
    copyText(createdPassword.textContent)
      .then(function () {
        copyButton.textContent = COPIED_TEXT;
        clearTimeout(copyTimer);
        copyTimer = setTimeout(resetCopyButton, 2000);
      })
      .catch(function () {
        resetCopyButton();
      });
  });

  document.querySelectorAll("[data-close-created]").forEach(function (button) {
    button.addEventListener("click", closeCreatedModal);
  });
})();
