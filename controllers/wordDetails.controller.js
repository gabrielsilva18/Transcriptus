const fs = require("fs");
const Reverso = require("reverso-api");
const chromium = require("@sparticuz/chromium");
const axios = require("axios");

let reversoInstancePromise = null;
async function getReverso() {
  // No Vercel, sempre usa Gemini como fallback
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log("🌐 Ambiente Vercel detectado - usando apenas Gemini");
    return null; // Força uso do Gemini
  }
  
  if (!reversoInstancePromise) {
    reversoInstancePromise = (async () => {
      try {
        const executablePath = await chromium.executablePath();
        return new Reverso({
          puppeteerOptions: {
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || executablePath,
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            ignoreHTTPSErrors: true,
            timeout: 60000,
          },
        });
      } catch (error) {
        console.warn("⚠️ Erro ao inicializar Reverso, usando Gemini:", error.message);
        return null;
      }
    })();
  }
  return reversoInstancePromise;
}
const dictionary = require("./dictionary.controller.js");
const gAudio = require("./audioController.js");

// Cache system
const cache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache para frases já mostradas (evita duplicatas)
const shownPhrasesCache = new Map();

// Check if word is in cache and not expired
const getFromCache = (word) => {
  const cached = cache.get(word);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Save to cache
const saveToCache = (word, data) => {
  cache.set(word, {
    data,
    timestamp: Date.now()
  });
};

// Check if there are phrases available for a given word
const hasPhrases = async (word) => {
  try {
    const reverso = await getReverso();
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

// Removido: gerador de exemplos genéricos (substituído por Reverso + Gemini)

// Generate contextual phrases using Gemini AI
const generateGeminiPhrases = async (word, excludePhrases = []) => {
  try {
    console.log(`🤖 Gerando frases contextuais com Gemini para: ${word}`);
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY não configurada nas variáveis de ambiente');
      return [];
    }
    
    // Cria lista de frases já mostradas para evitar duplicatas
    const excludeText = excludePhrases.length > 0 ? 
      `\n\nIMPORTANT: Do NOT generate any of these phrases (they are already shown):\n${excludePhrases.map(p => `- "${p.english}"`).join('\n')}` : '';
    
    const prompt = `Generate 8 natural, contextual example sentences in English using the word "${word}" and provide their Portuguese translations. 

Format the response as a JSON array with this exact structure:
[
  {
    "english": "Example sentence in English with the word naturally used",
    "portuguese": "Tradução em português"
  }
]

Make sure the sentences are:
- Natural and contextual (not generic templates)
- Use the word "${word}" in different contexts
- Show different meanings/uses of the word
- Are appropriate for language learning
- COMPLETELY DIFFERENT from any previously shown phrases${excludeText}

Example for "cat":
[
  {
    "english": "The cat is sleeping peacefully on the windowsill.",
    "portuguese": "O gato está dormindo tranquilamente no parapeito da janela."
  }
]

Generate exactly 8 examples for "${word}":`;

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

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.warn("Resposta vazia do Gemini");
      return [];
    }

    // Tenta extrair JSON da resposta
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const phrases = JSON.parse(jsonMatch[0]);
      console.log(`✅ Gemini gerou ${phrases.length} frases para: ${word}`);
      
      // Normaliza as propriedades das frases
      const normalizedPhrases = phrases.map(phrase => ({
        english: phrase.english || phrase.inglês || '',
        portuguese: phrase.portuguese || phrase.português || phrase.tradução || ''
      })).filter(phrase => phrase.english && phrase.portuguese);
      
      console.log(`📝 Frases normalizadas: ${normalizedPhrases.length}`);
      return normalizedPhrases;
    } else {
      console.warn("Não foi possível extrair JSON da resposta do Gemini");
      return [];
    }

  } catch (error) {
    console.error(`❌ Erro ao gerar frases com Gemini para ${word}:`, error.message);
    return [];
  }
};

