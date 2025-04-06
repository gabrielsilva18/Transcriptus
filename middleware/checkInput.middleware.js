const validation = require("../utils/validationInput");

// check if input is valid
const inputIsValid = (req, res, next) => {
  const input = req.body.text?.toLowerCase().trim();
  if (!validation(input)) {
    let textError = "A palavra digitada é inválida ou não está disponível.";
    req.flash("textError", textError);
    res.redirect("/");
  } else {
    next();
  }
};

module.exports = inputIsValid;
