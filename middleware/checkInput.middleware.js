const validation = require("../utils/validationInput");

// check if input is valid
const inputIsValid = (req, res, next) => {
  const input = req.body.text?.toLowerCase().trim();
  if (!validation(input)) {
    let textError = "A palavra digitada é inválida ou não está disponível.";
    
    // Try flash first, fallback to query parameter
    if (req.flash) {
      req.flash("textError", textError);
    }
    
    // Redirect with error message as query parameter
    res.redirect(`/?error=${encodeURIComponent(textError)}`);
  } else {
    next();
  }
};

module.exports = inputIsValid;
