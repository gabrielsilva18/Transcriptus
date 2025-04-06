const axios = require("axios");

const testWord = "dog";

const testTranslation = async () => {
  try {
    const response = await axios.get(
      `https://api.reverso.net/translate/v1/translation?from=english&to=portuguese&input=${testWord}`
    );
    console.log("Resposta da tradução:", response.data);
  } catch (error) {
    console.error(
      "Erro ao buscar tradução:",
      error.response ? error.response.data : error.message
    );
  }
};

testTranslation();
