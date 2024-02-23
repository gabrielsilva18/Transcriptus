const form = document.querySelector("form");
const textarea = document.getElementById("texto");
const spinner = document.querySelector(".spinner-border");
const buttonIcon = document.getElementById("search");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  buttonIcon.style.display = "none";

  spinner.classList.remove("d-none");

  if (textarea.value == "" || !isNaN(textarea.value)) {
    setTimeout(() => {
      // spinner.classList.add("d-none");
      setTimeout(() => {
        form.submit();
      }, 500);
    }, 500);
  } else {
    setTimeout(() => {
      // spinner.classList.add("d-none");
      setTimeout(() => {
        form.submit();
      }, 500);
    }, 500);
  }
});
