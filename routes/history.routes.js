const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const prisma = require('../lib/prisma');

router.get('/historico', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let searches = [];
    let total = 0;
    let totalPages = 1;

    try {
      const [searchesResult, totalResult] = await Promise.all([
        prisma.search.findMany({
          where: { userId: req.userId },
          orderBy: { createdAt: 'desc' },
          include: { user: true },
          take: limit,
          skip
        }),
        prisma.search.count({
          where: { userId: req.userId }
        })
      ]);

      searches = searchesResult;
      total = totalResult;
      totalPages = Math.ceil(total / limit);
    } catch (dbError) {
      console.warn("⚠️ Banco de dados indisponível, exibindo histórico vazio:", dbError.message);
      // Continua com dados vazios se o banco falhar
    }

    res.render('history', { 
      searches,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    res.redirect('/');
  }
});

module.exports = router; 