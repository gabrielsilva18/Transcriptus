const fs = require("fs");

// Define a constant object for text to IPA conversion
const textToIpa = {};

// Read dictionary
const wordsInLine = fs.readFileSync("./ipadict.txt", "utf-8").split("\n");

// Parse the file and store the text-to-IPA mappings in the textToIpa object
const parsingFile = (lines) => {
  for (const line of lines) {
    const [word, ipa] = line.split(/\s+/g);
    textToIpa[word] = ipa;
  }
};

// Call the parsingFile function with the words in lines
parsingFile(wordsInLine);

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// generate random word of Dictionary
function generateRandomWord() {
  const numberAllWords = wordsInLine.length;
  const randomPositionNumber = getRandomNumber(0, numberAllWords);
  const chosenLine = wordsInLine[randomPositionNumber];
  let wordDetails = chosenLine.split(/\s+/g);
  let wordCleaned = cleanWord(wordDetails[0]);
  return wordCleaned;
}

// Remover ( and ' of word)
const cleanWord = (word) => {
  if (word.match(/\(/)) {
    word = word.slice(0, word.indexOf("("));
  } else if (word.endsWith("'")) {
    word = word.slice(0, -1); // Remove a aspa simples no final
  }
  return word;
};

// checa se tem o simbolo no dicionário
const hasIpaSymbol = (word) => {
  return textToIpa[word];
};

// Find and return the IPA text for an English word
const getIpaSymbols = (word) => {
  if (hasIpaSymbol(word)) {
    let text = textToIpa[word];
    // Iterate from 1 - 3. There are no more than 3 extra pronunciations.
    for (let i = 1; i < 4; i++) {
      // See if pronunciation i exists...
      if (typeof textToIpa[word + "(" + i + ")"] != "undefined") {
        // ...If it does we know that the error should be multi and the text
        // is always itself plus the new pronunciation
        error = "multi";
        text += " / " + textToIpa[word + "(" + i + ")"];
        // ...Otherwise no need to keep iterating
      } else {
        break;
      }
    }
    return text;
  } else {
    return undefined;
  }
};

// Translate an IPA text to English words
const getPronounceOfWord = async (wordIPA) => {
  try {
    // se não encontrou, procurar em DictionaryAPI
    let wordEn = "";

    const ipaToEn = {
      b: "b",
      l: "l",
      ʌ: "uh",
      d: "d",
      dʒ: "g",
      θ: "th",
      h: "rr",
      e: "e",
      æ: "a",
      p: "p",
      y: "i",
      i: "ee",
      aɪ: "ai",
      oʊ: "ow",
      ʊ: "uh",
      aʊ: "au",
      u: "uw",
      ɔɪ: "ói",
      ə: "á",
      k: "k",
      m: "m",
      n: "n",
      s: "s",
      v: "v",
      t: "t",
      ɛ: "é",
      ɔ: "ao",
      ʧ: "ch",
      ər: "êr",
      ɪ: "ih",
      j: "y",
      a: "a",
      g: "g",
      z: "z",
      f: "f",
      r: "r",
      ɹ: "r",
      w: "w",
      o: "o",
      ɑ: "aa",
      ŋ: "ng",
      ɚ: "er",
      ð: "dh",
      "/": " ou ",
      ʒ: "zh",
      ʃ: "sh",
      ˈ: "ˈ",
      ʤ: "j",
    };

    for (const char of wordIPA) {
      for (let letter in ipaToEn) {
        if (letter == char) {
          wordEn += ipaToEn[letter];
        }
      }
    }
    wordEn = wordEn.replaceAll("ˈ", "·");
    return wordEn;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// details about transcription of word
const getDetailsOfTranscription = async (word) => {
  const ipaSymbols = getIpaSymbols(word);
  const phoneticTranscription = await getPronounceOfWord(ipaSymbols);
  return [ipaSymbols, phoneticTranscription];
};

module.exports = {
  getDetailsOfTranscription,
  generateRandomWord,
  getPronounceOfWord,
};
