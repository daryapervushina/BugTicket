(function () {
  const API_BASE_URL = "";
  const TESTERS_URL = API_BASE_URL + "/api/admin/testers";
  const TOKEN_KEY = "bugtracker_token";
  const ROLE_KEY = "bugtracker_role";
  const LOGIN_PAGE = "admin_login.html";

  let isSubmitting = false;

  function redirectToLogin() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    window.location.href = LOGIN_PAGE;
  }

  async function requestPasswordReset(id) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {};

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    return fetch(TESTERS_URL + "/" + id + "/reset-password", {
      method: "POST",
      headers: headers,
    });
  }

  async function resetPassword(trigger) {
    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    trigger.disabled = true;

    try {
      const response = await requestPasswordReset(trigger.dataset.testerId);

      if (response.ok) {
        const data = await response.json();

        isSubmitting = false;
        trigger.disabled = false;
        document.dispatchEvent(
          new CustomEvent("tester:password-reset", { detail: data }),
        );
        return;
      }

      if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        return;
      }

      if (response.status === 404) {
        isSubmitting = false;
        document.dispatchEvent(new CustomEvent("tester:updated"));
        return;
      }
    } catch (error) {
      isSubmitting = false;
      trigger.disabled = false;
      return;
    }

    isSubmitting = false;
    trigger.disabled = false;
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-reset-password]");

    if (trigger) {
      resetPassword(trigger);
    }
  });
})();
