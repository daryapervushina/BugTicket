const TOKEN_KEY = "bugtracker_token";
const ROLE_KEY = "bugtracker_role";
const EMAIL_KEY = "bugtracker_email";
const FIRST_NAME_KEY = "bugtracker_first_name";
const LAST_NAME_KEY = "bugtracker_last_name";
const MUST_CHANGE_KEY = "bugtracker_must_change_password";
const LOGIN_PAGE = "login.html";

const ROLE_LABELS = {
  Developer: "Разработчик",
  Tester: "Тестировщик",
  Admin: "Администратор",
};

const avatarElement = document.getElementById("profile-avatar");
const nameElement = document.getElementById("profile-name");
const emailElement = document.getElementById("profile-email");
const roleElement = document.getElementById("profile-role");
const logoutButton = document.getElementById("logout-btn");
const customSelects = document.querySelectorAll(".custom-select");

function redirectToLogin() {
  window.location.href = LOGIN_PAGE;
}

function fillProfile() {
  const firstName = localStorage.getItem(FIRST_NAME_KEY) || "";
  const lastName = localStorage.getItem(LAST_NAME_KEY) || "";
  const email = localStorage.getItem(EMAIL_KEY) || "";
  const role = localStorage.getItem(ROLE_KEY) || "";

  const fullName = `${firstName} ${lastName}`.trim();
  const initialsSource = fullName || email;
  const parts = fullName ? fullName.split(" ") : [email];
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  avatarElement.textContent = initialsSource ? initials : "";
  nameElement.textContent = fullName;
  emailElement.textContent = email;
  roleElement.textContent = `Роль: ${ROLE_LABELS[role] || role}`;
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(FIRST_NAME_KEY);
  localStorage.removeItem(LAST_NAME_KEY);
  localStorage.removeItem(MUST_CHANGE_KEY);
  redirectToLogin();
}

function closeSelects() {
  customSelects.forEach((select) => select.classList.remove("is-open"));
}

function initSelect(select) {
  const trigger = select.querySelector(".custom-select__trigger");
  const text = select.querySelector(".custom-select__text");
  const hidden = select.querySelector('input[type="hidden"]');
  const options = select.querySelectorAll(".custom-select__option");

  trigger.addEventListener("click", () => {
    const isOpen = select.classList.contains("is-open");
    closeSelects();
    select.classList.toggle("is-open", !isOpen);
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const value = option.dataset.value;
      text.textContent = option.textContent.trim();
      text.classList.toggle("has-value", value !== "");
      hidden.value = value;
      select.classList.remove("is-open");
    });
  });
}

if (!localStorage.getItem(TOKEN_KEY)) {
  redirectToLogin();
} else {
  fillProfile();
  logoutButton.addEventListener("click", logout);
  customSelects.forEach(initSelect);
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".custom-select")) {
      closeSelects();
    }
  });
}
