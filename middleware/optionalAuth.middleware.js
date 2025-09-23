const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = async (req, res, next) => {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    console.warn('Token inválido:', err.message);
    req.user = null;
    next();
  }
};

module.exports = optionalAuthMiddleware;
