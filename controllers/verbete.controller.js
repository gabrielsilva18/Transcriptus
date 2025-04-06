const fs = require("fs");
const axios = require("axios");
const dayjs = require("dayjs");
const wordDetails = require("./wordDetails.controller");
const dictionary = require("./dictionary.controller");

// Check if there is a definition in the dictionary
async function hasDefinition(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );

    // Verifica se há pelo menos uma definição para a palavra
    return response.data.length > 0;
  } catch (error) {
    console.error("An error occurred:", error.response.data);
    return false; // Retorna false em caso de erro
  }
}

// Generate random word
const generateRandomWordtoDailyWord = async () => {
  try {
    const today = dayjs().format("YYYY/MM/DD");
    const randomWord = await dictionary.generateRandomWord();
    const definition = await getWordInfo(randomWord);

    const dailyWord = {
      date: today,
      dailyWord: randomWord,
      definition: definition?.definition || "Definition not available"
    };

    fs.writeFileSync("dailyWord.json", JSON.stringify(dailyWord, null, 2));
    return dailyWord;
  } catch (error) {
    console.error("Erro ao gerar palavra diária:", error);
    throw error;
  }
};

// Generate JSON about word info
async function getWordInfo(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    return response.data;
  } catch (error) {
    console.error("An error occurred:", error.response.data);
    return error;
  }
}

// Get phonetic notation of the word
async function getPhonetic(dailyWordJson) {
  try {
    let phoneticNotation;
    await dailyWordJson[0].phonetics.forEach((element) => {
      if (element.text !== undefined) {
        phoneticNotation = element.text;
      }
    });
    return phoneticNotation;
  } catch (error) {
    console.error("An error occurred:", error.response.data);
    throw error;
  }
}

// Generate definition of the word
async function getDefinition(wordInfoJson) {
  let definitions;
  try {
    definitions = wordInfoJson[0]?.meanings?.flatMap((meaning) =>
      meaning.definitions.map((definition) => definition.definition)
    );
  } catch (error) {
    console.error("An error occurred during the request:", error);
  }

  if (definitions && definitions.length > 0) {
    return definitions[0];
  } else {
    console.log("No definition found for the word:", word);
    return null;
  }
}

// Fetch all information of the Word of the Day
async function fetchDailyWordInfo() {
  // Generating information of the word of the day
  const dailyWord = await generateRandomWordtoDailyWord();
  const dailyWordJson = await getWordInfo(dailyWord);
  const definition = await getDefinition(dailyWordJson);
  const phonetic = await getPhonetic(dailyWordJson);

  return {
    dailyWord: dailyWord,
    definition: definition,
    phonetic: phonetic,
  };
}

// Generate new word of the day
async function generateNewDailyWord(dateToday) {
  const newWordDaily = await fetchDailyWordInfo();
  const newWordDailyObject = {
    date: dateToday,
    dailyWord: newWordDaily.dailyWord,
    definition: newWordDaily.definition,
    phonetic: newWordDaily.phonetic,
  };
  // Converting to JSON
  const jsonNewWordDaily = JSON.stringify(newWordDailyObject, null, 2);
  return jsonNewWordDaily;
}

// Check if details of the file are valid (where the daily word will be stored)
const fileIsValid = (filePath) => {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size !== 0;
  } catch (error) {
    console.error("Error checking file validity:", error);
    return false;
  }
};

// Check if the file date is today's date
function dateIsToday(dateToday, wordInfoJson) {
  return dateToday === wordInfoJson.date;
}

// Get the daily word info
async function getDailyWordInfo() {
  try {
    const data = fs.readFileSync("dailyWord.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler arquivo dailyWord.json:", error);
    return null;
  }
}

module.exports = {
  generateRandomWordtoDailyWord,
  getDailyWordInfo,
  getWordInfo,
  getPhonetic,
};
