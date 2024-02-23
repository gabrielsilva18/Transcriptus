const express = require("express");
const router = express.Router();
const wordDetails = require("../controllers/wordDetails.controller");
const wordIsValid = require("../utils/validationInput");

router.get("/contexto", (req, res) => {
  res.render("context");
});

router.post("/frases", async (req, res) => {
  if (!wordIsValid(req.body.text)) {
    return res.status(400).json({ error: "A palavra digitada é inválida" });
  }

  let word = req.body.text;

  let phrases = await wordDetails.generatePhrases(word);

  res.json({ phrases });
});

module.exports = router;
