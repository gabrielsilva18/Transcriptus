const axios = require("axios");
const dayjs = require("dayjs");
const dictionary = require("./dictionary.controller");
const { translate } = require("bing-translate-api");

// Busca informações da palavra na API externa
async function getWordInfo(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    return response.data;
  } catch (error) {
    if (!error.response || error.response.status !== 404) {
      console.error("Erro ao buscar informações da palavra:", error.message);
    }
    return null;
  }
}

// Pega definição da palavra
async function getDefinition(wordInfoJson) {
  if (!wordInfoJson || !Array.isArray(wordInfoJson)) return null;
  try {
    const definitions = wordInfoJson[0]?.meanings?.flatMap((meaning) =>
      meaning.definitions.map((definition) => definition.definition)
    );
    return definitions?.[0] || null;
  } catch (error) {
    console.error("Erro ao obter definição:", error);
    return null;
  }
}

// Traduz definição para português
async function translateDefinition(definition) {
  if (!definition) return null;
  try {
    const result = await translate(definition, null, 'pt');
    return result.translation;
  } catch (error) {
    console.error("Erro ao traduzir definição:", error);
    return null;
  }
}

// Gera palavra aleatória do dia com fonética e definição
async function generateRandomWordtoDailyWord() {
  try {
    const today = dayjs().format("YYYY/MM/DD");
    let randomWord, phonetic, definition, translatedDefinition;

    let attempts = 10;

    while (attempts > 0) {
      // 1. Gera palavra aleatória do ipadict
      randomWord = dictionary.generateRandomWord();

      // 2. Busca fonética do ipadict
      const [ipaSymbols, phoneticTranscription] =
        await dictionary.getDetailsOfTranscription(randomWord.toLowerCase());
      phonetic = phoneticTranscription || ipaSymbols || "Phonetic not available";

      // 3. Busca definição via API
      const wordInfoJson = await getWordInfo(randomWord);
      definition = await getDefinition(wordInfoJson);

      if (definition) {
        // 4. Traduz definição para português
        translatedDefinition = await translateDefinition(definition);
        break; // Palavra válida encontrada
      }
      attempts--;
    }

    // fallback caso não consiga encontrar definição
    if (!definition) {
      randomWord = "welcome";
      definition = "An expression of greeting";
      phonetic = "/ˈwelkəm/";
      translatedDefinition = "Uma expressão de cumprimento";
    }

    return {
      date: today,
      dailyWord: randomWord,
      definition,
      phonetic,
      translatedDefinition,
    };
  } catch (error) {
    console.error("Erro ao gerar palavra diária:", error);
    return {
      date: dayjs().format("YYYY/MM/DD"),
      dailyWord: "welcome",
      definition: "An expression of greeting",
      phonetic: "/ˈwelkəm/",
      translatedDefinition: "Uma expressão de cumprimento",
    };
  }
}

module.exports = {
  generateRandomWordtoDailyWord,
  getWordInfo,
  getDefinition,
  translateDefinition,
};
