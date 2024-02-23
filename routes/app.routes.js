const express = require("express");
const router = express.Router();
const verbeteController = require("../controllers/verbete.controller");
const operationsController = require("../controllers/dictionary.controller");

// rota principal
router.get("/", async (req, res) => {
  try {
    const dailyWordInfo = await verbeteController.getDailyWordInfo();
    const randomWord = "";
    let textError = req.flash("textError");
    res.render("index", {
      dailyWordInfo: dailyWordInfo,
      randomWord: randomWord,
      textError: textError,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
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
