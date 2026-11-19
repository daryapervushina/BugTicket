const developers = [
  {
    id: 1,
    initials: "ИП",
    name: "Иван Петров",
    email: "i.petrov@stud.tsu.ru",
  },
  {
    id: 2,
    initials: "МК",
    name: "Мария Козлова",
    email: "m.kozlova@stud.tsu.ru",
  },
  {
    id: 3,
    initials: "МА",
    name: "Марина Ахметова",
    email: "m.akhmetova@stud.tsu.ru",
  },
  {
    id: 4,
    initials: "МЛ",
    name: "Марина Лебедева",
    email: "m.lebedeva@stud.tsu.ru",
  },
];

const selectedDeveloperIds = new Set();

const projectForm = document.getElementById("project-form");
const projectNameInput = document.getElementById("project-name");
const repositoryField = document.getElementById("repository-field");
const repositoryInput = document.getElementById("repository");
const repositoryError = document.getElementById("repository-error");
const developerSearch = document.getElementById("developer-search");
const developerOptions = document.getElementById("developer-options");
const developersError = document.getElementById("developers-error");
const selectedDevelopers = document.getElementById("selected-developers");
const saveButton = document.getElementById("save-project");
const publishButton = document.getElementById("publish-project");

let repositoryTouched = false;
let developersTouched = false;

function isValidUrl(value) {
  try {
    const url = new URL(value.trim());

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function updateFormState() {
  const nameIsValid = projectNameInput.value.trim().length > 0;
  const repositoryIsValid = isValidUrl(repositoryInput.value);
  const developersAreSelected = selectedDeveloperIds.size > 0;

  const repositoryHasError = repositoryTouched && !repositoryIsValid;
  const developersHaveError = developersTouched && !developersAreSelected;

  repositoryField.classList.toggle("input-field--error", repositoryHasError);
  repositoryError.hidden = !repositoryHasError;

  developersError.hidden = !developersHaveError;

  const formIsValid =
    nameIsValid &&
    repositoryIsValid &&
    developersAreSelected;

  saveButton.disabled = !formIsValid;
  publishButton.disabled = !formIsValid;
}

function renderSelectedDevelopers() {
  selectedDevelopers.innerHTML = "";

  developers
    .filter((developer) => selectedDeveloperIds.has(developer.id))
    .forEach((developer) => {
      const item = document.createElement("div");
      item.className = "selected-developer";

      item.innerHTML = `
        <div class="selected-developer__avatar">${developer.initials}</div>

        <div class="selected-developer__info">
          <strong>${developer.name}</strong>
          <span>${developer.email}</span>
        </div>
      `;

      const removeButton = document.createElement("button");
      removeButton.className = "remove-developer";
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.setAttribute(
        "aria-label",
        `Удалить разработчика ${developer.name}`,
      );

      removeButton.addEventListener("click", () => {
        selectedDeveloperIds.delete(developer.id);
        developersTouched = true;

        renderSelectedDevelopers();
        renderDeveloperOptions(developerSearch.value);
        updateFormState();
      });

      item.append(removeButton);
      selectedDevelopers.append(item);
    });
}

function renderDeveloperOptions(searchText = "") {
  developerOptions.innerHTML = "";

  const search = searchText.trim().toLowerCase();

  const foundDevelopers = developers.filter((developer) => {
    const developerText =
      `${developer.name} ${developer.email}`.toLowerCase();

    return developerText.includes(search);
  });

  foundDevelopers.forEach((developer) => {
    const option = document.createElement("label");
    option.className = "developer-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedDeveloperIds.has(developer.id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedDeveloperIds.add(developer.id);
      } else {
        selectedDeveloperIds.delete(developer.id);
      }

      developersTouched = true;

      renderSelectedDevelopers();
      updateFormState();
    });

    option.append(
      checkbox,
      `${developer.name} · ${developer.email}`,
    );

    developerOptions.append(option);
  });
}

projectNameInput.addEventListener("input", updateFormState);

repositoryInput.addEventListener("input", () => {
  repositoryTouched = true;
  updateFormState();
});

repositoryInput.addEventListener("blur", () => {
  repositoryTouched = true;
  updateFormState();
});

developerSearch.addEventListener("focus", () => {
  renderDeveloperOptions(developerSearch.value);
});

developerSearch.addEventListener("input", () => {
  renderDeveloperOptions(developerSearch.value);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".developer-picker")) {
    developerOptions.innerHTML = "";
  }
});

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  repositoryTouched = true;
  developersTouched = true;
  updateFormState();

  if (saveButton.disabled) {
    return;
  }

  saveButton.textContent = "Проект сохранён";
});

publishButton.addEventListener("click", () => {
  if (!publishButton.disabled) {
    window.location.href = "dev_projects.html";
  }
});

renderSelectedDevelopers();
updateFormState();
