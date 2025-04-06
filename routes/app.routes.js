const express = require("express");
const router = express.Router();
const verbeteController = require("../controllers/verbete.controller");
const operationsController = require("../controllers/dictionary.controller");

// rota principal
router.get("/", async (req, res) => {
  try {
    // Primeiro, verifica se já existe uma palavra do dia
    let dailyWordInfo = await verbeteController.getDailyWordInfo();
    
    // Se não existir, gera uma nova
    if (!dailyWordInfo) {
      await verbeteController.generateRandomWordtoDailyWord();
      dailyWordInfo = await verbeteController.getDailyWordInfo();
    }

    // Pega mensagens de erro do flash
    const textError = req.flash("textError");

    res.render("index", { 
      dailyWordInfo,
      textError: textError.length > 0 ? textError[0] : null 
    });

  } catch (error) {
    console.error("Erro ao carregar palavra do dia:", error);
    // Em caso de erro, envia uma palavra padrão para não quebrar a página
    res.render("index", {
      dailyWordInfo: {
        dailyWord: "welcome",
        definition: "An expression of greeting",
        date: new Date().toISOString().split('T')[0]
      },
      textError: null
    });
  }
});

router.get("/pronuncia", (req, res) => {
  res.redirect("/");
});

router.post("/random", async (req, res) => {
  const randomWord = operationsController.generateRandomWord();
  res.json({ randomWord });
});

module.exports = router;
