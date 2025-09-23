const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');

const prisma = new PrismaClient();

router.get('/login', (req, res) => {
  const returnTo = req.query.returnTo || '/';
  res.render('auth/login', { returnTo });
});

// Rota para verificar se o usuário está logado (mantida para compatibilidade)
router.get('/check', (req, res) => {
  const token = req.cookies && req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ loggedIn: true, userId: decoded.userId });
  } catch (err) {
    res.status(401).json({ loggedIn: false });
  }
});

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.redirect('/');
  } catch (error) {
    res.render('auth/register', { error: 'Erro ao registrar usuário' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, returnTo } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.render('auth/login', { error: 'Usuário não encontrado', returnTo });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.render('auth/login', { error: 'Senha inválida', returnTo });
    }

    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // Redireciona para a página de origem ou para a home
    const redirectUrl = returnTo && returnTo !== '/' ? returnTo : '/';
    res.redirect(redirectUrl);
  } catch (error) {
    res.render('auth/login', { error: 'Erro ao fazer login', returnTo: req.body.returnTo });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.redirect('/login');
});

// Rota do perfil (requer autenticação)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Busca dados atualizados do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    
    if (!user) {
      req.flash('error', 'Usuário não encontrado');
      return res.redirect('/login');
    }
    
    res.render('profile', { user });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    req.flash('error', 'Erro ao carregar perfil');
    res.redirect('/');
  }
});

module.exports = router; 