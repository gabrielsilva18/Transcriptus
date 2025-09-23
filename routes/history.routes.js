const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

router.get('/historico', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [searches, total] = await Promise.all([
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

    const totalPages = Math.ceil(total / limit);

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