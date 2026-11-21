const currentUser = "Иван Петров";

const developers = [
  "Иван Петров",
  "Мария Козлова",
  "Дмитрий Орлов",
  "Марина Ахметова",
  "Марина Лебедева",
  "Алексей Сидоров",
];

const selectedDevelopers = new Set([
  "Иван Петров",
  "Мария Козлова",
  "Дмитрий Орлов",
]);

const tickets = [
  {
    number: 12,
    title: "Не работает кнопка «Подтвердить заказ»",
    status: "Исправлен",
    verification: "Не исправлен",
    priority: "Высокий",
    developer: "Иван Петров",
    deadline: "28.10.2026 18:00",
    overdue: false,
    closed: false,
  },
  {
    number: 11,
    title: "Падает поиск при вводе спецсимволов",
    status: "Исправлен",
    verification: "Исправлен",
    priority: "Высокий",
    developer: "Мария Козлова",
    deadline: "20.10.2026 12:00",
    overdue: false,
    closed: true,
  },
  {
    number: 13,
    title: "Корзина не очищается после оплаты",
    status: "В разработке",
    verification: "Не исправлен",
    priority: "Средний",
    developer: "Иван Петров",
    deadline: "24.10.2026 18:00",
    overdue: true,
    closed: false,
  },
  {
    number: 10,
    title: "Неверно считается сумма скидки",
    status: "Исправлен",
    verification: "Исправлен",
    priority: "Средний",
    developer: "Мария Козлова",
    deadline: "18.10.2026 12:00",
    overdue: false,
    closed: true,
  },
  {
    number: 14,
    title: "Опечатка на странице «О нас»",
    status: "Не исправлен",
    verification: "Не исправлен",
    priority: "Низкий",
    developer: "",
    deadline: "—",
    overdue: false,
    closed: false,
  },
];

const developerSearch = document.getElementById("developer-search");
const developerOptions = document.getElementById("developer-options");
const developerList = document.getElementById("developer-list");
const ticketsBody = document.getElementById("tickets-body");

function chipClass(value) {
  const classes = {
    Исправлен: "chip--success",
    "В разработке": "chip--warning",
    "Не исправлен": "chip--danger",
    Высокий: "chip--danger",
    Средний: "chip--warning",
    Низкий: "chip--neutral",
  };

  return classes[value] || "chip--neutral";
}

function verificationChipClass(value) {
  return value === "Исправлен"
    ? "chip--success-outline"
    : "chip--outline";
}

function renderDevelopers() {
  developerList.innerHTML = "";

  selectedDevelopers.forEach((developer) => {
    const chip = document.createElement("span");
    chip.className = "developer-chip";
    chip.append(document.createTextNode(developer));

    const removeButton = document.createElement("button");
    removeButton.className = "developer-chip__remove";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute(
      "aria-label",
      `Удалить разработчика ${developer}`,
    );

    removeButton.addEventListener("click", () => {
      selectedDevelopers.delete(developer);
      renderDevelopers();
      renderDeveloperOptions(developerSearch.value);
    });

    chip.append(removeButton);
    developerList.append(chip);
  });
}

function renderDeveloperOptions(search = "") {
  developerOptions.innerHTML = "";

  const searchText = search.toLowerCase().trim();

  developers
    .filter((developer) => developer.toLowerCase().includes(searchText))
    .forEach((developer) => {
      const option = document.createElement("label");
      option.className = "developer-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selectedDevelopers.has(developer);

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedDevelopers.add(developer);
        } else {
          selectedDevelopers.delete(developer);
        }

        renderDevelopers();
      });

      option.append(checkbox, `${developer} · разработчик`);
      developerOptions.append(option);
    });
}

function renderTickets() {
  const search = document
    .getElementById("ticket-search")
    .value
    .trim()
    .toLowerCase();

  const selectedStatus = document.getElementById("status-filter").value;
  const selectedPriority = document.getElementById("priority-filter").value;
  const onlyMine = document.getElementById("only-mine").checked;
  const hideClosed = document.getElementById("hide-closed").checked;

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(search) ||
      String(ticket.number).includes(search);

    const matchesStatus =
      selectedStatus === "all" || ticket.status === selectedStatus;

    const matchesPriority =
      selectedPriority === "all" || ticket.priority === selectedPriority;

    const matchesMine = !onlyMine || ticket.developer === currentUser;
    const matchesClosed = !hideClosed || !ticket.closed;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesMine &&
      matchesClosed
    );
  });

  ticketsBody.innerHTML = "";

  filteredTickets.forEach((ticket) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="data-table__number">#${ticket.number}</td>

      <td>
        <a class="data-table__link" href="ticket_view.html">
          ${ticket.title}
        </a>
      </td>

      <td>
        <span class="chip ${chipClass(ticket.status)}">
          ${ticket.status}
        </span>
      </td>

      <td>
        <span class="chip ${verificationChipClass(ticket.verification)}">
          ${ticket.verification}
        </span>
      </td>

      <td>
        <span class="chip ${chipClass(ticket.priority)}">
          ${ticket.priority}
        </span>
      </td>

      <td class="${ticket.developer ? "" : "data-table__muted"}">
        ${ticket.developer || "Не назначен"}
      </td>

      <td class="${ticket.overdue ? "data-table__overdue" : ""}">
        ${ticket.deadline}
      </td>
    `;

    ticketsBody.append(row);
  });
}

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

document.getElementById("ticket-search").addEventListener("input", renderTickets);
document.getElementById("status-filter").addEventListener("change", renderTickets);
document.getElementById("priority-filter").addEventListener("change", renderTickets);
document.getElementById("only-mine").addEventListener("change", renderTickets);
document.getElementById("hide-closed").addEventListener("change", renderTickets);

document.getElementById("project-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const repository = document.getElementById("repository");
  const repositoryLink = document.getElementById("repository-link");

  repositoryLink.href = repository.value;
});

renderDevelopers();
renderTickets();