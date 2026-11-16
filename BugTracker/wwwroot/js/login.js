const customSelect = document.querySelector(".custom-select");
const trigger = customSelect.querySelector(".custom-select__trigger");
const options = customSelect.querySelectorAll(".custom-select__option");
const textSpan = customSelect.querySelector(".custom-select__text");
const hiddenInput = document.getElementById("role-input");
const form = document.querySelector(".auth-form");

trigger.addEventListener("click", function () {
  customSelect.classList.toggle("is-open");
});

options.forEach(function (option) {
  option.addEventListener("click", function () {
    textSpan.textContent = this.textContent;
    textSpan.classList.add("has-value");
    hiddenInput.value = this.getAttribute("data-value");
    customSelect.classList.remove("is-open");
  });
});

document.addEventListener("click", function (event) {
  if (!customSelect.contains(event.target)) {
    customSelect.classList.remove("is-open");
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    customSelect.classList.remove("is-open");
  }
});

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!hiddenInput.value) {
    customSelect.classList.add("is-open");
    trigger.focus();
    return;
  }
});
