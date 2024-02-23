const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const wordInfoController = require("../controllers/wordDetails.controller");
const inputIsValid = require("../middlewere/checkInput.middleware");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

// router to save the transcription of word
router.post("/text/save", inputIsValid, async (req, res) => {
  try {
    const wordInfo = await wordInfoController.getInfoWord(req.body.text);
    res.render("../views/wordDetails.ejs", {
      wordInfo: wordInfo,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

module.exports = router;
