const outputButton = document.getElementById("output");
const processarBtn = document.getElementById("raffle");
const copyButton = document.getElementById("copyButton");

processarBtn.addEventListener("click", async (event) => {
  event.preventDefault();

  const response = await fetch("/random", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  outputButton.textContent = data.randomWord;
  copyButton.classList.remove("hidden"); // show the copyButton
  outputButton.style.display = "block"; // show the button
});
