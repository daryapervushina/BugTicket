(function () {
  const overlay = document.getElementById("block-overlay");
  const userName = document.getElementById("block-user-name");
  const confirmButton = document.getElementById("confirm-block-btn");

  function openBlockModal(trigger) {
    const row = trigger.closest("tr");
    const nameElement = row ? row.querySelector(".tester-user__name") : null;

    if (!nameElement) {
      return;
    }

    userName.textContent = nameElement.textContent;
    confirmButton.dataset.testerId = trigger.dataset.testerId;
    overlay.classList.add("is-open");
  }

  function closeBlockModal() {
    overlay.classList.remove("is-open");
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-block-tester]");

    if (trigger) {
      openBlockModal(trigger);
    }
  });

  document.querySelectorAll("[data-close-block]").forEach(function (button) {
    button.addEventListener("click", closeBlockModal);
  });

  confirmButton.addEventListener("click", closeBlockModal);

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closeBlockModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeBlockModal();
    }
  });
})();
