const projects = [
  {
    name: "Сайт студсовета",
    repository: "github.com/studsovet/site",
    tickets: 0,
    status: "Черновик",
    statusClass: "chip--neutral",
  },
  {
    name: "Интернет-магазин «Ромашка»",
    repository: "github.com/team-romashka/shop",
    tickets: 3,
    status: "Опубликован",
    statusClass: "chip--info",
  },
  {
    name: "Трекер привычек",
    repository: "github.com/habits-team/tracker",
    tickets: 5,
    status: "Опубликован",
    statusClass: "chip--info",
  },
  {
    name: "Бот расписания ТГУ",
    repository: "github.com/tsu-bots/schedule",
    tickets: 0,
    status: "Опубликован",
    statusClass: "chip--info",
  },
  {
    name: "Игра «Лабиринт»",
    repository: "github.com/maze-game/maze",
    tickets: 2,
    status: "Опубликован",
    statusClass: "chip--info",
  },
];

const projectsList = document.getElementById("projects-list");
const emptyState = document.getElementById("empty-state");

function renderProjects() {
  projectsList.innerHTML = "";

  if (projects.length === 0) {
    projectsList.hidden = true;
    emptyState.hidden = false;
    return;
  }

  projectsList.hidden = false;
  emptyState.hidden = true;

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = document.createElement("h2");
    title.textContent = project.name;

    const repository = document.createElement("a");
    repository.className = "project-card__repository";
    repository.href = "#";
    repository.textContent = project.repository;

    const footer = document.createElement("div");
    footer.className = "project-card__footer";

    const tickets = document.createElement("div");

    const ticketLabel = document.createElement("span");
    ticketLabel.className = "ticket-label";
    ticketLabel.textContent = "Открытых тикетов";

    const ticketCount = document.createElement("strong");
    ticketCount.className = "ticket-count";
    ticketCount.textContent = project.tickets;

    if (project.tickets === 0) {
      ticketCount.classList.add("ticket-count--empty");
    }

    tickets.append(ticketLabel, ticketCount);

    const status = document.createElement("span");
    status.className = `chip ${project.statusClass}`;
    status.textContent = project.status;

    footer.append(tickets, status);
    card.append(title, repository, footer);
    projectsList.append(card);
  });
}

function createProject() {
  const name = window.prompt("Введите название проекта:");

  if (!name || !name.trim()) {
    return;
  }

  projects.unshift({
    name: name.trim(),
    repository: "Репозиторий пока не добавлен",
    tickets: 0,
    status: "Черновик",
    statusClass: "chip--neutral",
  });

  renderProjects();
}

document
  .getElementById("create-project")
  .addEventListener("click", createProject);

document
  .getElementById("create-project-empty")
  .addEventListener("click", createProject);

renderProjects();