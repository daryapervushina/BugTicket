(function () {
  const logoutButton = document.querySelector(".logout-button");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", function () {
    window.location.href = "admin_login.html";
  });
})();