// Generate translations using Gemini AI
const generateGeminiTranslations = async (word) => {
  try {
    console.log(`🤖 Gerando traduções com Gemini para: ${word}`);
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY não configurada nas variáveis de ambiente');
      return [];
    }
    
    const prompt = `Provide 10 different Portuguese translations for the English word "${word}". 

IMPORTANT RULES:
- NEVER include the original English word "${word}" in the translations
- Only provide Portuguese words/phrases
- Include common translations, synonyms, and variations
- Consider different contexts and meanings
- Include formal and informal versions when applicable

Format as a simple JSON array of strings:
["translation1", "translation2", "translation3", ...]

Example for "book":
["livro", "reservar", "agendar", "marcar", "caderno", "obra", "manual", "carteira", "catálogo", "regras"]

Generate exactly 10 DIFFERENT Portuguese translations for "${word}":`;

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

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.warn("Resposta vazia do Gemini para traduções");
      return [];
    }

    // Tenta extrair JSON da resposta
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const translations = JSON.parse(jsonMatch[0]);
      console.log(`✅ Gemini gerou ${translations.length} traduções para: ${word}`);
      
      // Filtra traduções válidas e remove a palavra original
      const validTranslations = translations
        .filter(t => t && t.trim())
        .filter(t => t.toLowerCase() !== word.toLowerCase()) // Remove a palavra original
        .filter(t => !t.includes(word.toLowerCase())) // Remove traduções que contêm a palavra original
        .filter(t => t.length > 1); // Remove traduções muito curtas
      
      console.log(`📝 Traduções filtradas: ${validTranslations.length} (removidas: ${translations.length - validTranslations.length})`);
      return validTranslations;
    } else {
      console.warn("Não foi possível extrair JSON das traduções do Gemini");
      return [];
    }

  } catch (error) {
    console.error(`❌ Erro ao gerar traduções com Gemini para ${word}:`, error.message);
    return [];
  }
};

