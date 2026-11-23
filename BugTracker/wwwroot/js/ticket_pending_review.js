const statusSelect = document.getElementById("status-select");
const statusTrigger = statusSelect.querySelector(".custom-select__trigger");
const statusText = document.getElementById("status-text");
const statusOptions = statusSelect.querySelectorAll(".custom-select__option");
const headerStatus = document.getElementById("header-status");
const saveButton = document.getElementById("save-ticket");

function updateStatus(status) {
  statusText.textContent = status;
  headerStatus.textContent = status;
  headerStatus.className = "chip";

  if (status === "Исправлен") {
    headerStatus.classList.add("chip--success");
  } else {
    headerStatus.classList.add("chip--warning");
  }
}

statusTrigger.addEventListener("click", () => {
  statusSelect.classList.toggle("is-open");
});

statusOptions.forEach((option) => {
  option.addEventListener("click", () => {
    updateStatus(option.dataset.value);
    statusSelect.classList.remove("is-open");
  });
});

document.addEventListener("click", (event) => {
  if (!statusSelect.contains(event.target)) {
    statusSelect.classList.remove("is-open");
  }
});

saveButton.addEventListener("click", () => {
  saveButton.textContent = "Сохранено";
});