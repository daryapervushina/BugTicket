const takeButton = document.getElementById("take-ticket");
const assignmentBanner = document.getElementById("assignment-banner");
const responsible = document.getElementById("responsible");
const bugStatus = document.getElementById("bug-status");
const bugStatusSelect = document.getElementById("bug-status-select");

function updateBugStatus(status) {
  bugStatus.textContent = status;

  bugStatus.className = "chip";

  if (status === "Исправлен") {
    bugStatus.classList.add("chip--success");
  } else if (status === "В разработке") {
    bugStatus.classList.add("chip--warning");
  } else {
    bugStatus.classList.add("chip--danger");
  }
}

takeButton.addEventListener("click", () => {
  responsible.textContent = "Иван Петров";
  responsible.classList.remove("parameter__value--muted");

  bugStatusSelect.value = "В разработке";
  updateBugStatus("В разработке");

  assignmentBanner.hidden = true;
  takeButton.textContent = "Взято в работу";
  takeButton.disabled = true;
});

bugStatusSelect.addEventListener("change", () => {
  updateBugStatus(bugStatusSelect.value);
});