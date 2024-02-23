const { translate } = require("bing-translate-api");

// Translation to Portuguese
const translation = async (text) => {
  try {
    const res = await translate(text, null, "pt");
    return res.translation;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Translate text to Portuguese
const translateText = async (text) => {
  try {
    const translatedText = await translation(text);
    return translatedText;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = { translateText };
