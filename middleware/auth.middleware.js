const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  const token = req.session.token;

  if (!token) {
    req.flash("error", "Você precisa estar logado para acessar esta página");
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Se necessário, busque os dados do usuário no banco de dados
    // e armazene-os em session para otimização
    if (!req.session.userData) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, name: true, email: true }, // Ajuste conforme necessário
      });
      req.session.userData = user; // Armazene os dados na sessão
    } else {
      req.userData = req.session.userData; // Acesse os dados diretamente da sessão
    }

    next();
  } catch (err) {
    req.flash("error", "Sessão expirada. Por favor, faça login novamente");
    res.redirect("/login");
  }
};

module.exports = authMiddleware;
