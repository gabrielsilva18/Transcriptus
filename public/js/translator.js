document
  .getElementById("traduzir")
  .addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent page reload

    var inputText = document.getElementById("inputText").value; // Get the input text value

    // Perform a POST request to the "/significado" route with the input text
    try {
      var response = await fetch("/significado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texts: inputText }),
      });

      var data = await response.json(); // Parse the response JSON

      var translatedText = data.translatedText; // Get the translated text from the JSON response

      var outputTextarea = document.getElementById("output");
      outputTextarea.value = translatedText; // Set the translated text to the output textarea
      outputTextarea.classList.remove("output-block");
    } catch (error) {
      console.error(error);
    }
  });

const clearTextArea = () => {
  document.getElementById("inputText").addEventListener(click, () => {
    document.getElementById("inputText").value = "";
  });
};
