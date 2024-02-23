const Joi = require("joi");
var checkWord = require("check-word"),
  words = checkWord("en");

const wordSchema = Joi.string().alphanum().min(3).max(30).required();

function wordIsValid(word) {
  word = word.toLowerCase().trim();

  const { error } = wordSchema.validate(word);
  if (error) return false;

  const validInDictionary = words.check(word);
  if (!validInDictionary) return false;

  return true;
}

module.exports = wordIsValid;
