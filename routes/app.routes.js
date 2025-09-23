const express = require("express");
const router = express.Router();
const verbeteController = require("../controllers/verbete.controller");
const operationsController = require("../controllers/dictionary.controller");

// Rota principal: sempre gera nova palavra
router.get("/", async (req, res) => {
  try {
    const dailyWordInfo = await verbeteController.generateRandomWordtoDailyWord();

    const textError = null;

    res.render("index", { 
      dailyWordInfo,
      textError
    });
  } catch (error) {
    console.error("Erro ao carregar palavra do dia:", error);
    res.render("index", {
      dailyWordInfo: {
        dailyWord: "welcome",
        definition: "An expression of greeting",
        phonetic: "/ˈwelkəm/",
        date: new Date().toISOString().split("T")[0],
      },
      textError: null
    });
  }
});

router.get("/pronuncia", (req, res) => {
  res.redirect("/");
});

// Gera uma palavra aleatória otimizada (SEM tradução)
router.post("/random", async (req, res) => {
  try {
    console.log("🎲 Iniciando sorteio de palavra...");
    
    let randomWord;
    let definition;
    let phonetic;
    let maxAttempts = 3; // Reduzido de 10 para 3 (muito mais rápido)
    let attemptCount = 0;

    while (maxAttempts > 0) {
      attemptCount++;
      try {
        randomWord = operationsController.generateRandomWord();
        console.log(`🎲 Tentativa ${attemptCount}: ${randomWord}`);

        // Busca definição pela API (com rate limiting já implementado)
        const wordInfo = await verbeteController.getWordInfo(randomWord);
        definition = await verbeteController.getDefinition(wordInfo);

        // Busca fonética pelo dicionário interno (sem API externa)
        const [ipaSymbols, phoneticTranscription] = await operationsController.getDetailsOfTranscription(randomWord.toLowerCase());
        phonetic = phoneticTranscription || ipaSymbols || "Phonetic not available";

        if (definition) {
          console.log(`✅ Palavra válida encontrada: ${randomWord}`);
          break;
        }
        
        console.log(`❌ Tentativa falhou para: ${randomWord}`);
        maxAttempts--;
        
        // Delay mínimo entre tentativas (500ms vs 1000ms anterior)
        if (maxAttempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Erro na tentativa ${attemptCount}:`, error.message);
        maxAttempts--;
      }
    }

    // Fallback otimizado (sem tradução)
    if (!definition) {
      console.log("🔄 Usando fallback para sorteio");
      const defaults = [
        { word: "welcome", def: "An expression of greeting", phon: "/ˈwelkəm/" },
        { word: "hello", def: "Used as a greeting", phon: "/həˈloʊ/" },
        { word: "good", def: "To be desired or approved of", phon: "/ɡʊd/" },
        { word: "happy", def: "Feeling or showing pleasure", phon: "/ˈhæpi/" },
        { word: "learn", def: "To gain knowledge or skills", phon: "/lɜrn/" },
        { word: "study", def: "To apply oneself to learning", phon: "/ˈstʌdi/" }
      ];
      const fallback = defaults[Math.floor(Math.random() * defaults.length)];
      return res.json({
        randomWord: fallback.word,
        definition: fallback.def,
        phonetic: fallback.phon
        // REMOVIDO: translatedDefinition - forçar uso do tradutor
      });
    }

    console.log(`📝 Sorteio concluído: ${randomWord}`);
    res.json({
      randomWord,
      definition,
      phonetic
      // REMOVIDO: translatedDefinition - forçar uso do tradutor
    });
  } catch (error) {
    console.error("❌ Erro crítico ao gerar palavra aleatória:", error.message);
    res.json({
      randomWord: "welcome",
      definition: "An expression of greeting",
      phonetic: "/ˈwelkəm/"
      // REMOVIDO: translatedDefinition
    });
  }
});

module.exports = router;