// Generate up to 5 phrases: try Reverso first, then complete with Gemini
const generatePhrases = async (word) => {
  // No Vercel, sempre usa Gemini
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log("🌐 Usando Gemini para frases (ambiente Vercel)");
    const geminiPhrases = await generateGeminiPhrases(word);
    return geminiPhrases.slice(0, 5);
  }

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de buscar frases para:`, word);
      const reverso = await getReverso();
      
      if (!reverso) {
        console.log("🤖 Reverso não disponível, usando Gemini");
        const geminiPhrases = await generateGeminiPhrases(word);
        return geminiPhrases.slice(0, 5);
      }
      
      const response = await reverso.getContext(word, "english", "portuguese");
      
      if (!response) {
        console.warn("Resposta vazia do Reverso API");
        retryCount++;
        continue;
      }

      if (!response.ok) {
        console.warn("Resposta inválida do Reverso API:", response);
        retryCount++;
        continue;
      }

      if (!response.examples || !Array.isArray(response.examples)) {
        console.warn("Nenhum exemplo encontrado para a palavra:", word);
        break;
      }

      console.log("Exemplos encontrados:", response.examples.length);
      
      const reversoPhrases = response.examples.map((example) => {
        console.log("Processando exemplo:", example);
        // Tenta diferentes estruturas de dados possíveis
        const english = example.source || example.text || example.english || example.original || "";
        const portuguese = example.target || example.translation || example.portuguese || example.translated || "";
        
        return {
          english: english,
          portuguese: portuguese
        };
      }).filter(phrase => {
        const isValid = phrase.english && phrase.portuguese && phrase.english.trim() && phrase.portuguese.trim();
        if (!isValid) {
          console.log("Frase filtrada (inválida):", phrase);
        }
        return isValid;
      });

      console.log("Frases processadas (Reverso):", reversoPhrases.length);

      // Completa com Gemini até 5 frases
      let finalPhrases = [...reversoPhrases].slice(0, 5);
      console.log(`📊 Frases do Reverso: ${finalPhrases.length}`);
      
      if (finalPhrases.length < 5) {
        const needed = 5 - finalPhrases.length;
        console.log(`🤖 Buscando ${needed} frases adicionais no Gemini para:`, word);
        const geminiPhrases = await generateGeminiPhrases(word);
        console.log(`📝 Gemini retornou ${geminiPhrases.length} frases`);
        
        for (const p of geminiPhrases) {
          if (finalPhrases.length >= 5) break;
          if (p.english && p.portuguese) {
            finalPhrases.push(p);
            console.log(`✅ Adicionada frase do Gemini: ${p.english.substring(0, 50)}...`);
          }
        }
      }

      console.log(`📊 Total de frases finais: ${finalPhrases.length}`);
      return finalPhrases;
    } catch (err) {
      console.error(`Erro na tentativa ${retryCount + 1}:`, err.message);
      retryCount++;
      
      if (retryCount === maxRetries) {
        console.error("Número máximo de tentativas atingido para:", word);
        console.log("🤖 Usando Gemini como fallback para:", word);
        const geminiPhrases = await generateGeminiPhrases(word);
        return geminiPhrases.slice(0, 5);
      }
      
      // Espera 2 segundos antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Fallback final: Gemini
  console.log("🤖 Usando Gemini como fallback final para:", word);
  const geminiPhrases = await generateGeminiPhrases(word);
  return geminiPhrases.slice(0, 5);
};

// Generate translations: try Reverso first, then complete with Gemini (até 15 traduções)
const generateTranslate = async (word) => {
  // No Vercel, sempre usa Gemini
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log("🌐 Usando Gemini para traduções (ambiente Vercel)");
    const geminiTranslations = await generateGeminiTranslations(word);
    return geminiTranslations.slice(0, 15);
  }

  try {
    const reverso = await getReverso();
    
    if (!reverso) {
      console.log("🤖 Reverso não disponível, usando Gemini");
      const geminiTranslations = await generateGeminiTranslations(word);
      return geminiTranslations.slice(0, 15);
    }
    
    const response = await reverso.getTranslation(
      word,
      "english",
      "portuguese"
    );
    
    // Verifica se a resposta e translations existem
    if (!response || !response.translations || !Array.isArray(response.translations)) {
      console.warn("Resposta de tradução inválida para:", word);
      console.log("🤖 Usando Gemini para traduções de:", word);
      const geminiTranslations = await generateGeminiTranslations(word);
      return geminiTranslations.slice(0, 15); // Até 15 traduções
    }
    
    // Filtra traduções do Reverso, removendo a palavra original
    const reversoTranslations = [...new Set(response.translations)]
      .filter(t => t && t.trim())
      .filter(t => t.toLowerCase() !== word.toLowerCase()) // Remove a palavra original
      .filter(t => !t.includes(word.toLowerCase())) // Remove traduções que contêm a palavra original
      .filter(t => t.length > 1); // Remove traduções muito curtas
    
    if (reversoTranslations.length === 0) {
      console.log("🤖 Nenhuma tradução válida do Reverso, usando Gemini para:", word);
      const geminiTranslations = await generateGeminiTranslations(word);
      return geminiTranslations.slice(0, 15); // Até 15 traduções
    }
    
    // Sempre completa com Gemini para ter mais traduções
    console.log(`📝 Reverso retornou ${reversoTranslations.length} traduções válidas, completando com Gemini para:`, word);
    const geminiTranslations = await generateGeminiTranslations(word);
    
    // Combina traduções, removendo duplicatas e a palavra original
    const allTranslations = [...reversoTranslations];
    for (const geminiTrans of geminiTranslations) {
      if (!allTranslations.some(t => t.toLowerCase() === geminiTrans.toLowerCase()) &&
          geminiTrans.toLowerCase() !== word.toLowerCase() &&
          !geminiTrans.includes(word.toLowerCase())) {
        allTranslations.push(geminiTrans);
      }
      if (allTranslations.length >= 15) break; // Até 15 traduções
    }
    
    console.log(`📊 Total de traduções geradas: ${allTranslations.length}`);
    return allTranslations;
    
  } catch (error) {
    console.error(`Erro ao traduzir palavra: ${word}. Erro: ${error.message}`);
    console.log("🤖 Usando Gemini como fallback para traduções de:", word);
    const geminiTranslations = await generateGeminiTranslations(word);
    return geminiTranslations.slice(0, 15); // Até 15 traduções
  }
};

// Get all information about a word including translation, phrases, IPA pronunciation, etc.
const getInfoWord = async (word) => {
  try {
    let text = word.toLowerCase().trim();

    // Check cache first
    const cachedData = getFromCache(text);
    if (cachedData) {
      return cachedData;
    }

    // Executa todas as operações em paralelo
    const [translation, phrasesResult, ipaDetails, audioResult] = await Promise.all([
      generateTranslate(text),
      generatePhrases(text),
      dictionary.getDetailsOfTranscription(text),
      gAudio.generateAudio(text).catch(err => {
        console.warn(`Erro ao gerar áudio para ${text}:`, err.message);
        return null;
      })
    ]);

    const [ipa, pronounce] = ipaDetails || ["IPA indisponível", "Pronúncia indisponível"];

    // Create an object containing all information about the word
    const wordInfo = {
      word: text,
      audio: (audioResult && !process.env.VERCEL && process.env.NODE_ENV !== 'production') ? "../audio.mp3" : null,
      translation: translation || ["Tradução indisponível"],
      phrases: Array.isArray(phrasesResult) ? phrasesResult : [],
      ipa: ipa,
      pronounce: pronounce,
    };

    console.log("Informações da palavra geradas:", {
      word: text,
      translationCount: wordInfo.translation.length,
      phrasesCount: wordInfo.phrases.length,
      hasAudio: !!wordInfo.audio
    });

    // Save to cache
    saveToCache(text, wordInfo);

    return wordInfo;
  } catch (error) {
    console.error("Erro ao obter informações da palavra:", error);
    // Retorna um objeto com valores padrão em caso de erro
    return {
      word: word.toLowerCase().trim(),
      audio: null,
      translation: ["Tradução indisponível"],
      phrases: [],
      ipa: "IPA indisponível",
      pronounce: "Pronúncia indisponível",
    };
  }
};

// Generate more unique phrases for a word
const generateMorePhrases = async (word, existingPhrases = []) => {
  try {
    console.log(`🔄 Gerando mais frases únicas para: ${word}`);
    
    // Verifica se já temos muitas frases (limite de 20)
    if (existingPhrases.length >= 20) {
      console.log("📊 Limite de frases atingido para:", word);
      return {
        phrases: [],
        hasMore: false,
        message: "Limite de frases atingido (20 frases). Todas as variações disponíveis foram mostradas."
      };
    }
    
    // Gera novas frases excluindo as já existentes
    const newPhrases = await generateGeminiPhrases(word, existingPhrases);
    
    if (newPhrases.length === 0) {
      return {
        phrases: [],
        hasMore: false,
        message: "Não foi possível gerar mais frases únicas para esta palavra."
      };
    }
    
    // Filtra duplicatas adicionais
    const uniquePhrases = newPhrases.filter(newPhrase => 
      !existingPhrases.some(existing => 
        existing.english.toLowerCase() === newPhrase.english.toLowerCase()
      )
    );
    
    console.log(`✅ Encontradas ${uniquePhrases.length} frases únicas novas para: ${word}`);
    console.log('📝 Frases únicas geradas:', uniquePhrases);
    
    const finalPhrases = uniquePhrases.slice(0, 5);
    console.log('📤 Retornando frases:', finalPhrases);
    
    return {
      phrases: finalPhrases, // Máximo 5 por vez
      hasMore: uniquePhrases.length >= 5,
      message: uniquePhrases.length < 5 ? "Poucas variações restantes disponíveis." : null
    };
    
  } catch (error) {
    console.error(`❌ Erro ao gerar mais frases para ${word}:`, error.message);
    return {
      phrases: [],
      hasMore: false,
      message: "Erro ao gerar mais frases. Tente novamente."
    };
  }
};


module.exports = {
  generatePhrases,
  generateTranslate,
  getInfoWord,
  hasPhrases,
  generateGeminiTranslations,
  generateMorePhrases,
};
