const { translate } = require("bing-translate-api");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
const translateText = async (text, userId) => {
  try {
    const translatedText = await translation(text);
    
    // Registra a busca no histórico do usuário
    await prisma.search.create({
      data: {
        word: text,
        type: 'TRANSLATION',
        userId: userId
      }
    });

    return translatedText;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = { translateText };
