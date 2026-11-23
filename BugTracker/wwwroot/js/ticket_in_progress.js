const statusSelect = document.getElementById("status-select");
const statusTrigger = statusSelect.querySelector(".custom-select__trigger");
const statusText = document.getElementById("status-text");
const statusOptions = statusSelect.querySelectorAll(".custom-select__option");

const headerStatus = document.getElementById("header-status");
const releaseInput = document.getElementById("release");
const mergeRequestInput = document.getElementById("merge-request");
const releaseError = document.getElementById("release-error");

const saveButton = document.getElementById("save-ticket");
const abandonButton = document.getElementById("abandon-ticket");
const addMergeRequestButton = document.getElementById("add-merge-request");

function updateHeaderStatus(status) {
  headerStatus.textContent = status;
  headerStatus.className = "chip";

  if (status === "Исправлен") {
    headerStatus.classList.add("chip--success");
  } else if (status === "В разработке") {
    headerStatus.classList.add("chip--warning");
  } else {
    headerStatus.classList.add("chip--danger");
  }
}

statusTrigger.addEventListener("click", () => {
  statusSelect.classList.toggle("is-open");
});

statusOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const status = option.dataset.value;

    statusText.textContent = status;
    statusSelect.classList.remove("is-open");
    updateHeaderStatus(status);
    releaseError.hidden = true;
  });
});

document.addEventListener("click", (event) => {
  if (!statusSelect.contains(event.target)) {
    statusSelect.classList.remove("is-open");
  }
});

saveButton.addEventListener("click", () => {
  const selectedStatus = statusText.textContent.trim();
  const releaseFilled = releaseInput.value.trim().length > 0;
  const mergeRequestFilled = mergeRequestInput.value.trim().length > 0;

  if (selectedStatus === "Исправлен" && (!releaseFilled || !mergeRequestFilled)) {
    releaseError.hidden = false;
    return;
  }

  releaseError.hidden = true;
  saveButton.textContent = "Сохранено";
});

abandonButton.addEventListener("click", () => {
  window.location.href = "project_view.html";
});

addMergeRequestButton.addEventListener("click", () => {
  if (mergeRequestInput.value.trim()) {
    mergeRequestInput.value = "";
    saveButton.textContent = "Сохранить тикет";
  }
});