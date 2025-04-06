const Reverso = require("reverso-api");
const reverso = new Reverso();

const testWord = "dog"; // Tente palavras mais comuns como "dog"

const testTranslation = async () => {
  try {
    const response = await reverso.getTranslation(
      testWord,
      "english",
      "portuguese"
    );
    console.log("Resposta da tradução:", response);
    if (response.translations && response.translations.length > 0) {
      console.log("Traduções encontradas:", response.translations);
    } else {
      console.warn(`⚠️ Nenhuma tradução encontrada para "${testWord}"`);
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar tradução para "${testWord}":`, error);
  }
};

const testContext = async () => {
  try {
    const response = await reverso.getContext(
      testWord,
      "english",
      "portuguese"
    );
    console.log("Resposta completa de contexto:", response); // Exibe toda a resposta

    if (response.examples && response.examples.length > 0) {
      console.log("Exemplos de frases encontrados:", response.examples);
    } else {
      console.warn(`⚠️ Nenhum exemplo encontrado para "${testWord}"`);
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar contexto para "${testWord}":`, error);
  }
};

// Teste as traduções e o contexto
testTranslation();
testContext();
