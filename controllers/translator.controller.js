const axios = require("axios");
const prisma = require('../lib/prisma');

// Cache para traduções
const translationCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

// Rate limiting para Gemini
let lastTranslationCall = 0;
const TRANSLATION_DELAY = 1000; // 1 segundo entre traduções (Gemini é mais tolerante)

// Delay entre traduções para evitar rate limiting
async function delayTranslation() {
  const now = Date.now();
  const timeSinceLastCall = now - lastTranslationCall;
  
  if (timeSinceLastCall < TRANSLATION_DELAY) {
    const delay = TRANSLATION_DELAY - timeSinceLastCall;
    console.log(`⏳ Aguardando ${delay}ms para evitar rate limiting do Gemini...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastTranslationCall = Date.now();
}

// Translation using Gemini AI (replaces Bing)
const translation = async (text, sourceLang, targetLang) => {
  try {
    // Verifica cache primeiro
    const cacheKey = `${text}-${sourceLang}-${targetLang}`;
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("📋 Usando tradução do cache");
      return cached.translation;
    }

    // Rate limiting
    await delayTranslation();

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY não configurada');
      return "Tradução indisponível - chave de API não configurada";
    }

    // Mapeia códigos de idioma para nomes completos
    const languageNames = {
      'en': 'inglês',
      'pt': 'português', 
      'es': 'espanhol',
      'fr': 'francês',
      'de': 'alemão',
      'it': 'italiano'
    };

    const sourceLangName = languageNames[sourceLang] || sourceLang;
    const targetLangName = languageNames[targetLang] || targetLang;

    const prompt = `Traduza o seguinte texto do ${sourceLangName} para ${targetLangName}:

"${text}"

IMPORTANTE:
- Forneça APENAS a tradução, sem explicações
- Mantenha a formatação original (quebras de linha, pontuação)
- Se o texto contém gírias ou expressões idiomáticas, traduza de forma natural
- Responda apenas com a tradução direta`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const translatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!translatedText) {
      console.warn("Resposta vazia do Gemini para tradução");
      return "Tradução indisponível";
    }

    // Salva no cache
    translationCache.set(cacheKey, {
      translation: translatedText,
      timestamp: Date.now()
    });

    console.log(`✅ Tradução gerada com Gemini: ${sourceLang} → ${targetLang}`);
    return translatedText;
    
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn("⚠️ Rate limit do Gemini atingido");
      return "Tradução temporariamente indisponível devido ao limite de requisições. Tente novamente em alguns minutos.";
    }
    console.error("Erro na tradução com Gemini:", err.message);
    return "Tradução indisponível";
  }
};

// Translate text between languages
const translateText = async (text, sourceLang, targetLang, userId) => {
  try {
    // Validação básica
    if (!text || text.trim().length === 0) {
      return "Por favor, digite um texto para traduzir.";
    }

    if (text.length > 5000) {
      return "Texto muito longo. Por favor, use textos menores que 5000 caracteres.";
    }

    const translatedText = await translation(text, sourceLang, targetLang);
    
    // Registra a busca no histórico do usuário (apenas se a tradução foi bem-sucedida)
    if (userId && translatedText && !translatedText.includes("indisponível")) {
      try {
        await prisma.search.create({
          data: {
            word: text,
            type: 'TRANSLATION',
            userId: userId
          }
        });
      } catch (dbError) {
        console.warn("Erro ao salvar no histórico:", dbError.message);
        // Não falha a tradução por causa do histórico
      }
    }

    return translatedText;
  } catch (err) {
    console.error("Erro ao traduzir texto:", err);
    return "Não foi possível realizar a tradução. Tente novamente mais tarde.";
  }
};

module.exports = { translateText };
