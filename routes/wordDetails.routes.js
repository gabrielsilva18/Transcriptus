const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const wordInfoController = require("../controllers/wordDetails.controller");
const inputIsValid = require("../middleware/checkInput.middleware");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// Rota para exibir detalhes da palavra
router.get("/word/:word", async (req, res) => {
  try {
    const word = req.params.word;
    const wordInfo = await wordInfoController.getInfoWord(word);
    res.render("wordDetails", { wordInfo });
  } catch (error) {
    console.error(error);
    req.flash("textError", "Palavra não encontrada");
    res.redirect("/");
  }
});

// router to save the transcription of word
router.post("/text/save", inputIsValid, async (req, res) => {
  try {
    const word = req.body.text;
    const userId = res.locals.user?.id;

    // Salva no histórico se o usuário estiver logado
    if (userId) {
      await prisma.search.create({
        data: {
          word: word,
          type: "PRONUNCIATION",
          userId: userId,
        },
      });
    }

    const wordInfo = await wordInfoController.getInfoWord(word);
    res.redirect(`/word/${word}`);
  } catch (error) {
    console.error(error);
    req.flash("textError", "Palavra não encontrada");
    res.redirect("/");
  }
});

module.exports = router;
