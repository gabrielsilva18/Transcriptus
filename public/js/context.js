const spinner = document.querySelector(".spinner-border");
const buttonIcon = document.getElementById("eye");

document
  .getElementById("form")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent page reload

    // Hide icon and show spinner
    buttonIcon.style.display = "none";
    spinner.classList.remove("d-none");

    // get input and output area
    var outputArea = document.getElementById("outputDiv");
    var inputText = document.getElementById("word").value;
    if (inputIsValid(inputText)) {
      try {
        // Perform a POST request to the "/frases"
        var response = await fetch("/frases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: inputText }),
        });

        // Process response
        var data = await response.json(); // Parse the response JS

        // Check for errors
        if (!data.error) {
          // Render phrases
          outputArea.innerHTML = "";
          var phrases = data.phrases;
          phrases.forEach(function (phrase) {
            var phraseContainer = document.createElement("div");
            phraseContainer.classList.add("phrase-container");

            var englishPhrase = document.createElement("div");
            englishPhrase.classList.add("english-phrase");
            englishPhrase.textContent = phrase.english;

            var portuguesePhrase = document.createElement("div");
            portuguesePhrase.classList.add("portuguese-phrase");
            portuguesePhrase.textContent = phrase.portuguese;

            phraseContainer.appendChild(englishPhrase);
            phraseContainer.appendChild(portuguesePhrase);

            var hr = document.createElement("hr");
            phraseContainer.append(hr.cloneNode());
            outputArea.appendChild(phraseContainer);
          });
        } else {
          // Show API error message
          outputArea.innerHTML = data.error;
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      outputArea.innerHTML = "A palavra digitada é inválida";
    }

    // Hide spinner when done
    spinner.classList.add("d-none");
    buttonIcon.style.display = "";
  });

// Input validation function
const inputIsValid = (input) => {
  return input != "" && isNaN(input);
};
