(function () {
  const createdOverlay = document.getElementById("created-overlay");
  const createdTitle = document.getElementById("created-title");
  const createdUser = document.getElementById("created-user");
  const passwordField = createdOverlay.querySelector(".password-field");
  const createdPassword = document.getElementById("created-password");
  const copyButton = document.getElementById("copy-password-btn");
  const warningTitle = createdOverlay.querySelector(".banner__title");
  const warningText = createdOverlay.querySelector(".banner__text");

  const CREATED_TITLE = "Аккаунт создан";
  const RESET_TITLE = "Пароль сброшен";
  const ROLE_ADDED_TITLE = "Роль тестировщика добавлена";
  const NEW_PASSWORD_WARNING_TITLE = "Пароль больше не будет показан";
  const NEW_PASSWORD_WARNING_TEXT =
    "Сохраните его или передайте тестировщику сейчас. При первом входе система попросит его сменить.";
  const ROLE_ADDED_WARNING_TITLE = "Пароль остался прежним";
  const ROLE_ADDED_WARNING_TEXT =
    "Этот пользователь уже зарегистрирован как разработчик. Он может войти с ролью «Тестировщик», используя свой текущий пароль.";
  const COPY_TEXT = "Скопировать";
  const COPIED_TEXT = "Скопировано";

  let copyTimer = null;

  function resetCopyButton() {
    clearTimeout(copyTimer);
    copyButton.textContent = COPY_TEXT;
  }

  function showCreatedModal(data, title) {
    const tester = data.tester || data.user || {};
    const password = data.temporaryPassword ?? data.password ?? null;
    const roleAdded = Boolean(data.roleAdded);

    const fullName = [tester.firstName, tester.lastName]
      .filter(Boolean)
      .join(" ");
    const email = tester.email || "";

    createdUser.textContent =
      fullName && email ? fullName + " · " + email : fullName || email;

    resetCopyButton();

    if (roleAdded || !password) {
      createdTitle.textContent = ROLE_ADDED_TITLE;
      createdPassword.textContent = "";
      passwordField.hidden = true;
      passwordField.style.display = "none";
      warningTitle.textContent = ROLE_ADDED_WARNING_TITLE;
      warningText.textContent = ROLE_ADDED_WARNING_TEXT;
    } else {
      createdTitle.textContent = title || CREATED_TITLE;
      createdPassword.textContent = password;
      passwordField.hidden = false;
      passwordField.style.display = "";
      warningTitle.textContent = NEW_PASSWORD_WARNING_TITLE;
      warningText.textContent = NEW_PASSWORD_WARNING_TEXT;
    }

    createdOverlay.classList.add("is-open");
  }

  function closeCreatedModal() {
    createdOverlay.classList.remove("is-open");
    createdPassword.textContent = "";
    resetCopyButton();
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

  copyButton.addEventListener("click", function () {
    if (!createdPassword.textContent) {
      return;
    }

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

  document.addEventListener("tester:created", function (event) {
    showCreatedModal(event.detail, CREATED_TITLE);
  });

  document.addEventListener("tester:password-reset", function (event) {
    showCreatedModal(event.detail, RESET_TITLE);
  });
})();
