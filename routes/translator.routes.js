const express = require("express");
const router = express.Router();
const translatorController = require("../controllers/translator.controller");
const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// route to translator
router.get("/tradutor", (req, res) => {
  res.render("translator");
});

router.post("/significado", async (req, res) => {
  try {
    const text = req.body.texts;
    const translatedText = await translatorController.translateText(text);
    res.json({ translatedText });
  } catch (err) {
    console.error(err);
    res.render("error");
  }
});

module.exports = router;
