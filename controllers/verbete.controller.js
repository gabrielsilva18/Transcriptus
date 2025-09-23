const axios = require("axios");
const dayjs = require("dayjs");
const dictionary = require("./dictionary.controller");

// Cache para evitar rate limiting
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// Rate limiting para APIs externas
let lastApiCall = 0;
const API_DELAY = 2000; // 2 segundos entre chamadas

// Delay entre chamadas de API para evitar rate limiting
async function delayApiCall() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < API_DELAY) {
    const delay = API_DELAY - timeSinceLastCall;
    console.log(`⏳ Aguardando ${delay}ms para evitar rate limiting...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastApiCall = Date.now();
}

// Busca informações da palavra na API externa com rate limiting
async function getWordInfo(word) {
  try {
    await delayApiCall();
    
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      { timeout: 10000 } // 10 segundos de timeout
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`⚠️ Rate limit atingido para Dictionary API. Palavra: ${word}`);
      return null;
    }
    if (error.response?.status !== 404) {
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

// Gera palavra aleatória do dia com fonética e definição (SEM tradução)
async function generateRandomWordtoDailyWord() {
  try {
    const today = dayjs().format("YYYY/MM/DD");
    
    // Verifica cache primeiro
    const cacheKey = `daily-word-${today}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("📋 Usando palavra do dia do cache");
      return cached.data;
    }

    let randomWord, phonetic, definition;
    let attempts = 5; // Reduzido de 10 para 5 tentativas

    while (attempts > 0) {
      try {
        // 1. Gera palavra aleatória do ipadict
        randomWord = dictionary.generateRandomWord();
        console.log(`🎲 Tentando palavra: ${randomWord}`);

        // 2. Busca fonética do ipadict (sem dependência externa)
        const [ipaSymbols, phoneticTranscription] =
          await dictionary.getDetailsOfTranscription(randomWord.toLowerCase());
        phonetic = phoneticTranscription || ipaSymbols || "Phonetic not available";

        // 3. Busca definição via API (com rate limiting)
        const wordInfoJson = await getWordInfo(randomWord);
        definition = await getDefinition(wordInfoJson);

        if (definition) {
          console.log(`✅ Palavra válida encontrada: ${randomWord}`);
          break; // Palavra válida encontrada
        }
        
        attempts--;
        console.log(`❌ Tentativa falhou para: ${randomWord}. Restam: ${attempts}`);
        
        // Delay entre tentativas para evitar rate limiting
        if (attempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Erro na tentativa para ${randomWord}:`, error.message);
        attempts--;
      }
    }

    // Fallback caso não consiga encontrar definição
    if (!definition) {
      console.log("🔄 Usando fallback para palavra do dia");
      randomWord = "welcome";
      definition = "An expression of greeting";
      phonetic = "/ˈwelkəm/";
    }

    const result = {
      date: today,
      dailyWord: randomWord,
      definition,
      phonetic,
      // REMOVIDO: translatedDefinition - forçar uso do tradutor próprio
    };

    // Salva no cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log("📝 Palavra do dia gerada:", {
      word: randomWord,
      hasDefinition: !!definition,
      hasPhonetic: !!phonetic
    });

    return result;
  } catch (error) {
    console.error("Erro ao gerar palavra diária:", error);
    return {
      date: dayjs().format("YYYY/MM/DD"),
      dailyWord: "welcome",
      definition: "An expression of greeting",
      phonetic: "/ˈwelkəm/",
      // REMOVIDO: translatedDefinition
    };
  }
}

module.exports = {
  generateRandomWordtoDailyWord,
  getWordInfo,
  getDefinition,
};
