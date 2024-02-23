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
const generateRandomWordtoDailyWord = () => {
  let word = dictionary.generateRandomWord();
  let word2 = dictionary.generateRandomWord();
  console.log(word2);
  if (!hasDefinition(word) || !wordDetails.hasPhrases(word)) {
    word = dictionary.generateRandomWord();
    console.log("New word: ", word);
  }
  return word;
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
    const filePath = "./dailyWord.json";
    const dateToday = dayjs(Date.now()).format("YYYY/MM/DD");

    if (fileIsValid(filePath)) {
      // Check if the file is valid
      const contentJsonDaily = await JSON.parse(
        fs.readFileSync(filePath, "utf-8")
      );
      // If it's valid, either read or create
      // Compare today's date with the stored one
      // If it's the same, just load it
      if (dateIsToday(dateToday, contentJsonDaily)) {
        return {
          dailyWord: contentJsonDaily.dailyWord,
          definition: contentJsonDaily.definition,
          phonetic: contentJsonDaily.phonetic,
        };
      } else {
        let newDailyWord = await generateNewDailyWord(dateToday);
        fs.writeFileSync("./dailyWord.json", newDailyWord);
      }
    } else {
      // If not, generate another one
      let newDailyWord = await generateNewDailyWord(dateToday);
      fs.writeFileSync("./dailyWord.json", newDailyWord);
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  generateRandomWordtoDailyWord,
  getDailyWordInfo,
  getWordInfo,
  getPhonetic,
};
