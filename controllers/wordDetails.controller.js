const Reverso = require("reverso-api");
const reverso = new Reverso();
const dictionary = require("./dictionary.controller.js");
const gAudio = require("./audioController.js");

// Check if there are phrases available for a given word
const hasPhrases = async (word) => {
  try {
    const response = await reverso.getTranslation(
      word,
      "english",
      "portuguese"
    );
    const translations = [...new Set(response.translations)];
    return translations.length > 0; // Returns true if there are translations, otherwise false
  } catch (error) {
    console.error(`Failed to translate word: ${word}. Error: ${error.message}`);
    return false; // Return false if there was an error
  }
};

// Generate phrases in English and Portuguese for a given word
const generatePhrases = async (word) => {
  try {
    const response = await reverso.getContext(word, "english", "portuguese");
    const phrases = response.examples.map((example) => ({
      english: example.source,
      portuguese: example.target,
    }));
    return phrases;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Generate translations to Portuguese for a given word
const generateTranslate = async (word) => {
  try {
    const response = await reverso.getTranslation(
      word,
      "english",
      "portuguese"
    );
    const translations = [...new Set(response.translations)];
    return translations;
  } catch (error) {
    console.error(`Failed to translate word: ${word}. Error: ${error.message}`);
    throw error;
  }
};

// Get all information about a word including translation, phrases, IPA pronunciation, etc.
const getInfoWord = async (word) => {
  let text = word.toLowerCase().trim();

  // Generate translations for the word
  const translation = await generateTranslate(text);

  // Generate audio for the word
  gAudio.generateAudio(text);

  // Generate phrases for the word
  const phrases = await generatePhrases(text);

  // Get IPA pronunciation for the word
  const [ipa, pronounce] = await dictionary.getDetailsOfTranscription(text);

  // Create an object containing all information about the word
  const wordInfo = {
    word: text,
    audio: "../audio.mp3", // Placeholder for audio file path
    translation: translation,
    phrases: phrases,
    ipa: ipa,
    pronounce: pronounce,
  };
  return wordInfo;
};

module.exports = {
  generatePhrases,
  generateTranslate,
  getInfoWord,
  hasPhrases,
};
